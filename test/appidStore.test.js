const fs = require('fs');
const os = require('os');
const path = require('path');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'appidstore-test-'));
process.env.DATA_DIR = dataDir;

const test = require('node:test');
const assert = require('node:assert/strict');
const appidStore = require('../appidStore');

function reset() {
    fs.rmSync(path.join(dataDir, 'appids.json'), { force: true });
}

test('getAppids returns empty array for unknown account', () => {
    reset();
    assert.deepEqual(appidStore.getAppids('nobody'), []);
});

test('saveAppids then getAppids round-trips', () => {
    reset();
    appidStore.saveAppids('alice', [730, 440]);
    assert.deepEqual(appidStore.getAppids('alice'), [730, 440]);
});

test('saveAppids overwrites the previous value for the same account', () => {
    reset();
    appidStore.saveAppids('alice', [730]);
    appidStore.saveAppids('alice', [440, 570]);
    assert.deepEqual(appidStore.getAppids('alice'), [440, 570]);
});

test('different accounts are stored independently', () => {
    reset();
    appidStore.saveAppids('alice', [730]);
    appidStore.saveAppids('bob', [440]);
    assert.deepEqual(appidStore.getAppids('alice'), [730]);
    assert.deepEqual(appidStore.getAppids('bob'), [440]);
});
