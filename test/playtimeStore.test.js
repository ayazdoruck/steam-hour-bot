const fs = require('fs');
const os = require('os');
const path = require('path');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playtimestore-test-'));
process.env.DATA_DIR = dataDir;

const test = require('node:test');
const assert = require('node:assert/strict');
const playtimeStore = require('../playtimeStore');

function reset() {
    fs.rmSync(path.join(dataDir, 'playtime.json'), { force: true });
}

test('getTotalSeconds returns 0 for unknown account', () => {
    reset();
    assert.equal(playtimeStore.getTotalSeconds('nobody'), 0);
});

test('addSeconds accumulates across multiple calls', () => {
    reset();
    playtimeStore.addSeconds('alice', 30);
    playtimeStore.addSeconds('alice', 45);
    assert.equal(playtimeStore.getTotalSeconds('alice'), 75);
});

test('addSeconds ignores zero and negative values', () => {
    reset();
    playtimeStore.addSeconds('alice', 30);
    playtimeStore.addSeconds('alice', 0);
    playtimeStore.addSeconds('alice', -10);
    assert.equal(playtimeStore.getTotalSeconds('alice'), 30);
});

test('different accounts accumulate independently', () => {
    reset();
    playtimeStore.addSeconds('alice', 30);
    playtimeStore.addSeconds('bob', 10);
    assert.equal(playtimeStore.getTotalSeconds('alice'), 30);
    assert.equal(playtimeStore.getTotalSeconds('bob'), 10);
});
