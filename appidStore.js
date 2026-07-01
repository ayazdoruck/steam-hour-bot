const path = require('path');
const { readJsonSafe, writeJsonAtomic, getDataDir } = require('./fileStore');

const FILE_PATH = path.join(getDataDir(), 'appids.json');

function getAppids(accountName) {
    const data = readJsonSafe(FILE_PATH);
    const entry = data[accountName];
    return entry ? entry.appids : [];
}

function saveAppids(accountName, appids) {
    const data = readJsonSafe(FILE_PATH);
    data[accountName] = { appids, updatedAt: new Date().toISOString() };
    writeJsonAtomic(FILE_PATH, data);
}

module.exports = { getAppids, saveAppids };
