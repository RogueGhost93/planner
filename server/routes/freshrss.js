/**
 * Modul: FreshRSS Integration
 * Zweck: Proxy-Routen zur FreshRSS-Instanz (Google Reader API) + Config-Management
 * Abhängigkeiten: express, server/db.js
 */

import express from 'express';
import * as db from '../db.js';
import { createLogger } from '../logger.js';

const log    = createLogger('FreshRSS');
const router = express.Router();

// Cache: Auth-Token (1h) und Headlines (15 min)
let tokenCache    = { token: null, ts: 0 };
let headlineCache = { data: null, ts: 0 };
const TOKEN_TTL_MS    = 60 * 60 * 1000;
const HEADLINE_TTL_MS = 15 * 60 * 1000;
const HEADLINE_COUNT  = 20;

// --------------------------------------------------------
// Hilfsfunktionen
// --------------------------------------------------------

function getConfig() {
  const stmt = db.get().prepare('SELECT key, value FROM app_settings WHERE key IN (?, ?, ?)');
  const rows = stmt.all('freshrss_url', 'freshrss_username', 'freshrss_password');
  const map  = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    url:      map.freshrss_url      || null,
    username: map.freshrss_username || null,
    password: map.freshrss_password || null,
  };
}

/**
 * Authenticate via GReader API and return an Auth token.
 * Caches the token for TOKEN_TTL_MS.
 */
async function getAuthToken(url, username, password) {
  if (tokenCache.token && Date.now() - tokenCache.ts < TOKEN_TTL_MS) {
    return tokenCache.token;
  }

  const { default: fetch } = await import('node-fetch');
  const loginUrl = `${url}/api/greader.php/accounts/ClientLogin`;
  const body     = new URLSearchParams({ Email: username, Passwd: password });

  const res = await fetch(loginUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
    signal:  AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const err    = new Error(`FreshRSS login failed with status ${res.status}`);
    err.status   = res.status;
    throw err;
  }

  const text  = await res.text();
  const match = text.match(/^Auth=(.+)$/m);
  if (!match) {
    throw new Error('FreshRSS login response did not contain Auth token');
  }

  tokenCache = { token: match[1].trim(), ts: Date.now() };
  return tokenCache.token;
}

// --------------------------------------------------------
// GET /api/v1/freshrss/status
// Response: { configured: bool }
// --------------------------------------------------------
router.get('/status', (req, res) => {
  try {
    const { url, username, password } = getConfig();
    res.json({ configured: !!(url && username && password) });
  } catch (err) {
    log.error('status', err);
    res.status(500).json({ error: 'Internal server error', code: 500 });
  }
});

// --------------------------------------------------------
// POST /api/v1/freshrss/config  (Admin only)
// Body: { url, username, password }
// Response: { ok: true }
// --------------------------------------------------------
router.post('/config', (req, res) => {
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin required', code: 403 });
  }

  const { url, username, password } = req.body;

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'url is required', code: 400 });
  }
  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: 'username is required', code: 400 });
  }
  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'password is required', code: 400 });
  }

  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return res.status(400).json({ error: 'Invalid URL', code: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'URL must use http or https', code: 400 });
  }

  try {
    const upsert = db.get().prepare(`
      INSERT INTO app_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    db.get().transaction(() => {
      upsert.run('freshrss_url',      parsed.origin + parsed.pathname.replace(/\/$/, ''));
      upsert.run('freshrss_username', username.trim());
      upsert.run('freshrss_password', password.trim());
    })();

    // Invalidate caches on config change
    tokenCache    = { token: null, ts: 0 };
    headlineCache = { data: null, ts: 0 };

    res.json({ ok: true });
  } catch (err) {
    log.error('config POST', err);
    res.status(500).json({ error: 'Internal server error', code: 500 });
  }
});

// --------------------------------------------------------
// DELETE /api/v1/freshrss/config  (Admin only)
// Response: { ok: true }
// --------------------------------------------------------
router.delete('/config', (req, res) => {
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin required', code: 403 });
  }
  try {
    db.get().prepare(
      "DELETE FROM app_settings WHERE key IN ('freshrss_url', 'freshrss_username', 'freshrss_password')"
    ).run();

    tokenCache    = { token: null, ts: 0 };
    headlineCache = { data: null, ts: 0 };

    res.json({ ok: true });
  } catch (err) {
    log.error('config DELETE', err);
    res.status(500).json({ error: 'Internal server error', code: 500 });
  }
});

// --------------------------------------------------------
// GET /api/v1/freshrss/headlines
// Returns latest headlines from all feeds.
// Response: { data: [{ title, url, source }] } | { data: null }
// --------------------------------------------------------
router.get('/headlines', async (req, res) => {
  try {
    const { url, username, password } = getConfig();

    if (!url || !username || !password) {
      return res.json({ data: null });
    }

    // Serve from cache if fresh
    if (headlineCache.data && Date.now() - headlineCache.ts < HEADLINE_TTL_MS) {
      return res.json({ data: headlineCache.data });
    }

    const { default: fetch } = await import('node-fetch');
    const token = await getAuthToken(url, username, password);

    const streamUrl = `${url}/api/greader.php/reader/api/0/stream/contents/user/-/state/com.google/reading-list`
      + `?n=${HEADLINE_COUNT}&output=json`;

    const streamRes = await fetch(streamUrl, {
      headers: { Authorization: `GoogleLogin auth=${token}` },
      signal:  AbortSignal.timeout(8000),
    });

    if (!streamRes.ok) {
      // Token may have expired — clear it so the next request re-authenticates
      if (streamRes.status === 401) tokenCache = { token: null, ts: 0 };
      log.warn(`Stream request failed: ${streamRes.status}`);
      return res.json({ data: null });
    }

    const json = await streamRes.json();
    const items = (json.items ?? []).map((item) => ({
      title:  (item.title ?? '').replace(/<[^>]*>/g, '').trim(),
      url:    item.canonical?.[0]?.href ?? null,
      source: (item.origin?.title ?? '').replace(/<[^>]*>/g, '').trim(),
    })).filter((h) => h.title);

    headlineCache = { data: items, ts: Date.now() };
    res.json({ data: items });
  } catch (err) {
    log.warn('headlines GET:', err.message);
    res.json({ data: null });
  }
});

export default router;
