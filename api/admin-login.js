import { ADMIN_EMAIL, PASSWORD_HASH, hashPassword, safeEqual, createSession, sessionCookie } from './_admin-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const validEmail = email === ADMIN_EMAIL;
  const validPassword = safeEqual(hashPassword(password), PASSWORD_HASH);

  if (!validEmail || !validPassword) {
    return res.status(401).json({ error: 'Invalid login' });
  }

  res.setHeader('Set-Cookie', sessionCookie(createSession(ADMIN_EMAIL)));
  return res.status(200).json({ ok: true });
}
