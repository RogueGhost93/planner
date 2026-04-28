import * as db from '../db.js';

function normalizeWebviewUrl(rawUrl) {
  const value = (rawUrl ?? '').trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.href;
  } catch {
    return null;
  }
}

export function getWebviewUrl() {
  const row = db.get().prepare("SELECT value FROM app_settings WHERE key = 'webview_url'").get();
  return normalizeWebviewUrl(row?.value ?? process.env.PLANIUM_WEBVIEW_URL);
}

export function getWebviewOrigin() {
  const url = getWebviewUrl();
  return url ? new URL(url).origin : null;
}

export function setWebviewUrl(rawUrl) {
  const url = normalizeWebviewUrl(rawUrl);
  const stmt = db.get().prepare(`
    INSERT INTO app_settings (key, value) VALUES ('webview_url', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  if (url) {
    stmt.run(url);
  } else {
    db.get().prepare("DELETE FROM app_settings WHERE key = 'webview_url'").run();
  }
  return url;
}
