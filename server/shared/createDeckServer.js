const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const {
  getLocalIP,
  parseCookies,
  allowedOrigin,
  sessionCookieHeader,
  clearSessionCookieHeader,
  SESSION_COOKIE,
} = require('./httpUtils');

const loginAttempts = {};

const LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function pruneLoginAttempts(now) {
  for (const [ip, timestamps] of Object.entries(loginAttempts)) {
    const fresh = timestamps.filter(t => now - t < LIMIT_WINDOW);
    if (fresh.length === 0) delete loginAttempts[ip];
    else loginAttempts[ip] = fresh;
  }
}

function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress;
  const now = Date.now();

  pruneLoginAttempts(now);

  if (!loginAttempts[ip]) {
    loginAttempts[ip] = [];
  }

  if (loginAttempts[ip].length >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many failed login attempts. Please try again after 15 minutes.' });
  }

  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode === 401) {
      if (!loginAttempts[ip]) loginAttempts[ip] = [];
      loginAttempts[ip].push(now);
    }
    return originalJson.apply(this, arguments);
  };

  next();
}

// Export rate limiter internal map for testing purposes
createDeckServer.loginAttempts = loginAttempts;


function createDeckServer({
  port,
  authStore,
  store,
  serialHandler,
  executeAction,
  uiDir,
  onQuit,
}) {
  const app = express();
  app.use(cors({ origin: allowedOrigin, credentials: true }));
  app.use(express.json());

  if (uiDir && fs.existsSync(uiDir)) {
    app.use(express.static(uiDir));
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: allowedOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  serialHandler.io = io;

  function authenticateHttp(req, res, next) {
    if (!authStore.hasUsers()) return res.status(403).json({ error: 'Setup required' });

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    const user = token && authStore.validateSession(token);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    req.user = user;
    next();
  }

  app.get('/api/auth/status', (req, res) => {
    res.json({
      initialized: authStore.hasUsers(),
      requirements: authStore.hasUsers() ? 'login' : 'setup',
    });
  });

  app.post('/api/auth/setup', rateLimiter, async (req, res) => {
    if (authStore.hasUsers()) return res.status(403).json({ error: 'Already initialized' });
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
      const user = await authStore.createUser(username, password);
      const sessionToken = authStore.createSession(user.id);
      res.setHeader('Set-Cookie', sessionCookieHeader(sessionToken));
      res.json({ user });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/auth/login', rateLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await authStore.validateUser(username, password);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const sessionToken = authStore.createSession(user.id);
      res.setHeader('Set-Cookie', sessionCookieHeader(sessionToken));
      res.json({ user });
    } catch (e) {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/auth/me', authenticateHttp, (req, res) => {
    res.json(req.user);
  });

  app.post('/api/auth/update', authenticateHttp, async (req, res) => {
    try {
      const { username, password } = req.body;
      const updatedUser = await authStore.updateUser(req.user.id, username, password);
      res.json({ user: updatedUser });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    if (token) authStore.destroySession(token);
    res.setHeader('Set-Cookie', clearSessionCookieHeader());
    res.json({ success: true });
  });

  app.get('/ports', authenticateHttp, async (req, res) => {
    const ports = await serialHandler.listPorts();
    res.json(ports);
  });

  io.use((socket, next) => {
    if (!authStore.hasUsers()) return next(new Error('Setup required'));

    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    if (!token) return next(new Error('Authentication required'));

    const user = authStore.validateSession(token);
    if (!user) return next(new Error('Invalid token'));

    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    console.log('Client connected', socket.user ? `as ${socket.user.username}` : '');

    socket.emit('config-load', store.getAll());
    socket.emit('network-info', `http://${getLocalIP()}:${port}`);
    if (serialHandler.isConnected) socket.emit('status', 'Connected');

    socket.on('save-button', ({ id, data }) => {
      if (!store.set(id, data)) return socket.emit('error-message', 'Invalid button configuration');
      io.emit('config-load', store.getAll());
    });

    socket.on('delete-button', (id) => {
      if (!store.delete(id)) return socket.emit('error-message', 'Invalid button id');
      io.emit('config-load', store.getAll());
    });

    socket.on('connect-board', (path) => {
      serialHandler.connect(path);
    });

    socket.on('disconnect-board', () => {
      serialHandler.disconnect();
    });

    socket.on('quit-app', () => {
      console.log('Quit requested');
      if (onQuit) onQuit();
      else process.exit(0);
    });
  });

  app.use((err, req, res, next) => {
    if (err && err.message === 'CORS not allowed') {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    return next(err);
  });

  serialHandler.onData = (btnId) => {
    if (!btnId.startsWith('BTN_')) return;
    const action = store.get(btnId);
    if (action && executeAction) executeAction(action);
  };

  return {
    app,
    server,
    io,
    listen: (host) => {
      const bindHost = host || process.env.DECK_HOST || '127.0.0.1';
      server.listen(port, bindHost, () => console.log(`SERVER RUNNING ON ${bindHost}:${port}`));
    },
  };
}

module.exports = { createDeckServer, rateLimiter };
