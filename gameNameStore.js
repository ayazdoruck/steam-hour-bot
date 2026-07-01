const path = require('path');
const { readJsonSafe, writeJsonAtomic, getDataDir } = require('./fileStore');

const FILE_PATH = path.join(getDataDir(), 'gameNames.json');

async function resolveNames(appids) {
    const cache = readJsonSafe(FILE_PATH);
    const result = {};
    let cacheDirty = false;

    for (const appid of appids) {
        if (cache[appid]) {
            result[appid] = cache[appid];
            continue;
        }

        try {
            const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&filters=basic`);
            if (response.ok) {
                const json = await response.json();
                const name = json && json[appid] && json[appid].success ? json[appid].data.name : null;
                if (name) {
                    cache[appid] = name;
                    result[appid] = name;
                    cacheDirty = true;
                }
            }
        } catch (error) {
            console.error('Game name lookup failed for', appid, error.message);
        }
    }

    if (cacheDirty) {
        writeJsonAtomic(FILE_PATH, cache);
    }

    return result;
}

module.exports = { resolveNames };
