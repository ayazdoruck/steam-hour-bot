const path = require('path');
const { readJsonSafe, writeJsonAtomic, getDataDir } = require('./fileStore');

const FILE_PATH = path.join(getDataDir(), 'playtime.json');

function getTotalSeconds(accountName) {
    const data = readJsonSafe(FILE_PATH);
    const entry = data[accountName];
    return entry ? entry.totalSeconds : 0;
}

function addSeconds(accountName, seconds) {
    if (seconds <= 0) return;
    const data = readJsonSafe(FILE_PATH);
    const existing = data[accountName] ? data[accountName].totalSeconds : 0;
    data[accountName] = { totalSeconds: existing + seconds, updatedAt: new Date().toISOString() };
    writeJsonAtomic(FILE_PATH, data);
}

module.exports = { getTotalSeconds, addSeconds };
