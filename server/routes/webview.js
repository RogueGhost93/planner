import express from 'express';
import { createLogger } from '../logger.js';
import { getWebviewUrl, setWebviewUrl } from '../services/webview.js';

const router = express.Router();
const log = createLogger('Webview');

router.get('/config', (req, res) => {
  const url = getWebviewUrl();
  res.json({ configured: !!url, url });
});

router.put('/config', (req, res) => {
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin required', code: 403 });
  }

  try {
    const url = setWebviewUrl(req.body?.url);
    res.json({ ok: true, configured: !!url, url });
  } catch (err) {
    log.error('config PUT', err);
    res.status(500).json({ error: 'Internal server error', code: 500 });
  }
});

router.delete('/config', (req, res) => {
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin required', code: 403 });
  }

  try {
    setWebviewUrl('');
    res.json({ ok: true, configured: false, url: null });
  } catch (err) {
    log.error('config DELETE', err);
    res.status(500).json({ error: 'Internal server error', code: 500 });
  }
});

export default router;
