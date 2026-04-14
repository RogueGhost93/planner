/**
 * Module: Task Notifications
 * Purpose: Popup and sound reminders for tasks due today and tomorrow.
 *          - Shows a popup once per day (configurable time)
 *          - Plays a notification sound every N hours while today-tasks remain incomplete
 *          - All settings per-user: popup on/off, sound on/off, time, interval
 * Dependencies: /api.js, /i18n.js
 */

import { api } from '/api.js';
import { t } from '/i18n.js';
import { esc } from '/utils/html.js';

// --------------------------------------------------------
// localStorage keys
// --------------------------------------------------------
const LS_LAST_POPUP = 'planner-notify-last-popup';
const LS_LAST_SOUND = 'planner-notify-last-sound';

// --------------------------------------------------------
// Sound generation via Web Audio API (no external file needed)
// --------------------------------------------------------
let audioCtx = null;

/**
 * Tone definitions. Each entry is an array of { freq, start, duration, volume } descriptors.
 * All times are in seconds relative to audioCtx.currentTime.
 */
const TONES = {
  // Single short beep
  short: [
    { freq: 600, start: 0,    duration: 0.18, volume: 0.15 },
  ],
  // Default two-tone chime (original behaviour)
  default: [
    { freq: 520, start: 0,    duration: 0.4,  volume: 0.15 },
    { freq: 660, start: 0.15, duration: 0.4,  volume: 0.15 },
  ],
  // Slow triple chime
  long: [
    { freq: 440, start: 0,    duration: 0.6,  volume: 0.13 },
    { freq: 550, start: 0.25, duration: 0.6,  volume: 0.13 },
    { freq: 660, start: 0.5,  duration: 0.6,  volume: 0.13 },
  ],
  // Soft low-pitch gentle fade
  gentle: [
    { freq: 320, start: 0,    duration: 0.8,  volume: 0.10 },
    { freq: 400, start: 0.4,  duration: 0.8,  volume: 0.08 },
  ],
  // Sharp high-pitch double alert
  alert: [
    { freq: 880, start: 0,    duration: 0.15, volume: 0.18 },
    { freq: 880, start: 0.2,  duration: 0.15, volume: 0.18 },
  ],
};

function playTone(toneName) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const steps = TONES[toneName] || TONES.default;
    steps.forEach(({ freq, start, duration, volume }) => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = audioCtx.currentTime + start;
      gain.gain.setValueAtTime(volume, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + duration);
    });
  } catch { /* AudioContext may not be available */ }
}

function playNotificationSound(tone) {
  playTone(tone || 'default');
}

/**
 * Play a tone preview (e.g. from the settings page).
 * @param {string} toneName
 */
export function previewTone(toneName) {
  playTone(toneName || 'default');
}

// --------------------------------------------------------
// Priority helpers
// --------------------------------------------------------
const PRIORITY_LABELS = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low', none: '' };
const PRIORITY_CLASSES = { urgent: 'notif-priority--urgent', high: 'notif-priority--high', medium: 'notif-priority--medium', low: 'notif-priority--low', none: '' };

function priorityBadge(priority) {
  if (!priority || priority === 'none') return '';
  const label = t(`tasks.priority${priority.charAt(0).toUpperCase() + priority.slice(1)}`) || PRIORITY_LABELS[priority] || '';
  return `<span class="notif-priority ${PRIORITY_CLASSES[priority] || ''}">${esc(label)}</span>`;
}

// --------------------------------------------------------
// Build popup HTML
// --------------------------------------------------------

function buildTaskRow(task) {
  const time = task.due_time ? `<span class="notif-task__time">${esc(task.due_time)}</span>` : '';
  const assigned = task.assigned_name
    ? `<span class="notif-task__assigned" style="--avatar-color:${esc(task.assigned_color || '#007AFF')}">${esc(task.assigned_name)}</span>`
    : '';
  return `
    <li class="notif-task">
      <div class="notif-task__main">
        ${priorityBadge(task.priority)}
        <span class="notif-task__title">${esc(task.title)}</span>
      </div>
      <div class="notif-task__meta">
        ${time}${assigned}
      </div>
    </li>`;
}

function buildPopupHtml(todayTasks, tomorrowTasks) {
  const todayHtml = todayTasks.length
    ? `<ul class="notif-list">${todayTasks.map(buildTaskRow).join('')}</ul>`
    : `<p class="notif-empty">${t('notifications.allDoneToday')}</p>`;

  const tomorrowHtml = tomorrowTasks.length
    ? `<ul class="notif-list">${tomorrowTasks.map(buildTaskRow).join('')}</ul>`
    : `<p class="notif-empty">${t('notifications.nothingTomorrow')}</p>`;

  return `
    <div class="notif-overlay" id="task-notif-overlay">
      <div class="notif-popup" role="alertdialog" aria-modal="true" aria-labelledby="notif-title">
        <div class="notif-popup__header">
          <h2 class="notif-popup__title" id="notif-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            ${t('notifications.title')}
          </h2>
          <button class="notif-popup__close" id="notif-close" aria-label="${t('common.close')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="notif-popup__body">
          <section class="notif-section">
            <h3 class="notif-section__title">${t('notifications.todayLabel')}
              ${todayTasks.length ? `<span class="notif-section__count">${todayTasks.length}</span>` : ''}
            </h3>
            ${todayHtml}
          </section>
          <section class="notif-section">
            <h3 class="notif-section__title">${t('notifications.tomorrowLabel')}
              ${tomorrowTasks.length ? `<span class="notif-section__count">${tomorrowTasks.length}</span>` : ''}
            </h3>
            ${tomorrowHtml}
          </section>
        </div>
        <div class="notif-popup__footer">
          <button class="btn btn--primary notif-popup__dismiss" id="notif-dismiss">${t('notifications.dismiss')}</button>
        </div>
      </div>
    </div>`;
}

// --------------------------------------------------------
// Show / close popup
// --------------------------------------------------------

function showPopup(todayTasks, tomorrowTasks) {
  // Don't show if nothing to display
  if (!todayTasks.length && !tomorrowTasks.length) return;

  // Remove existing if any
  document.getElementById('task-notif-overlay')?.remove();

  document.body.insertAdjacentHTML('beforeend', buildPopupHtml(todayTasks, tomorrowTasks));

  const overlay = document.getElementById('task-notif-overlay');

  // Close handlers
  const close = () => overlay?.remove();
  document.getElementById('notif-close')?.addEventListener('click', close);
  document.getElementById('notif-dismiss')?.addEventListener('click', close);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Escape key
  const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);

  // Focus the dismiss button
  setTimeout(() => document.getElementById('notif-dismiss')?.focus(), 50);
}

// --------------------------------------------------------
// Core logic: check and notify
// --------------------------------------------------------

let checkInterval = null;

function todayStr() { return new Date().toISOString().slice(0, 10); }

function hoursSince(isoOrTimestamp) {
  if (!isoOrTimestamp) return Infinity;
  const ms = Date.now() - new Date(isoOrTimestamp).getTime();
  return ms / (1000 * 60 * 60);
}

function currentTimeMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function parseTimeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Main check: called on app load and periodically.
 * @param {Object} prefs - User's notification preferences
 */
async function checkNotifications(prefs) {
  if (!prefs.notify_popup && !prefs.notify_sound) return;

  const now = currentTimeMinutes();
  const notifyTime = parseTimeToMinutes(prefs.notify_time || '09:00');

  // Only act after the configured notify_time
  if (now < notifyTime) return;

  let data;
  try {
    data = await api.get('/tasks/due-notifications');
  } catch { return; }

  // Popup: show when there are tasks not yet seen
  if (prefs.notify_popup) {
    const allIds = [...data.today, ...data.tomorrow].map(t => t.id).sort((a, b) => a - b);
    const seenRaw = localStorage.getItem(LS_LAST_POPUP);
    let seenIds = [];
    try { seenIds = seenRaw ? JSON.parse(seenRaw) : []; } catch { seenIds = []; }
    const hasNew = allIds.some(id => !seenIds.includes(id));

    if (hasNew && allIds.length > 0) {
      showPopup(data.today, data.tomorrow);
      localStorage.setItem(LS_LAST_POPUP, JSON.stringify(allIds));

      // Play sound with popup if enabled
      if (prefs.notify_sound && data.today.length > 0) {
        playNotificationSound(prefs.notify_tone);
        localStorage.setItem(LS_LAST_SOUND, new Date().toISOString());
      }
      return; // Don't double-sound on first check
    }
  }

  // Recurring sound: only for incomplete today-tasks
  if (prefs.notify_sound && data.today.length > 0) {
    const lastSound = localStorage.getItem(LS_LAST_SOUND);
    const interval = prefs.notify_interval || 4;
    if (hoursSince(lastSound) >= interval) {
      playNotificationSound(prefs.notify_tone);
      localStorage.setItem(LS_LAST_SOUND, new Date().toISOString());
    }
  }
}

/**
 * Initialise the notification system. Call once after login.
 * @param {Object} user - User object with notification preferences
 */
export function initNotifications(user) {
  // Stop any previous interval
  if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }

  const prefs = {
    notify_popup:    user.notify_popup ?? 1,
    notify_sound:    user.notify_sound ?? 1,
    notify_time:     user.notify_time  || '09:00',
    notify_interval: user.notify_interval ?? 4,
    notify_tone:     user.notify_tone  || 'default',
  };

  // Initial check (slight delay to let the page settle)
  setTimeout(() => checkNotifications(prefs), 1500);

  // Periodic check every minute (lightweight - only hits API when needed)
  checkInterval = setInterval(() => checkNotifications(prefs), 60_000);
}

/**
 * Stop the notification system (e.g., on logout).
 */
export function stopNotifications() {
  if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }
}
