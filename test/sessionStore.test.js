const fs = require('fs');
const os = require('os');
const path = require('path');

// sessionStore FILE_PATH'ini modül yüklenmeden önce izole bir klasöre yönlendirir
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sessionstore-test-'));
process.env.DATA_DIR = dataDir;

const test = require('node:test');
const assert = require('node:assert/strict');
const sessionStore = require('../sessionStore');

function reset() {
    fs.rmSync(path.join(dataDir, 'sessions.json'), { force: true });
}

test('getToken returns null for unknown account', () => {
    reset();
    assert.equal(sessionStore.getToken('nobody'), null);
});

test('saveToken then getToken round-trips', () => {
    reset();
    sessionStore.saveToken('alice', 'token-123');
    assert.equal(sessionStore.getToken('alice'), 'token-123');
});

test('clearToken removes only the given account', () => {
    reset();
    sessionStore.saveToken('alice', 'token-alice');
    sessionStore.saveToken('bob', 'token-bob');
    sessionStore.clearToken('alice');
    assert.equal(sessionStore.getToken('alice'), null);
    assert.equal(sessionStore.getToken('bob'), 'token-bob');
});

test('clearAllExcept removes every other account token', () => {
    reset();
    sessionStore.saveToken('alice', 'a');
    sessionStore.saveToken('bob', 'b');
    sessionStore.saveToken('carol', 'c');
    sessionStore.clearAllExcept('carol');
    assert.equal(sessionStore.getToken('alice'), null);
    assert.equal(sessionStore.getToken('bob'), null);
    assert.equal(sessionStore.getToken('carol'), 'c');
});

test('getLastAccount returns the most recently updated account', async () => {
    reset();
    sessionStore.saveToken('older', 'x');
    await new Promise(resolve => setTimeout(resolve, 5));
    sessionStore.saveToken('newer', 'y');
    assert.equal(sessionStore.getLastAccount(), 'newer');
});
