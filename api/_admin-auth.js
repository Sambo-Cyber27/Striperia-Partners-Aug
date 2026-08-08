import crypto from 'crypto';

export const ADMIN_EMAIL = 'omar@striperiapartners.com';
export const PASSWORD_SALT = '3360f1c46ce1ce4963b44d3662dcfddd';
export const PASSWORD_HASH = '0b797ce5474f63e266fae65de8173e401f7d938a8ee68da5327a1c3fc1fd7e7f';
export const SESSION_SECRET = 'af0eb9beac4d082f1b2e585999f89707d623e875ea81c5862c22a0a49d2ab3d7';
export const COOKIE_NAME = 'striperia_admin_session';
export const MAX_AGE_SECONDS = 60 * 60 * 12;

export function hashPassword(password) {
  return crypto.createHash('sha256').update(`${PASSWORD_SALT}:${password}`).digest('hex');
}

export function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function sign(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

export function createSession(email) {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${email}|${expires}`;
  return `${payload}|${sign(payload)}`;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
      const idx = part.indexOf('=');
      return idx === -1 ? [part, ''] : [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
    }),
  );
}

export function readSession(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;
  const parts = token.split('|');
  if (parts.length !== 3) return null;
  const [email, expiresRaw, signature] = parts;
  const payload = `${email}|${expiresRaw}`;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Date.now()) return null;
  if (!safeEqual(signature, sign(payload))) return null;
  if (email !== ADMIN_EMAIL) return null;
  return { email };
}

export function sessionCookie(value) {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
