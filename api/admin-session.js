import { readSession } from './_admin-auth.js';

export default function handler(req, res) {
  const session = readSession(req);
  return res.status(200).json({ authenticated: !!session, email: session?.email || null });
}
