const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const Store = require('./Store');

const TEST_CONFIG_PATH = path.join(__dirname, '..', 'test_deck_config.json');

test('Store Config Operations', (t) => {
    // Ensure clean state
    if (fs.existsSync(TEST_CONFIG_PATH)) {
        fs.unlinkSync(TEST_CONFIG_PATH);
    }

    const store = new Store(TEST_CONFIG_PATH);

    // Initial state should be empty
    assert.deepStrictEqual(store.getAll(), {});

    // Set valid button config
    const validAction = { label: 'Vol Up', type: 'hotkey', key: 'volume_up' };
    const setSuccess = store.set('BTN_1', validAction);
    assert.strictEqual(setSuccess, true);
    assert.deepStrictEqual(store.get('BTN_1'), validAction);

    // Verify written file
    assert.strictEqual(fs.existsSync(TEST_CONFIG_PATH), true);
    const fileContent = JSON.parse(fs.readFileSync(TEST_CONFIG_PATH, 'utf8'));
    assert.deepStrictEqual(fileContent, { BTN_1: validAction });

    // Set invalid button id
    const invalidSet1 = store.set('INVALID_ID', validAction);
    assert.strictEqual(invalidSet1, false);

    // Set invalid action
    const invalidAction = { label: 'Bad', type: 'game', key: 'F12' }; // F12 is invalid for game key (only F13-F24)
    const invalidSet2 = store.set('BTN_2', invalidAction);
    assert.strictEqual(invalidSet2, false);
    assert.strictEqual(store.get('BTN_2'), undefined);

    // Delete configuration
    const deleteSuccess = store.delete('BTN_1');
    assert.strictEqual(deleteSuccess, true);
    assert.deepStrictEqual(store.getAll(), {});

    // Try deleting with invalid ID
    const deleteInvalid = store.delete('INVALID_ID');
    assert.strictEqual(deleteInvalid, false);

    // Test load error safety (corrupted file)
    fs.writeFileSync(TEST_CONFIG_PATH, '{ corrupted json ... }');
    const store2 = new Store(TEST_CONFIG_PATH);
    assert.deepStrictEqual(store2.getAll(), {}); // Should fall back to empty config

    // Clean up
    if (fs.existsSync(TEST_CONFIG_PATH)) {
        fs.unlinkSync(TEST_CONFIG_PATH);
    }
});
