const path = require('path');
const { readJsonSafe, writeJsonAtomic, getDataDir } = require('./fileStore');

const FILE_PATH = path.join(getDataDir(), 'sessions.json');

function getToken(accountName) {
    const data = readJsonSafe(FILE_PATH);
    const entry = data[accountName];
    return entry ? entry.refreshToken : null;
}

function saveToken(accountName, refreshToken) {
    const data = readJsonSafe(FILE_PATH);
    data[accountName] = { refreshToken, updatedAt: new Date().toISOString() };
    writeJsonAtomic(FILE_PATH, data);
}

function clearToken(accountName) {
    const data = readJsonSafe(FILE_PATH);
    delete data[accountName];
    writeJsonAtomic(FILE_PATH, data);
}

// Uygulama tek seferde tek hesap destekliyor - farklı bir hesapla giriş yapıldığında
// eski hesapların token'larının sonsuza kadar dosyada birikmesini önler
function clearAllExcept(accountName) {
    const data = readJsonSafe(FILE_PATH);
    let changed = false;
    for (const key of Object.keys(data)) {
        if (key !== accountName) {
            delete data[key];
            changed = true;
        }
    }
    if (changed) {
        writeJsonAtomic(FILE_PATH, data);
    }
}

function getLastAccount() {
    const data = readJsonSafe(FILE_PATH);
    let latest = null;
    for (const [accountName, entry] of Object.entries(data)) {
        if (!latest || entry.updatedAt > data[latest].updatedAt) {
            latest = accountName;
        }
    }
    return latest;
}

module.exports = { getToken, saveToken, clearToken, clearAllExcept, getLastAccount };
