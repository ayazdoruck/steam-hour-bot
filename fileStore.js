const fs = require('fs');
const path = require('path');

function readJsonSafe(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        return {};
    }
}

function writeJsonAtomic(filePath, data) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
}

// Testlerin gerçek data/ klasörüne dokunmadan izole çalışabilmesi için DATA_DIR ile geçersiz kılınabilir
function getDataDir() {
    return process.env.DATA_DIR || path.join(__dirname, 'data');
}

module.exports = { readJsonSafe, writeJsonAtomic, getDataDir };
