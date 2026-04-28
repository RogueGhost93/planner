import { t } from '/i18n.js';
import { loadWebviewConfig, renderWebviewCard, wireWebviewCards, webviewItemLabel } from '/components/webview-manager.js';
import { esc } from '/utils/html.js';

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
      <div class="webview-empty__hint">${t('webview.emptyHint')}</div>
    </div>
  `;
}

function renderTabsHidden() {
  return `
    <div class="empty-state webview-empty">
      <div class="empty-state__title">${t('webview.tabsHiddenTitle')}</div>
      <div class="empty-state__description">${t('webview.tabsHiddenDescription')}</div>
      <div class="webview-empty__hint">${t('webview.emptyHint')}</div>
    </div>
  `;
}

function renderPage(items) {
  const pageTitle = items.length === 1 ? webviewItemLabel(items[0]) : t('webview.pageTitle');
  const pageSubtitle = items.length > 1 ? t('webview.pageSubtitle', { count: items.length }) : '';

  return `
    <div class="webview-shell">
      <div class="webview-page-header">
        <div class="webview-page-header__meta">
          <h1 class="webview-page-title">${esc(pageTitle)}</h1>
          ${pageSubtitle ? `<div class="webview-page-subtitle">${esc(pageSubtitle)}</div>` : ''}
        </div>
      </div>

      <div class="webview-list">
        ${items.map((item) => renderWebviewCard(item, { variant: 'page' })).join('')}
      </div>
    </div>
  `;
}

export async function render(container) {
  container.innerHTML = renderLoading();

  let config;
  try {
    config = await loadWebviewConfig();
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state webview-empty">
        <div class="empty-state__title">${t('common.errorOccurred')}</div>
        <div class="empty-state__description">${esc(err?.message || t('common.errorGeneric'))}</div>
      </div>
    `;
    return;
  }

  const items = Array.isArray(config?.items) ? config.items : [];
  if (!items.length) {
    container.innerHTML = renderMissing();
    return;
  }

  if (config.show_in_tabs === false) {
    container.innerHTML = renderTabsHidden();
    return;
  }

  container.innerHTML = renderPage(items);
  wireWebviewCards(container);
  container.querySelectorAll('[data-webview-frame]').forEach((iframe) => {
    iframe.addEventListener('load', () => {
      iframe.closest('.webview-card, .widget--webview')?.classList.add('webview-card--loaded');
    });
  });

  document.title = `${items.length === 1 ? webviewItemLabel(items[0]) : t('webview.pageTitle')} · Planium`;
  window.lucide?.createIcons();
}
