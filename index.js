const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const WebSocket = require('ws');
const steamClient = require('./steamClient');
const sessionStore = require('./sessionStore');
const appidStore = require('./appidStore');
const gameNameStore = require('./gameNameStore');

const app = express();

// Opsiyonel HTTP Basic Auth: APP_USERNAME/APP_PASSWORD env değişkenleri verilmişse
// hem statik dosyalar hem de WebSocket bağlantısı bu kimlik doğrulamasının arkasına alınır.
const APP_USERNAME = process.env.APP_USERNAME;
const APP_PASSWORD = process.env.APP_PASSWORD;
const authEnabled = Boolean(APP_USERNAME && APP_PASSWORD);

function checkBasicAuth(authorizationHeader) {
    if (!authEnabled) return true;
    if (!authorizationHeader || !authorizationHeader.startsWith('Basic ')) return false;
    const decoded = Buffer.from(authorizationHeader.slice(6), 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) return false;
    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);
    return user === APP_USERNAME && pass === APP_PASSWORD;
}

if (authEnabled) {
    app.use((req, res, next) => {
        if (checkBasicAuth(req.headers.authorization)) {
            return next();
        }
        res.set('WWW-Authenticate', 'Basic realm="Steam Hour Bot"');
        res.status(401).send('Authentication required');
    });
    console.log('Basic Auth enabled for control panel');
}

app.use(express.static('public'));

// Opsiyonel HTTPS/WSS: SSL_KEY_PATH ve SSL_CERT_PATH verilmişse HTTPS sunucusu kullanılır.
const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH;
const useHttps = Boolean(SSL_KEY_PATH && SSL_CERT_PATH);

const server = useHttps
    ? https.createServer({ key: fs.readFileSync(SSL_KEY_PATH), cert: fs.readFileSync(SSL_CERT_PATH) }, app)
    : http.createServer(app);

const wss = new WebSocket.Server({
    server,
    verifyClient: (info, done) => {
        if (!authEnabled) return done(true);
        done(checkBasicAuth(info.req.headers.authorization));
    }
});

const clients = new Set();
let isBotRunning = false;
let currentGames = [];

const ERROR_MESSAGES = {
    INVALID_CREDENTIALS: 'Incorrect username or password',
    RATE_LIMITED: 'Too many attempts, please wait',
    LOGGED_IN_ELSEWHERE: 'This account logged in elsewhere and kicked this session',
    STEAM_GUARD_ERROR: 'Steam Guard error, please try again',
    ACCOUNT_DISABLED: 'This account is disabled or banned',
    NO_CONNECTION: 'Could not connect to Steam, please try again',
    UNKNOWN: 'Steam connection error'
};

function mapErrorMessage(code) {
    return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN;
}

function broadcast(payload) {
    const data = JSON.stringify(payload);
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }
}

async function buildGamesPayload(appids) {
    const names = appids.length > 0 ? await gameNameStore.resolveNames(appids) : {};
    return appids.map(appid => ({ appid, name: names[appid] || null }));
}

// steamClient tekil (singleton) örneğinin olaylarına sadece bir kez bağlanılır
steamClient.on('steamGuard', ({ domain, callbackId }) => {
    broadcast({ type: 'steamGuard', domain, callbackId });
});

steamClient.on('guardExpired', () => {
    broadcast({ type: 'error', message: 'Steam Guard request expired, please try again' });
});

steamClient.on('loggedOn', async ({ accountName, games, farmingStartedAt, totalSeconds }) => {
    isBotRunning = games.length > 0;
    currentGames = games;
    const lastAppids = appidStore.getAppids(accountName);
    console.log('Successfully logged in:', accountName);

    const gamesPayload = await buildGamesPayload(currentGames);
    broadcast({ type: 'loggedOn', username: accountName, lastAppids, totalSeconds });
    broadcast({ type: 'status', running: isBotRunning, games: gamesPayload, farmingStartedAt, totalSeconds });
});

steamClient.on('loginError', ({ code }) => {
    console.error('Steam login error:', code);
    broadcast({ type: 'loginError', message: mapErrorMessage(code) });
});

steamClient.on('reconnecting', () => {
    console.log('Steam connection lost, attempting to reconnect...');
    broadcast({ type: 'reconnecting' });
});

steamClient.on('fatalError', ({ code }) => {
    console.error('Steam fatal error:', code);
    isBotRunning = false;
    currentGames = [];
    broadcast({ type: 'connectionError', message: mapErrorMessage(code) });
});

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('New client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data.type);

            if (data.type === 'login') {
                handleLogin(data, ws);
            } else if (data.type === 'logout') {
                handleLogout(ws);
            } else if (data.type === 'steamGuardResponse') {
                handleSteamGuardResponse(data);
            } else if (data.type === 'startFarming') {
                handleStartFarming(data, ws);
            } else if (data.type === 'stopFarming') {
                handleStopFarming(ws);
            } else if (data.type === 'getStatus') {
                sendStatus(ws);
            }
        } catch (error) {
            console.error('Message processing error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid request'
            }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

async function handleLogin(data, ws) {
    try {
        await steamClient.login({ accountName: data.username, password: data.password });
    } catch (error) {
        console.error('Login error:', error);
        ws.send(JSON.stringify({ type: 'loginError', message: 'Steam connection error' }));
    }
}

async function handleLogout(ws) {
    await steamClient.logout();
    currentGames = [];
    isBotRunning = false;
    console.log('User logged out completely');
    ws.send(JSON.stringify({ type: 'loggedOut' }));
}

function handleSteamGuardResponse(data) {
    const ok = steamClient.submitSteamGuardCode(data.callbackId, data.code);
    if (!ok) {
        console.error('Invalid Steam Guard callback ID');
        broadcast({ type: 'error', message: 'Invalid Steam Guard request' });
    }
}

async function handleStartFarming(data, ws) {
    try {
        const gameIDs = data.appids.split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id) && id > 0);

        if (gameIDs.length === 0) {
            throw new Error('Invalid AppID format');
        }
        if (gameIDs.length > 32) {
            throw new Error('You can idle at most 32 games at once');
        }

        const { farmingStartedAt } = steamClient.startFarming(gameIDs);
        currentGames = gameIDs;
        isBotRunning = true;
        const gamesPayload = await buildGamesPayload(currentGames);
        ws.send(JSON.stringify({
            type: 'botStarted',
            games: gamesPayload,
            farmingStartedAt
        }));
        console.log('Bot started, games:', currentGames);
    } catch (error) {
        console.error('Bot startup error:', error);
        const message = error.code === 'NOT_CONNECTED'
            ? 'Not connected to Steam, please log in again'
            : error.message;
        ws.send(JSON.stringify({
            type: 'error',
            message
        }));
    }
}

function handleStopFarming(ws) {
    try {
        const { totalSeconds } = steamClient.stopFarming();
        currentGames = [];
        isBotRunning = false;
        ws.send(JSON.stringify({ type: 'botStopped', totalSeconds }));
        console.log('Bot stopped');
    } catch (error) {
        console.error('Bot stop error:', error);
        const message = error.code === 'NOT_CONNECTED'
            ? 'Not connected to Steam, please log in again'
            : error.message;
        ws.send(JSON.stringify({
            type: 'error',
            message
        }));
    }
}

async function sendStatus(ws) {
    const gamesPayload = await buildGamesPayload(currentGames);
    ws.send(JSON.stringify({
        type: 'status',
        running: isBotRunning,
        games: gamesPayload,
        farmingStartedAt: steamClient.getFarmingStartedAt(),
        totalSeconds: steamClient.getTotalSeconds()
    }));
}

process.on('uncaughtException', (err) => {
    console.error('Uncaught error:', err.stack || err);
    broadcast({ type: 'error', message: 'Server error: ' + err.message });
});

wss.on('close', async () => {
    console.log('WebSocket server closed');
    await steamClient.logout();
    currentGames = [];
    isBotRunning = false;
});

const PORT = process.env.PORT || 3443;
server.listen(PORT, async () => {
    console.log(`Server running: ${useHttps ? 'https' : 'http'}://localhost:${PORT}`);

    // Sunucu yeniden başlatıldığında, önceki oturumdan kalan token varsa sessizce yeniden bağlan
    const lastAccount = sessionStore.getLastAccount();
    if (lastAccount) {
        const token = sessionStore.getToken(lastAccount);
        if (token) {
            console.log('Attempting silent relogin for:', lastAccount);

            // Süreç yeniden başlatıldığı için steamClient.desiredGames boş - restart öncesi
            // kaydedilmiş son appid'lerle botu otomatik devam ettir.
            // Bu dinleyici SADECE bu boot denemesi için geçerli - relogin başarısız olursa
            // veya bu ilk loggedOn tetiklenirse kaldırılır, aksi halde saatler sonra kullanıcının
            // yaptığı MANUEL bir girişte de yanlışlıkla tekrar tetiklenip botu istenmeden başlatırdı.
            const resumeAfterBoot = ({ accountName }) => {
                steamClient.off('loggedOn', resumeAfterBoot);
                const savedAppids = appidStore.getAppids(accountName);
                if (savedAppids.length > 0) {
                    try {
                        steamClient.startFarming(savedAppids);
                        currentGames = savedAppids;
                        isBotRunning = true;
                        console.log('Resumed farming after restart:', savedAppids);
                    } catch (error) {
                        console.error('Failed to resume farming after restart:', error);
                    }
                }
            };
            steamClient.once('loggedOn', resumeAfterBoot);

            try {
                await steamClient.loginWithToken(lastAccount, token);
            } catch (error) {
                console.error('Silent relogin failed:', error);
                steamClient.off('loggedOn', resumeAfterBoot);
            }
        }
    }
});
