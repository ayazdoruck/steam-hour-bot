const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { readJsonSafe, writeJsonAtomic } = require('../fileStore');

function tempFile() {
    return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'filestore-test-')), 'data.json');
}

test('readJsonSafe returns empty object when file does not exist', () => {
    const result = readJsonSafe(tempFile());
    assert.deepEqual(result, {});
});

test('writeJsonAtomic then readJsonSafe round-trips data', () => {
    const file = tempFile();
    writeJsonAtomic(file, { hello: 'world', n: 42 });
    assert.deepEqual(readJsonSafe(file), { hello: 'world', n: 42 });
});

test('writeJsonAtomic creates missing parent directories', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'filestore-test-'));
    const nested = path.join(dir, 'a', 'b', 'c.json');
    writeJsonAtomic(nested, { ok: true });
    assert.deepEqual(readJsonSafe(nested), { ok: true });
});

test('writeJsonAtomic does not leave a .tmp file behind', () => {
    const file = tempFile();
    writeJsonAtomic(file, { x: 1 });
    assert.equal(fs.existsSync(file + '.tmp'), false);
});
