import { randomUUID } from 'crypto';
import * as db from '../db.js';

const USER_ITEMS_KEY = 'webview_items';
const USER_TABS_KEY = 'webview_show_in_tabs';
const LEGACY_ITEMS_KEY = 'webview_items';
const LEGACY_TABS_KEY = 'webview_show_in_tabs';
const LEGACY_URL_KEY = 'webview_url';

function normalizeWebviewUrl(rawUrl) {
  const value = (rawUrl ?? '').trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function normalizeWebviewName(rawUrl, rawName) {
  const name = (rawName ?? '').trim();
  if (name) return name;
  try {
    return new URL(rawUrl).hostname.replace(/^www\./i, '') || 'Website';
  } catch {
    return 'Website';
  }
}

function normalizeWebviewItem(item, index = 0) {
  const url = normalizeWebviewUrl(item?.url);
  if (!url) return null;

  return {
    id: String(item?.id ?? '').trim() || randomUUID(),
    name: normalizeWebviewName(url, item?.name),
    url,
    sort_order: Number.isFinite(Number(item?.sort_order)) ? Number(item.sort_order) : index,
  };
}

function parseBooleanValue(value, fallback = true) {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === 'true' || value === '1' || value === 1) return true;
  if (value === false || value === 'false' || value === '0' || value === 0) return false;
  return fallback;
}

function readStoredItems(userId) {
  if (!userId) return [];

  const userRow = db.get()
    .prepare('SELECT value FROM user_settings WHERE user_id = ? AND key = ?')
    .get(userId, USER_ITEMS_KEY);
  if (userRow?.value) {
    try {
      const parsed = JSON.parse(userRow.value);
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => normalizeWebviewItem(item, index)).filter(Boolean);
      }
    } catch {
      // fall through to legacy fallback
    }
  }

  const legacyRow = db.get()
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get(LEGACY_ITEMS_KEY);
  if (legacyRow?.value) {
    try {
      const parsed = JSON.parse(legacyRow.value);
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((item, index) => normalizeWebviewItem(item, index)).filter(Boolean);
        persistItems(userId, normalized);
        return normalized;
      }
    } catch {
      // fall through to legacy/env fallback
    }
  }

  const urlRow = db.get()
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get(LEGACY_URL_KEY);
  const legacyUrl = normalizeWebviewUrl(urlRow?.value);
  if (legacyUrl) {
    const items = [{
      id: randomUUID(),
      name: 'Website',
      url: legacyUrl,
      sort_order: 0,
    }];
    persistItems(userId, items);
    return items;
  }

  const envUrl = normalizeWebviewUrl(process.env.PLANIUM_WEBVIEW_URL);
  if (envUrl) {
    const items = [{
      id: randomUUID(),
      name: 'Website',
      url: envUrl,
      sort_order: 0,
    }];
    persistItems(userId, items);
    return items;
  }

  return [];
}

function readStoredTabsEnabled(userId, items = null) {
  if (!userId) return true;

  const userRow = db.get()
    .prepare('SELECT value FROM user_settings WHERE user_id = ? AND key = ?')
    .get(userId, USER_TABS_KEY);
  if (userRow?.value !== undefined && userRow?.value !== null) {
    return parseBooleanValue(userRow.value, true);
  }

  const legacyRow = db.get()
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get(LEGACY_TABS_KEY);
  if (legacyRow?.value !== undefined && legacyRow?.value !== null) {
    const enabled = parseBooleanValue(legacyRow.value, true);
    persistTabsEnabled(userId, enabled);
    return enabled;
  }

  if (Array.isArray(items) && items.length > 0) {
    const enabled = items.some((item) => item?.show_in_tabs !== false && item?.showInTabs !== false);
    persistTabsEnabled(userId, enabled);
    return enabled;
  }

  return true;
}

function persistTabsEnabled(userId, enabled) {
  if (!userId) return !!enabled;
  db.get().prepare(`
    INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
  `).run(userId, USER_TABS_KEY, enabled ? 'true' : 'false');
  return enabled;
}

function persistItems(userId, items) {
  if (!userId) return [];
  const normalized = items
    .map((item, index) => normalizeWebviewItem(item, index))
    .filter(Boolean)
    .map((item, index) => ({ ...item, sort_order: index }));

  const stmt = db.get().prepare(`
    INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
  `);

  if (!normalized.length) {
    db.get().prepare(`
      INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, '[]')
      ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
    `).run(userId, USER_ITEMS_KEY);
    return [];
  }

  stmt.run(userId, USER_ITEMS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getWebviewItems(userId) {
  return readStoredItems(userId).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function getWebviewConfig(userId) {
  const items = getWebviewItems(userId);
  const showInTabs = readStoredTabsEnabled(userId, items);
  const origins = [...new Set(items.map((item) => {
    try {
      return new URL(item.url).origin;
    } catch {
      return null;
    }
  }).filter(Boolean))];
  return {
    configured: items.length > 0,
    items,
    origins,
    show_in_tabs: showInTabs,
  };
}

export function getWebviewOrigins(userId) {
  return getWebviewConfig(userId).origins;
}

export function getWebviewUrl(userId) {
  return getWebviewItems(userId)[0]?.url ?? null;
}

export function getWebviewOrigin(userId) {
  return getWebviewOrigins(userId)[0] ?? null;
}

export function setWebviewItems(userId, items) {
  if (Array.isArray(items)) {
    return persistItems(userId, items);
  }

  if (typeof items === 'string') {
    const url = normalizeWebviewUrl(items);
    if (!url) {
      return persistItems(userId, []);
    }
    return persistItems(userId, [{ name: 'Website', url }]);
  }

  return persistItems(userId, []);
}

export function replaceWebviewItems(userId, items) {
  return persistItems(userId, items);
}

export function getWebviewTabsEnabled(userId) {
  return readStoredTabsEnabled(userId, getWebviewItems(userId));
}

export function setWebviewTabsEnabled(userId, enabled) {
  return persistTabsEnabled(userId, !!enabled);
}
