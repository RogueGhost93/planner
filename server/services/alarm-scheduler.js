import { createLogger } from '../logger.js';
import * as db from '../db.js';
import webpush from 'web-push';

const log = createLogger('AlarmScheduler');

let vapidKeys = null;

export function getVapidKeys() {
  if (vapidKeys) return vapidKeys;

  const pubRow  = db.get().prepare("SELECT value FROM app_settings WHERE key = 'vapid_public_key'").get();
  const privRow = db.get().prepare("SELECT value FROM app_settings WHERE key = 'vapid_private_key'").get();

  if (pubRow && privRow) {
    vapidKeys = { publicKey: pubRow.value, privateKey: privRow.value };
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    db.get().prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run('vapid_public_key',  vapidKeys.publicKey);
    db.get().prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)").run('vapid_private_key', vapidKeys.privateKey);
    log.info('Generated new VAPID keys');
  }

  webpush.setVapidDetails('mailto:planium@localhost', vapidKeys.publicKey, vapidKeys.privateKey);
  return vapidKeys;
}

async function checkAlarms() {
  const nowStr = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

  const dueTasks = db.get().prepare(`
    SELECT * FROM tasks
    WHERE alarm_at <= ? AND alarm_sent = 0 AND status != 'done'
  `).all(nowStr);

  if (!dueTasks.length) return;

  const subscriptions = db.get().prepare('SELECT * FROM push_subscriptions').all();
  if (!subscriptions.length) {
    // No subscribers yet — just mark sent to avoid piling up
    for (const task of dueTasks) {
      db.get().prepare('UPDATE tasks SET alarm_sent = 1 WHERE id = ?').run(task.id);
    }
    return;
  }

  for (const task of dueTasks) {
    const payload = JSON.stringify({ title: '⏰ Task alarm', body: task.title, taskId: task.id });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          db.get().prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint);
        } else {
          log.error(`Push failed for sub ${sub.id}:`, err.message);
        }
      }
    }

    db.get().prepare('UPDATE tasks SET alarm_sent = 1 WHERE id = ?').run(task.id);
    log.info(`Alarm fired for task ${task.id}: ${task.title}`);
  }
}

export function startAlarmScheduler() {
  try {
    getVapidKeys();
  } catch (err) {
    log.error('Failed to init VAPID keys:', err);
  }
  setInterval(() => checkAlarms().catch((err) => log.error('Alarm check error:', err)), 60_000);
  log.info('Alarm scheduler started');
}
