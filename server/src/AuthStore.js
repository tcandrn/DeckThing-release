const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const os = require('os');

const USERNAME_REGEX = /^[a-zA-Z0-9]{3,16}$/;
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

let AUTH_FILE = process.env.DECK_AUTH_FILE || null;
if (!AUTH_FILE) {
    try {
        const electron = require('electron');
        const app = electron.app || electron.remote.app;
        const userDataPath = app ? app.getPath('userData') : path.join(os.homedir(), '.deckthing');
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }
        AUTH_FILE = path.join(userDataPath, 'auth.json');
    } catch (e) {
        AUTH_FILE = path.join(__dirname, '..', 'auth.json');
    }
}

class AuthStore {
    constructor() {
        this.users = [];
        this.sessions = {};
        this.isCreatingUser = false;
        this.load();
    }

    getAuthFilePath() {
        return AUTH_FILE;
    }

    load() {
        if (!fs.existsSync(AUTH_FILE)) return;

        try {
            const content = fs.readFileSync(AUTH_FILE, 'utf8');
            if (!content.trim()) {
                throw new Error('Auth file is empty');
            }
            const raw = JSON.parse(content);
            if (Array.isArray(raw)) {
                this.users = raw;
                this.sessions = {};
            } else {
                this.users = raw.users || [];
                this.sessions = raw.sessions || {};
            }
            this.purgeExpiredSessions();
        } catch (e) {
            console.error('Auth Load Error:', e);
            this.users = [];
            this.sessions = {};
            // Re-throw critical auth corruption error to prevent setup hijacking
            throw new Error(`Critical: Failed to load auth file (${e.message}). Please restore or delete it to re-initialize.`);
        }
    }

    save() {
        try {
            fs.writeFileSync(AUTH_FILE, JSON.stringify({ users: this.users, sessions: this.sessions }, null, 2));
        } catch (e) {
            console.error('Auth Save Error:', e);
        }
    }

    purgeExpiredSessions() {
        const now = Date.now();
        let changed = false;
        for (const [token, session] of Object.entries(this.sessions)) {
            if (!session.expiresAt || session.expiresAt <= now) {
                delete this.sessions[token];
                changed = true;
            }
        }
        if (changed) this.save();
    }

    hasUsers() {
        return this.users.length > 0;
    }

    async createUser(username, password) {
        if (this.isCreatingUser) {
            throw new Error('Setup in progress, please try again');
        }
        this.isCreatingUser = true;
        try {
            if (!USERNAME_REGEX.test(username)) {
                throw new Error('Username must be 3-16 alphanumeric characters');
            }
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }
            if (this.users.find(u => u.username === username)) {
                throw new Error('User already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                id: crypto.randomUUID(),
                username,
                password: hashedPassword,
            };

            this.users.push(newUser);
            this.save();
            return { id: newUser.id, username: newUser.username };
        } finally {
            this.isCreatingUser = false;
        }
    }

    async updateUser(userId, newUsername, newPassword) {
        const user = this.users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');

        if (newUsername) {
            if (!USERNAME_REGEX.test(newUsername)) {
                throw new Error('Username must be 3-16 alphanumeric characters');
            }
            const existing = this.users.find(u => u.username === newUsername && u.id !== userId);
            if (existing) {
                throw new Error('Username already taken');
            }
            user.username = newUsername;
        }

        if (newPassword) {
            if (newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }
            user.password = await bcrypt.hash(newPassword, 10);

            // Invalidate all active sessions for this user on password update
            for (const [token, session] of Object.entries(this.sessions)) {
                if (session.userId === userId) {
                    delete this.sessions[token];
                }
            }
        }

        this.save();
        return { id: user.id, username: user.username };
    }

    async validateUser(username, password) {
        const user = this.users.find(u => u.username === username);
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return { id: user.id, username: user.username };
    }

    createSession(userId) {
        const token = crypto.randomUUID();
        this.sessions[token] = {
            userId,
            expiresAt: Date.now() + SESSION_MAX_AGE_MS,
        };
        this.save();
        return token;
    }

    validateSession(token) {
        const session = this.sessions[token];
        if (!session) return null;

        if (Date.now() > session.expiresAt) {
            delete this.sessions[token];
            this.save();
            return null;
        }

        const user = this.users.find(u => u.id === session.userId);
        if (!user) return null;

        return { id: user.id, username: user.username };
    }

    destroySession(token) {
        if (!token || !this.sessions[token]) return;
        delete this.sessions[token];
        this.save();
    }
}

// Export AuthStore constructor for testing override if needed
module.exports = new AuthStore();
module.exports.AuthStore = AuthStore;

