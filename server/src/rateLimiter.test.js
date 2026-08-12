const test = require('node:test');
const assert = require('node:assert');
const { rateLimiter, createDeckServer } = require('../shared/createDeckServer');

test('Rate Limiter Middleware', (t) => {
    // Clear any previous attempts
    const loginAttempts = createDeckServer.loginAttempts;
    for (const key of Object.keys(loginAttempts)) {
        delete loginAttempts[key];
    }

    const testIp = '1.2.3.4';
    const otherIp = '5.6.7.8';

    // Helper to simulate request
    function simulateRequest(ip, statusCode, expectBlock) {
        let blocked = false;
        let blockMsg = null;
        let nextCalled = false;

        const req = {
            ip: ip,
            socket: {}
        };

        const res = {
            statusCode: 200,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                if (this.statusCode === 429) {
                    blocked = true;
                    blockMsg = data.error;
                }
                return this;
            }
        };

        const next = () => {
            nextCalled = true;
        };

        // Run middleware
        rateLimiter(req, res, next);

        // Simulate endpoint response if next was called
        if (nextCalled) {
            res.status(statusCode).json({ msg: 'done' });
        }

        assert.strictEqual(blocked, expectBlock, `IP ${ip} blocked status mismatch: expected ${expectBlock}, got ${blocked}`);
        return { nextCalled, blockMsg };
    }

    // 1. Successful requests should not increase limit count
    for (let i = 0; i < 10; i++) {
        const { nextCalled } = simulateRequest(testIp, 200, false);
        assert.strictEqual(nextCalled, true);
    }
    assert.strictEqual(loginAttempts[testIp].length, 0);

    // 2. Only 401 (bad credentials) should increase count
    simulateRequest(testIp, 401, false);
    assert.strictEqual(loginAttempts[testIp].length, 1);

    // Non-credential errors must not burn the lockout budget
    simulateRequest(testIp, 400, false);
    simulateRequest(testIp, 403, false);
    simulateRequest(testIp, 500, false);
    assert.strictEqual(loginAttempts[testIp].length, 1);

    // 2nd, 3rd, 4th, 5th failed credentials
    simulateRequest(testIp, 401, false);
    simulateRequest(testIp, 401, false);
    simulateRequest(testIp, 401, false);
    simulateRequest(testIp, 401, false);
    assert.strictEqual(loginAttempts[testIp].length, 5);

    // 6th attempt should be BLOCKED (return 429)
    const { nextCalled, blockMsg } = simulateRequest(testIp, 200, true);
    assert.strictEqual(nextCalled, false); // next() should not be called when blocked
    assert.ok(blockMsg.includes('Too many failed login attempts'));

    // 3. Different IP should still be allowed
    const otherReq = simulateRequest(otherIp, 200, false);
    assert.strictEqual(otherReq.nextCalled, true);

    // Clean up
    for (const key of Object.keys(loginAttempts)) {
        delete loginAttempts[key];
    }
});
