import { createLogger } from '../logger.js';
import express from 'express';
import * as db from '../db.js';
import { getVapidKeys } from '../services/alarm-scheduler.js';

const log = createLogger('Push');
const router = express.Router();

// GET /api/v1/push/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: getVapidKeys().publicKey });
});

// POST /api/v1/push/subscribe
router.post('/subscribe', (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth)
      return res.status(400).json({ error: 'Invalid subscription object', code: 400 });

    db.get().prepare(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        user_id = excluded.user_id,
        p256dh  = excluded.p256dh,
        auth    = excluded.auth
    `).run(req.session.userId, endpoint, keys.p256dh, keys.auth);

    res.json({ ok: true });
  } catch (err) {
    log.error('POST /subscribe error:', err);
    res.status(500).json({ error: 'Internal error', code: 500 });
  }
});

// DELETE /api/v1/push/unsubscribe
router.delete('/unsubscribe', (req, res) => {
  try {
    const { endpoint } = req.body ?? {};
    if (endpoint) {
      db.get().prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?')
        .run(endpoint, req.session.userId);
    } else {
      db.get().prepare('DELETE FROM push_subscriptions WHERE user_id = ?')
        .run(req.session.userId);
    }
    res.json({ ok: true });
  } catch (err) {
    log.error('DELETE /unsubscribe error:', err);
    res.status(500).json({ error: 'Internal error', code: 500 });
  }
});

export default router;
