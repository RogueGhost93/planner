import { api } from '/api.js';
import { t } from '/i18n.js';
import { esc } from '/utils/html.js';
import { openModal, closeModal, showConfirm } from '/components/modal.js';
import {
  DASHBOARD_WIDGETS,
  defaultDashboardLayout,
  loadDashboardWidgetHiddenIds,
  normalizeDashboardLayout,
  saveDashboardWidgetHiddenIds,
} from '/lib/dashboard-layout.js';
import { loadWebviewConfig, webviewItemLabel } from '/components/webview-manager.js';

function dashboardLayoutApiPath() {
  return '/dashboard/layout';
}

function dashboardBoardStateStorageKey() {
  return 'planium-dashboard-board-state-v1';
}

function dashboardBoardTemplateStorageKey() {
  return 'planium-dashboard-board-template-v1';
}

function dashboardLegacyBoardTemplateStorageKey() {
  return 'planium-dashboard-board-template-legacy-v1';
}

function dashboardLegacyBoardStateStorageKey() {
  return 'planium-dashboard-board-state-legacy-v1';
}

function widgetPickerRows(layout, widgets) {
  const hidden = new Set(layout.hidden ?? []);
  return widgets.map((widget) => {
    const checked = !hidden.has(widget.id);
    return `
      <label class="dashboard-widget-picker__row" for="dashboard-widget-${widget.id}">
        <span class="dashboard-widget-picker__text">
          <span class="dashboard-widget-picker__label">${esc(widget.label ?? t(widget.labelKey))}</span>
          <span class="dashboard-widget-picker__meta">${checked ? 'Shown on dashboard' : 'Hidden from dashboard'}</span>
        </span>
        <span class="toggle-switch">
          <input type="checkbox" id="dashboard-widget-${widget.id}" data-dashboard-widget="${widget.id}" ${checked ? 'checked' : ''} />
          <span class="toggle-switch__slider"></span>
        </span>
      </label>
    `;
  }).join('');
}

async function loadCurrentLayout() {
  try {
    const res = await api.get(dashboardLayoutApiPath());
    const layout = normalizeDashboardLayout(res.data?.layout);
    return {
      ...layout,
      hidden: [...loadDashboardWidgetHiddenIds(layout.hidden)],
    };
  } catch (_) {
    const layout = defaultDashboardLayout();
    return {
      ...layout,
      hidden: [...loadDashboardWidgetHiddenIds(layout.hidden)],
    };
  }
}

export async function openDashboardWidgetPicker({ onSaved } = {}) {
  const [layout, webviewRes] = await Promise.all([
    loadCurrentLayout(),
    loadWebviewConfig().catch(() => null),
  ]);
  const webviewItems = Array.isArray(webviewRes?.items)
    ? webviewRes.items.filter((item) => item?.id && item?.url)
    : [];
  const widgets = [
    ...DASHBOARD_WIDGETS.map((widget) => ({ id: widget.id, labelKey: widget.labelKey })),
    ...webviewItems.map((item) => ({
      id: `webview:${String(item.id).trim()}`,
      label: webviewItemLabel(item),
    })),
  ];

  openModal({
    title: t('settings.dashboardWidgetsTitle'),
    size: 'md',
    content: `
      <form class="dashboard-widget-picker" data-dashboard-widget-picker>
        <div class="dashboard-widget-picker__intro">
          <p class="dashboard-widget-picker__lead">${t('settings.dashboardWidgetsHelp')}</p>
        </div>
        <div class="dashboard-widget-picker__card">
          ${widgetPickerRows(layout, widgets)}
        </div>
        <p class="dashboard-widget-picker__status" hidden></p>
        <div class="dashboard-widget-picker__footer">
          <button class="btn btn--secondary" type="button" data-dashboard-widget-picker-reset>${t('common.reset') ?? 'Reset'}</button>
          <button class="btn btn--secondary" type="button" data-dashboard-widget-picker-cancel>Cancel</button>
          <button class="btn btn--primary" type="submit">Save</button>
        </div>
      </form>
    `,
    onSave(panel) {
      const form = panel.querySelector('[data-dashboard-widget-picker]');
      const cancelBtn = panel.querySelector('[data-dashboard-widget-picker-cancel]');
      const resetBtn = panel.querySelector('[data-dashboard-widget-picker-reset]');
      const status = form.querySelector('.dashboard-widget-picker__status');

      cancelBtn?.addEventListener('click', closeModal);
      resetBtn?.addEventListener('click', async () => {
        const ok = await showConfirm('Reset dashboard widgets to the default layout?', { danger: false });
        if (!ok) return;
        try {
          const defaults = defaultDashboardLayout();
          saveDashboardWidgetHiddenIds(defaults.hidden);
          await api.put(dashboardLayoutApiPath(), { layout: defaults });
          localStorage.removeItem(dashboardLegacyBoardStateStorageKey());
          localStorage.removeItem(dashboardBoardStateStorageKey());
          localStorage.removeItem(dashboardBoardTemplateStorageKey());
          localStorage.removeItem(dashboardLegacyBoardTemplateStorageKey());
          closeModal();
          if (typeof onSaved === 'function') {
            onSaved(defaults);
          } else {
            window.location.reload();
          }
        } catch (error) {
          status.hidden = false;
          status.textContent = error?.message || 'Could not reset widget layout.';
        }
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const visible = new Set(
          Array.from(form.querySelectorAll('[data-dashboard-widget]'))
            .filter((input) => input.checked)
            .map((input) => input.dataset.dashboardWidget)
        );
        const hidden = widgets.map((widget) => widget.id).filter((id) => !visible.has(id));
        try {
          saveDashboardWidgetHiddenIds(hidden);
          status.hidden = false;
          status.textContent = 'Saving...';

          closeModal();
          if (typeof onSaved === 'function') {
            onSaved({
              ...layout,
              hidden,
            });
          } else {
            window.location.reload();
          }
        } catch (error) {
          status.hidden = false;
          status.textContent = error?.message || 'Could not save widget layout.';
        }
      });
    },
  });
}
