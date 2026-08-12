const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_AUTH_PATH = path.join(__dirname, '..', 'test_auth.json');

// Set the env var BEFORE requiring AuthStore so the default instance uses the test path
process.env.DECK_AUTH_FILE = TEST_AUTH_PATH;

const authStoreInstance = require('./AuthStore');
const { AuthStore } = authStoreInstance;

test('AuthStore Operations and Security', async (t) => {
    // Ensure clean state
    if (fs.existsSync(TEST_AUTH_PATH)) {
        fs.unlinkSync(TEST_AUTH_PATH);
    }

    // Since TEST_AUTH_PATH doesn't exist, this store will start empty
    const store = new AuthStore();

    // 1. Initial State
    assert.strictEqual(store.hasUsers(), false);

    // 2. User Creation Validation
    // Username too short
    await assert.rejects(
        store.createUser('ad', 'password123'),
        /Username must be 3-16 alphanumeric characters/
    );
    // Username invalid characters
    await assert.rejects(
        store.createUser('admin!', 'password123'),
        /Username must be 3-16 alphanumeric characters/
    );
    // Password too short
    await assert.rejects(
        store.createUser('admin', '12345'),
        /Password must be at least 6 characters/
    );

    // Valid user creation
    const user = await store.createUser('admin', 'password123');
    assert.strictEqual(user.username, 'admin');
    assert.strictEqual(typeof user.id, 'string');
    assert.strictEqual(store.hasUsers(), true);

    // Duplicate username
    await assert.rejects(
        store.createUser('admin', 'differentpass'),
        /User already exists/
    );

    // 3. User Validation (Login)
    const validUser = await store.validateUser('admin', 'password123');
    assert.ok(validUser);
    assert.strictEqual(validUser.username, 'admin');
    assert.strictEqual(validUser.id, user.id);

    const invalidUserPass = await store.validateUser('admin', 'wrongpassword');
    assert.strictEqual(invalidUserPass, null);

    const invalidUserUser = await store.validateUser('nonexistent', 'password123');
    assert.strictEqual(invalidUserUser, null);

    // 4. Session Operations
    const token = store.createSession(user.id);
    assert.strictEqual(typeof token, 'string');

    const sessionUser = store.validateSession(token);
    assert.ok(sessionUser);
    assert.strictEqual(sessionUser.id, user.id);
    assert.strictEqual(sessionUser.username, 'admin');

    // Invalid/expired token
    assert.strictEqual(store.validateSession('nonexistent-token'), null);

    // 5. Password Update and Session Invalidation (Security Check)
    // Create another session for this user
    const token2 = store.createSession(user.id);
    assert.ok(store.validateSession(token));
    assert.ok(store.validateSession(token2));

    // Update password
    await store.updateUser(user.id, 'adminnew', 'newpassword123');

    // Old sessions must be invalidated!
    assert.strictEqual(store.validateSession(token), null);
    assert.strictEqual(store.validateSession(token2), null);

    // Login with new credentials should work
    const updatedLogin = await store.validateUser('adminnew', 'newpassword123');
    assert.ok(updatedLogin);

    // Login with old password should fail
    const oldLogin = await store.validateUser('adminnew', 'password123');
    assert.strictEqual(oldLogin, null);

    // 6. Auth File Corruption Bypass Prevention (Security Check)
    // Write corrupted JSON to the auth file
    fs.writeFileSync(TEST_AUTH_PATH, '{ corrupted content: "no closing brace"');

    // Instantiating a new store with a corrupted file should THROW an error, rather than fallback to users = []
    assert.throws(
        () => new AuthStore(),
        /Critical: Failed to load auth file/
    );

    // Write empty file to auth file
    fs.writeFileSync(TEST_AUTH_PATH, '    ');
    assert.throws(
        () => new AuthStore(),
        /Critical: Failed to load auth file/
    );

    // Clean up
    if (fs.existsSync(TEST_AUTH_PATH)) {
        fs.unlinkSync(TEST_AUTH_PATH);
    }
});
