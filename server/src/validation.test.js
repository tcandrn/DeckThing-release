const test = require('node:test');
const assert = require('node:assert');
const { isValidButtonId, isValidAction } = require('../shared/validation');

test('isValidButtonId validator', (t) => {
    // Valid cases
    assert.strictEqual(isValidButtonId('BTN_1'), true);
    assert.strictEqual(isValidButtonId('BTN_button-123_abc'), true);
    assert.strictEqual(isValidButtonId('BTN_A'), true);
    
    // Invalid cases
    assert.strictEqual(isValidButtonId(''), false);
    assert.strictEqual(isValidButtonId('BTN_'), false); // Too short (empty suffix)
    assert.strictEqual(isValidButtonId('BTN_too_long_123456789012345678901234567890'), false); // Suffix > 32 chars
    assert.strictEqual(isValidButtonId('BTN_invalid@char'), false);
    assert.strictEqual(isValidButtonId(123), false);
    assert.strictEqual(isValidButtonId(null), false);
    assert.strictEqual(isValidButtonId(undefined), false);
});

test('isValidAction validator', (t) => {
    // Valid Base Structure
    const validBase = { label: 'My Label' };

    // unassigned type
    assert.strictEqual(isValidAction({ ...validBase, type: 'unassigned' }), true);
    
    // text type
    assert.strictEqual(isValidAction({ ...validBase, type: 'text', text: 'hello' }), true);
    assert.strictEqual(isValidAction({ ...validBase, type: 'text', text: '' }), true);
    assert.strictEqual(isValidAction({ ...validBase, type: 'text', text: 'a'.repeat(5000) }), true);
    // invalid text type
    assert.strictEqual(isValidAction({ ...validBase, type: 'text', text: 'a'.repeat(5001) }), false);
    assert.strictEqual(isValidAction({ ...validBase, type: 'text', text: null }), false);

    // hotkey type
    assert.strictEqual(isValidAction({ ...validBase, type: 'hotkey', key: 'a' }), true);
    assert.strictEqual(isValidAction({ ...validBase, type: 'hotkey', key: 'a', modifiers: ['ctrl', 'shift'] }), true);
    assert.strictEqual(isValidAction({ ...validBase, type: 'hotkey', key: 'a', modifiers: [] }), true);
    // invalid hotkey type
    assert.strictEqual(isValidAction({ ...validBase, type: 'hotkey', key: 'a'.repeat(41) }), false);
    assert.strictEqual(isValidAction({ ...validBase, type: 'hotkey', key: 'a', modifiers: 'ctrl' }), false);
    assert.strictEqual(isValidAction({ ...validBase, type: 'hotkey', key: 'a', modifiers: [123] }), false);
    assert.strictEqual(isValidAction({ ...validBase, type: 'hotkey', key: 'a', modifiers: ['ctrl', 'a'.repeat(21)] }), false);

    // game type
    assert.strictEqual(isValidAction({ ...validBase, type: 'game', key: 'F13' }), true);
    assert.strictEqual(isValidAction({ ...validBase, type: 'game', key: 'F24' }), true);
    // invalid game type
    assert.strictEqual(isValidAction({ ...validBase, type: 'game', key: 'F12' }), false);
    assert.strictEqual(isValidAction({ ...validBase, type: 'game', key: 'F25' }), false);
    assert.strictEqual(isValidAction({ ...validBase, type: 'game', key: 'a' }), false);

    // script type
    assert.strictEqual(isValidAction({ ...validBase, type: 'script', script: 'TYPE hello' }), true);
    assert.strictEqual(isValidAction({ ...validBase, type: 'script', script: 'a'.repeat(10000) }), true);
    // invalid script type
    assert.strictEqual(isValidAction({ ...validBase, type: 'script', script: 'a'.repeat(10001) }), false);
    assert.strictEqual(isValidAction({ ...validBase, type: 'script', script: 123 }), false);

    // Invalid labels
    assert.strictEqual(isValidAction({ type: 'unassigned' }), false); // Missing label
    assert.strictEqual(isValidAction({ label: 123, type: 'unassigned' }), false);
    assert.strictEqual(isValidAction({ label: 'a'.repeat(81), type: 'unassigned' }), false);

    // Invalid objects
    assert.strictEqual(isValidAction(null), false);
    assert.strictEqual(isValidAction(''), false);
    assert.strictEqual(isValidAction([]), false);
    assert.strictEqual(isValidAction({ label: 'ok', type: 'unknown' }), false);
});
