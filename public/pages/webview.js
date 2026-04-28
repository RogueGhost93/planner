import { api } from '/api.js';
import { t } from '/i18n.js';
import { esc } from '/utils/html.js';

async function loadConfig() {
  return api.get('/webview/config');
}

function renderLoading() {
  return `
    <div class="empty-state webview-empty">
      <div class="empty-state__title">${t('webview.loadingTitle')}</div>
      <div class="empty-state__description">${t('webview.loadingDescription')}</div>
    </div>
  `;
}

function renderMissing() {
  return `
    <div class="empty-state webview-empty">
      <div class="empty-state__title">${t('webview.notConfiguredTitle')}</div>
      <div class="empty-state__description">${t('webview.notConfiguredDescription')}</div>
      <div class="webview-empty__hint">Set <code>PLANIUM_WEBVIEW_URL</code> on the server and restart Planium.</div>
    </div>
  `;
}

function renderFrame(url) {
  return `
    <div class="webview-shell">
      <div class="webview-toolbar">
        <div class="webview-toolbar__meta">
          <h1 class="webview-title">${t('webview.title')}</h1>
          <div class="webview-url">${esc(url)}</div>
        </div>
        <div class="webview-toolbar__actions">
          <button class="btn btn--ghost" id="webview-open-btn" type="button">
            <i data-lucide="external-link" aria-hidden="true"></i>
            ${t('webview.openInNewTab')}
          </button>
          <button class="btn btn--ghost btn--icon" id="webview-reload-btn" type="button"
                  aria-label="${t('common.reload')}" title="${t('common.reload')}">
            <i data-lucide="refresh-cw" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div class="webview-frame-wrap">
        <iframe
          class="webview-frame"
          id="webview-frame"
          src="${esc(url)}"
          title="${t('webview.title')}"
          loading="eager"
          referrerpolicy="no-referrer"
        ></iframe>
      </div>
    </div>
  `;
}

function wireControls(container, url) {
  container.querySelector('#webview-open-btn')?.addEventListener('click', () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  });
  container.querySelector('#webview-reload-btn')?.addEventListener('click', () => {
    const iframe = container.querySelector('#webview-frame');
    if (iframe) iframe.src = iframe.src;
  });
}

export async function render(container) {
  document.title = `${t('webview.title')} · Planium`;
  container.innerHTML = renderLoading();

  let config;
  try {
    config = await loadConfig();
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state webview-empty">
        <div class="empty-state__title">${t('common.errorOccurred')}</div>
        <div class="empty-state__description">${esc(err?.message || t('common.errorGeneric'))}</div>
      </div>
    `;
    return;
  }

  if (!config?.configured || !config?.url) {
    container.innerHTML = renderMissing();
    return;
  }

  container.innerHTML = renderFrame(config.url);
  wireControls(container, config.url);
  container.querySelector('#webview-frame')?.addEventListener('load', () => {
    container.querySelector('.webview-shell')?.classList.add('webview-shell--loaded');
  });

  window.lucide?.createIcons();
}
