const os = require('os');

const LOCAL_ORIGIN =
  /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/;

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts.shift().trim();
    const raw = parts.join('=');
    try {
      list[name] = decodeURIComponent(raw);
    } catch (e) {
      list[name] = raw;
    }
  });
  return list;
}

function allowedOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  if (LOCAL_ORIGIN.test(origin)) return callback(null, true);
  if (/^app:\/\//.test(origin)) return callback(null, true);
  return callback(new Error('CORS not allowed'), false);
}

const SESSION_COOKIE = 'deck_token';
const SESSION_MAX_AGE_SEC = 60 * 60 * 24;

function sessionCookieHeader(token) {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SEC}`;
}

function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0`;
}

module.exports = {
  getLocalIP,
  parseCookies,
  allowedOrigin,
  sessionCookieHeader,
  clearSessionCookieHeader,
  SESSION_COOKIE,
};
