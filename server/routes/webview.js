import express from 'express';
import { createLogger } from '../logger.js';
import {
  getWebviewConfig,
  replaceWebviewItems,
  setWebviewItems,
  setWebviewTabsEnabled,
} from '../services/webview.js';

const router = express.Router();
const log = createLogger('Webview');

router.get('/config', (req, res) => {
  res.json(getWebviewConfig(req.session.userId));
});

router.put('/config', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required', code: 401 });
  }

  try {
    const items = Array.isArray(req.body?.items)
      ? replaceWebviewItems(req.session.userId, req.body.items)
      : setWebviewItems(req.session.userId, req.body?.url ?? '');
    if (typeof req.body?.show_in_tabs === 'boolean') {
      setWebviewTabsEnabled(req.session.userId, req.body.show_in_tabs);
    }
    res.json({ ok: true, ...getWebviewConfig(req.session.userId), items });
  } catch (err) {
    log.error('config PUT', err);
    res.status(500).json({ error: 'Internal server error', code: 500 });
  }
});

router.delete('/config', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required', code: 401 });
  }

  try {
    setWebviewItems(req.session.userId, []);
    res.json({ ok: true, ...getWebviewConfig(req.session.userId), items: [], configured: false, origins: [] });
  } catch (err) {
    log.error('config DELETE', err);
    res.status(500).json({ error: 'Internal server error', code: 500 });
  }
});

export default router;
