const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const SteamUser = require('steam-user');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

let client = new SteamUser();
let wsGlobal;
let isBotRunning = false;
let currentGames = [];

wss.on('connection', (ws) => {
    wsGlobal = ws;
    console.log('New client connected'); // Yeni istemci bağlandı

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data.type); // Alınan mesaj:

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
            console.error('Message processing error:', error); // Mesaj işleme hatası
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid request' // Geçersiz istek
            }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected'); // İstemci bağlantısı kesildi
        if (ws === wsGlobal) {
            wsGlobal = null;
        }
    });
});

function handleLogin(data, ws) {
    client = new SteamUser();

    // Hata dinleyicilerini temizle
    client.removeAllListeners('error');
    client.removeAllListeners('steamGuard');

    let guardCallbackId = 1;

    client.logOn({
        accountName: data.username,
        password: data.password
    });

    client.on('steamGuard', (domain, callback) => {
        const callbackId = guardCallbackId++;
        client.guardCallbacks = client.guardCallbacks || {};
        client.guardCallbacks[callbackId] = callback;

        ws.send(JSON.stringify({
            type: 'steamGuard',
            domain: domain || null,
            callbackId: callbackId
        }));
    });

    client.on('loggedOn', () => {
        console.log('Successfully logged in'); // Başarıyla giriş yapıldı
        ws.send(JSON.stringify({
            type: 'loggedOn',
            username: data.username
        }));
        client.setPersona(SteamUser.EPersonaState.Online);
    });

    client.on('error', (err) => {
        console.error('Steam error:', err); // Steam hatası
        let errorMessage = 'Steam connection error'; // Steam bağlantı hatası

        if (err.message.includes('password')) {
            errorMessage = 'Incorrect username or password'; // Hatalı kullanıcı adı veya şifre
        } else if (err.message.includes('rate limit')) {
            errorMessage = 'Too many attempts, please wait'; // Çok fazla deneme yapıldı, lütfen bekleyin
        } else if (err.message.includes('SteamGuard')) {
            errorMessage = 'Steam Guard error, please try again'; // Steam Guard hatası, lütfen tekrar deneyin
        }

        ws.send(JSON.stringify({
            type: 'loginError',
            message: errorMessage
        }));
    });
}

function handleLogout(ws) {
    if (client) {
        // Önce oyunlardan ayrıl
        client.gamesPlayed([]);
        // Sonra tamamen çıkış yap
        client.logOff();
        console.log('User logged out completely'); // Kullanıcı tamamen çıkış yaptı

        // SteamUser istemcisini sıfırla
        client = new SteamUser();
    }
    currentGames = [];
    isBotRunning = false;

    // Kullanıcıya çıkış yapıldığını bildir
    if (ws) {
        ws.send(JSON.stringify({ type: 'loggedOut' }));
    } else if (wsGlobal) {
        wsGlobal.send(JSON.stringify({ type: 'loggedOut' }));
    }
}

function handleSteamGuardResponse(data) {
    if (client.guardCallbacks && client.guardCallbacks[data.callbackId]) {
        client.guardCallbacks[data.callbackId](data.code);
        delete client.guardCallbacks[data.callbackId];
    } else {
        console.error('Invalid Steam Guard callback ID'); // Geçersiz Steam Guard callback ID
        if (wsGlobal) {
            wsGlobal.send(JSON.stringify({
                type: 'error',
                message: 'Invalid Steam Guard request' // Geçersiz Steam Guard isteği
            }));
        }
    }
}

function handleStartFarming(data, ws) {
    try {
        const gameIDs = data.appids.split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id) && id > 0);

        if (gameIDs.length === 0) {
            throw new Error('Invalid AppID format'); // Geçersiz AppID formatı
        }

        client.gamesPlayed(gameIDs);
        currentGames = gameIDs;
        isBotRunning = true;
        ws.send(JSON.stringify({
            type: 'botStarted',
            games: currentGames
        }));
        console.log('Bot started, games:', currentGames); // Bot başlatıldı, oyunlar:
    } catch (error) {
        console.error('Bot startup error:', error); // Bot başlatma hatası
        ws.send(JSON.stringify({
            type: 'error',
            message: error.message
        }));
    }
}

function handleStopFarming(ws) {
    client.gamesPlayed([]);
    currentGames = [];
    isBotRunning = false;
    ws.send(JSON.stringify({ type: 'botStopped' }));
    console.log('Bot stopped'); // Bot durduruldu
}

function sendStatus(ws) {
    ws.send(JSON.stringify({
        type: 'status',
        running: isBotRunning,
        games: currentGames
    }));
}

// Hata yönetimi
process.on('uncaughtException', (err) => {
    console.error('Uncaught error:', err); // Yakalanmamış hata
    if (wsGlobal) {
        wsGlobal.send(JSON.stringify({
            type: 'error',
            message: 'Server error: ' + err.message // Sunucu hatası:
        }));
    }
});

// WebSocket sunucusu kapatıldığında temizlik
wss.on('close', () => {
    console.log('WebSocket server closed'); // WebSocket sunucusu kapatıldı
    if (client) {
        client.gamesPlayed([]);
        client.logOff();
    }
    currentGames = [];
    isBotRunning = false;
});

server.listen(3443, () => {
    console.log('Server running: http://localhost:3443'); // Sunucu çalışıyor:
});
