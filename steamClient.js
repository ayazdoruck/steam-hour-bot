const EventEmitter = require('events');
const SteamUser = require('steam-user');
const EResult = require('steam-user/enums/EResult.js');
const sessionStore = require('./sessionStore');
const appidStore = require('./appidStore');
const playtimeStore = require('./playtimeStore');

const ERROR_CODES_BY_ERESULT = {
    [EResult.InvalidPassword]: 'INVALID_CREDENTIALS',
    [EResult.AccountNotFound]: 'INVALID_CREDENTIALS',
    [EResult.RateLimitExceeded]: 'RATE_LIMITED',
    [EResult.LoggedInElsewhere]: 'LOGGED_IN_ELSEWHERE',
    [EResult.AlreadyLoggedInElsewhere]: 'LOGGED_IN_ELSEWHERE',
    [EResult.AccountLogonDenied]: 'STEAM_GUARD_ERROR',
    [EResult.AccountLoginDeniedNeedTwoFactor]: 'STEAM_GUARD_ERROR',
    [EResult.TwoFactorCodeMismatch]: 'STEAM_GUARD_ERROR',
    [EResult.AccountDisabled]: 'ACCOUNT_DISABLED',
    [EResult.Banned]: 'ACCOUNT_DISABLED',
    [EResult.IPBanned]: 'ACCOUNT_DISABLED',
    [EResult.NoConnection]: 'NO_CONNECTION',
    [EResult.ServiceUnavailable]: 'NO_CONNECTION',
    [EResult.Timeout]: 'NO_CONNECTION'
};

function classifyError(err) {
    return ERROR_CODES_BY_ERESULT[err.eresult] || 'UNKNOWN';
}

// connectionState: 'idle' | 'connecting' | 'online' | 'reconnecting' | 'error'
class SteamClient extends EventEmitter {
    constructor() {
        super();
        this.client = new SteamUser();
        this.connectionState = 'idle';
        this.accountName = null;
        this.desiredGames = [];
        this.farmingStartedAt = null;
        this.guardCallbacks = {};
        this.guardCallbackId = 1;
        this._registerListeners();
    }

    _registerListeners() {
        this.client.on('steamGuard', (domain, callback) => {
            const callbackId = this.guardCallbackId++;
            this.guardCallbacks[callbackId] = callback;

            // Terk edilmiş Steam Guard akışlarının süresiz birikmesini önle
            setTimeout(() => {
                if (this.guardCallbacks[callbackId]) {
                    delete this.guardCallbacks[callbackId];
                    this.emit('guardExpired', callbackId);
                }
            }, 5 * 60 * 1000);

            this.emit('steamGuard', { domain: domain || null, callbackId });
        });

        this.client.on('refreshToken', (token) => {
            if (this.accountName) {
                sessionStore.saveToken(this.accountName, token);
                // Uygulama tek hesap destekler - farklı bir hesapla giriş yapıldıysa eskilerini temizle
                sessionStore.clearAllExcept(this.accountName);
            }
        });

        this.client.on('loggedOn', () => {
            this.connectionState = 'online';
            this.client.setPersona(SteamUser.EPersonaState.Online);

            // Bağlantı yeniden kurulduysa (ör. relogin) çalışması gereken oyunları tekrar bildir
            if (this.desiredGames.length > 0) {
                this.client.gamesPlayed(this.desiredGames, true);
                this.farmingStartedAt = Date.now();
            }

            this.emit('loggedOn', {
                accountName: this.accountName,
                games: this.desiredGames,
                farmingStartedAt: this.farmingStartedAt,
                totalSeconds: this.accountName ? playtimeStore.getTotalSeconds(this.accountName) : 0
            });
        });

        this.client.on('playingState', (blocked, playingApp) => {
            if (blocked) {
                console.log('Account is playing elsewhere (appid ' + playingApp + '), kicking that session');
            }
        });

        this.client.on('disconnected', (eresult, msg) => {
            if (this.connectionState === 'online' || this.connectionState === 'reconnecting') {
                this._recordPlaytime();
                this.connectionState = 'reconnecting';
                this.emit('reconnecting', { eresult, msg });
            }
        });

        this.client.on('error', (err) => {
            const wasOnline = this.connectionState === 'online' || this.connectionState === 'reconnecting';
            const code = classifyError(err);

            if (wasOnline) {
                this._recordPlaytime();

                // autoRelogin pes etti (token geçersiz/iptal edilmiş vb.) - kalıcı hata
                this.connectionState = 'error';
                if (this.accountName) {
                    sessionStore.clearToken(this.accountName);
                }
                this.desiredGames = [];
                this.emit('fatalError', { message: err.message, code });
            } else {
                this.connectionState = 'error';
                this.emit('loginError', { message: err.message, code });
            }
        });
    }

    getConnectionState() {
        return this.connectionState;
    }

    getTotalSeconds() {
        return this.accountName ? playtimeStore.getTotalSeconds(this.accountName) : 0;
    }

    getFarmingStartedAt() {
        return this.farmingStartedAt;
    }

    _recordPlaytime() {
        if (this.farmingStartedAt && this.accountName) {
            const elapsedSeconds = Math.floor((Date.now() - this.farmingStartedAt) / 1000);
            playtimeStore.addSeconds(this.accountName, elapsedSeconds);
        }
        this.farmingStartedAt = null;
    }

    _disconnectCleanly() {
        return new Promise((resolve) => {
            if (this.connectionState !== 'online' && this.connectionState !== 'reconnecting') {
                resolve();
                return;
            }

            this._recordPlaytime();

            const timeout = setTimeout(resolve, 3000);
            this.client.once('disconnected', () => {
                clearTimeout(timeout);
                resolve();
            });

            this.client.gamesPlayed([], true);
            this.client.logOff();
        });
    }

    async login({ accountName, password }) {
        await this._disconnectCleanly();

        this.accountName = accountName;
        this.desiredGames = [];
        this.connectionState = 'connecting';
        this.client.logOn({ accountName, password });
    }

    async loginWithToken(accountName, refreshToken) {
        await this._disconnectCleanly();

        this.accountName = accountName;
        this.desiredGames = [];
        this.connectionState = 'connecting';
        this.client.logOn({ refreshToken });
    }

    async logout() {
        await this._disconnectCleanly();
        if (this.accountName) {
            sessionStore.clearToken(this.accountName);
        }
        this.connectionState = 'idle';
        this.accountName = null;
        this.desiredGames = [];
    }

    submitSteamGuardCode(callbackId, code) {
        const callback = this.guardCallbacks[callbackId];
        if (!callback) {
            return false;
        }
        callback(code);
        delete this.guardCallbacks[callbackId];
        return true;
    }

    startFarming(appids) {
        if (this.connectionState !== 'online') {
            const err = new Error('NOT_CONNECTED');
            err.code = 'NOT_CONNECTED';
            throw err;
        }
        // force=true: bu hesapta başka bir oturum (ör. temiz kapatılmamış eski bir bağlantı)
        // zaten "oynuyor" olarak işaretliyse onu kick edip yetkiyi bu oturuma alır
        this.client.gamesPlayed(appids, true);
        if (this.desiredGames.length === 0) {
            this.farmingStartedAt = Date.now();
        }
        this.desiredGames = appids;
        if (this.accountName) {
            appidStore.saveAppids(this.accountName, appids);
        }
        return { appids, farmingStartedAt: this.farmingStartedAt };
    }

    stopFarming() {
        if (this.connectionState !== 'online') {
            const err = new Error('NOT_CONNECTED');
            err.code = 'NOT_CONNECTED';
            throw err;
        }
        this.client.gamesPlayed([], true);
        this.desiredGames = [];
        this._recordPlaytime();
        return { totalSeconds: this.getTotalSeconds() };
    }
}

module.exports = new SteamClient();
