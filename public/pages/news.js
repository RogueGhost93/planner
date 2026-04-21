/**
 * Module: News
 * Purpose: FreshRSS headline list with external article links
 * Dependencies: /api.js, /router.js (window.planium)
 */

import { api } from '/api.js';
import { t } from '/i18n.js';
import { esc } from '/utils/html.js';

const LIMIT_KEY = 'planium-news-limit';
const LIMITS = [100, 200];

let state = {
  limit: 100,
  headlines: [],
  loading: true,
  connected: true,
};

function getStoredLimit() {
  const raw = Number.parseInt(localStorage.getItem(LIMIT_KEY), 10);
  return LIMITS.includes(raw) ? raw : 100;
}

function formatPublishedAt(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function renderToolbar() {
  return `
    <div class="news-toolbar">
      <div class="news-toolbar__title-wrap">
        <h1 class="news-toolbar__title">${t('news.title')}</h1>
        <span class="news-toolbar__count" id="news-count">${state.headlines.length}</span>
      </div>
      <div class="news-toolbar__actions">
        <div class="news-limit-toggle" role="group" aria-label="${t('news.limitLabel')}">
          ${LIMITS.map((limit) => `
            <button class="news-limit-toggle__btn ${state.limit === limit ? 'news-limit-toggle__btn--active' : ''}"
                    data-limit="${limit}" type="button">
              ${limit}
            </button>
          `).join('')}
        </div>
        <button class="btn btn--icon news-refresh-btn" id="news-refresh-btn"
                type="button" title="${t('news.refresh')}" aria-label="${t('news.refresh')}">
          <i data-lucide="refresh-cw" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `;
}

function renderSkeleton() {
  return `
    <div class="news-list news-list--loading" aria-busy="true">
      ${Array.from({ length: 8 }, () => `
        <div class="news-skeleton">
          <div class="news-skeleton__meta"></div>
          <div class="news-skeleton__title"></div>
          <div class="news-skeleton__title news-skeleton__title--short"></div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderEmpty() {
  const title = state.connected ? t('news.emptyTitle') : t('news.notConnectedTitle');
  const description = state.connected ? t('news.emptyDescription') : t('news.notConnectedDescription');
  const settingsButton = state.connected ? '' : `
    <button class="btn btn--primary" id="news-settings-btn" type="button">
      <i data-lucide="settings" aria-hidden="true"></i>
      ${t('nav.settings')}
    </button>
  `;

  return `
    <div class="empty-state news-empty">
      <div class="empty-state__title">${title}</div>
      <div class="empty-state__description">${description}</div>
      ${settingsButton}
    </div>
  `;
}

function renderItem(item) {
  const source = item.source || 'FreshRSS';
  const time = formatPublishedAt(item.publishedAt);
  const meta = [source, time].filter(Boolean).join(' · ');
  const href = item.url || '#';
  const disabledAttrs = item.url
    ? 'target="_blank" rel="noopener noreferrer"'
    : 'aria-disabled="true" tabindex="-1"';

  return `
    <a class="news-item" href="${esc(href)}" ${disabledAttrs}>
      <span class="news-item__meta">${esc(meta)}</span>
      <span class="news-item__title">${esc(item.title)}</span>
      <span class="news-item__open" aria-hidden="true">
        <i data-lucide="external-link"></i>
      </span>
    </a>
  `;
}

function renderList(container) {
  const list = container.querySelector('#news-content');
  if (!list) return;

  container.querySelector('#news-count').textContent = String(state.headlines.length);
  container.querySelectorAll('.news-limit-toggle__btn').forEach((btn) => {
    btn.classList.toggle('news-limit-toggle__btn--active', Number(btn.dataset.limit) === state.limit);
  });

  if (state.loading) {
    list.innerHTML = renderSkeleton();
  } else if (!state.headlines.length) {
    list.innerHTML = renderEmpty();
  } else {
    list.innerHTML = `
      <div class="news-list">
        ${state.headlines.map(renderItem).join('')}
      </div>
    `;
  }

  if (window.lucide) lucide.createIcons();

  container.querySelector('#news-settings-btn')?.addEventListener('click', () => {
    window.planium?.navigate('/settings');
  });
}

async function loadHeadlines(container) {
  const refreshBtn = container.querySelector('#news-refresh-btn');
  state.loading = true;
  renderList(container);
  if (refreshBtn) refreshBtn.disabled = true;

  try {
    const res = await api.get(`/freshrss/headlines?limit=${state.limit}`);
    state.headlines = Array.isArray(res.data) ? res.data : [];
    state.connected = !!res.data;
  } catch (err) {
    state.headlines = [];
    state.connected = false;
    window.planium?.showToast(err.data?.error ?? err.message, 'warning');
  } finally {
    state.loading = false;
    if (refreshBtn) refreshBtn.disabled = false;
    renderList(container);
  }
}

export async function render(container) {
  state = {
    limit: getStoredLimit(),
    headlines: [],
    loading: true,
    connected: true,
  };

  container.innerHTML = `
    <div class="news-page">
      ${renderToolbar()}
      <div id="news-content"></div>
    </div>
  `;

  container.querySelector('#news-refresh-btn')?.addEventListener('click', () => {
    loadHeadlines(container);
  });

  container.querySelectorAll('.news-limit-toggle__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextLimit = Number(btn.dataset.limit);
      if (nextLimit === state.limit) return;
      state.limit = nextLimit;
      localStorage.setItem(LIMIT_KEY, String(nextLimit));
      loadHeadlines(container);
    });
  });

  if (window.lucide) lucide.createIcons();
  await loadHeadlines(container);
}
