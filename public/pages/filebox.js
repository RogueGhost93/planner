/**
 * Modul: Filebox
 * Zweck: Einfacher Datei-Ablage: Global (geteilt) + Privat (pro Nutzer)
 * Abhängigkeiten: /api.js, /components/modal.js
 */

import { api } from '/api.js';
import { esc } from '/utils/html.js';
import { showConfirm } from '/components/modal.js';

// --------------------------------------------------------
// State
// --------------------------------------------------------
let state = {
  scope: 'global', // 'global' | 'private'
  files: [],
  loading: false,
};
let _container = null;

// --------------------------------------------------------
// Utilities
// --------------------------------------------------------

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let b = bytes / 1024;
  let u = 0;
  while (b >= 1024 && u < units.length - 1) { b /= 1024; u++; }
  return `${b.toFixed(b < 10 ? 1 : 0)} ${units[u]}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function fileIconFor(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg','bmp','ico'].includes(ext)) return 'image';
  if (['mp4','mov','webm','mkv','avi'].includes(ext)) return 'video';
  if (['mp3','wav','flac','ogg','m4a'].includes(ext)) return 'music';
  if (['pdf'].includes(ext)) return 'file-text';
  if (['zip','tar','gz','7z','rar'].includes(ext)) return 'archive';
  if (['doc','docx','odt'].includes(ext)) return 'file-text';
  if (['xls','xlsx','csv','ods'].includes(ext)) return 'table';
  if (['md','txt','log','json','yaml','yml','xml'].includes(ext)) return 'file-text';
  return 'file';
}

function getCsrfToken() {
  return document.cookie.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('csrf-token='))
    ?.slice('csrf-token='.length) ?? '';
}

// --------------------------------------------------------
// API
// --------------------------------------------------------

async function loadFiles() {
  state.loading = true;
  renderList();
  try {
    const res = await api.get(`/filebox/files?scope=${state.scope}`);
    state.files = res.files || [];
  } catch (err) {
    window.planium.showToast(err.message || 'Failed to load files', 'danger');
    state.files = [];
  } finally {
    state.loading = false;
    renderList();
  }
}

async function uploadFiles(fileList) {
  if (!fileList?.length) return;
  const form = new FormData();
  for (const file of fileList) form.append('file', file);

  try {
    const res = await fetch(`/api/v1/filebox/upload?scope=${state.scope}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRF-Token': getCsrfToken() },
      body: form,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`);
    const n = data.files?.length || 0;
    window.planium.showToast(`Uploaded ${n} file${n === 1 ? '' : 's'}`, 'success');
    await loadFiles();
  } catch (err) {
    window.planium.showToast(err.message || 'Upload failed', 'danger');
  }
}

async function deleteFile(name) {
  const ok = await showConfirm({
    title: 'Delete file?',
    message: `"${name}" will be permanently deleted.`,
    confirmText: 'Delete',
    danger: true,
  });
  if (!ok) return;

  try {
    await api.delete(`/filebox/${state.scope}/${encodeURIComponent(name)}`);
    window.planium.showToast('Deleted', 'success');
    await loadFiles();
  } catch (err) {
    window.planium.showToast(err.message || 'Delete failed', 'danger');
  }
}

// --------------------------------------------------------
// Rendering
// --------------------------------------------------------

function renderList() {
  const listEl = _container?.querySelector('#filebox-list');
  if (!listEl) return;

  if (state.loading) {
    listEl.innerHTML = `<div class="filebox-empty">Loading…</div>`;
    return;
  }
  if (!state.files.length) {
    listEl.innerHTML = `
      <div class="filebox-empty">
        <i data-lucide="inbox" class="filebox-empty__icon" aria-hidden="true"></i>
        <div class="filebox-empty__title">No files yet</div>
        <div class="filebox-empty__hint">Drop files here or tap <strong>Upload</strong> to add some.</div>
      </div>
    `;
    window.lucide?.createIcons();
    return;
  }

  listEl.innerHTML = state.files.map(f => `
    <div class="filebox-item" data-name="${esc(f.name)}">
      <i data-lucide="${fileIconFor(f.name)}" class="filebox-item__icon" aria-hidden="true"></i>
      <div class="filebox-item__body">
        <div class="filebox-item__name" title="${esc(f.name)}">${esc(f.name)}</div>
        <div class="filebox-item__meta">${formatBytes(f.size)} · ${formatDate(f.modifiedAt)}</div>
      </div>
      <div class="filebox-item__actions">
        <a class="filebox-item__btn" href="/api/v1/filebox/download/${encodeURIComponent(state.scope)}/${encodeURIComponent(f.name)}" title="Download" aria-label="Download">
          <i data-lucide="download" aria-hidden="true"></i>
        </a>
        <button class="filebox-item__btn filebox-item__btn--danger" data-action="delete" title="Delete" aria-label="Delete">
          <i data-lucide="trash-2" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `).join('');
  window.lucide?.createIcons();

  listEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const name = e.currentTarget.closest('.filebox-item')?.dataset.name;
      if (name) deleteFile(name);
    });
  });
}

function switchScope(scope) {
  if (scope === state.scope) return;
  state.scope = scope;
  _container.querySelectorAll('[data-scope]').forEach(btn => {
    btn.classList.toggle('filebox-scope__btn--active', btn.dataset.scope === scope);
    btn.setAttribute('aria-pressed', btn.dataset.scope === scope ? 'true' : 'false');
  });
  loadFiles();
}

// --------------------------------------------------------
// Entry point
// --------------------------------------------------------

export async function render(container, _context) {
  _container = container;

  // Status check — if disabled, show the opt-in card instead.
  let status = { enabled: false };
  try { status = await api.get('/filebox/status'); } catch (_) { /* ignore */ }

  if (!status.enabled) {
    container.innerHTML = `
      <div class="page filebox-page">
        <div class="page__header">
          <h1 class="page__title">Filebox</h1>
        </div>
        <div class="filebox-optin">
          <i data-lucide="folder-lock" class="filebox-optin__icon" aria-hidden="true"></i>
          <h2 class="filebox-optin__title">Filebox is disabled</h2>
          <p class="filebox-optin__hint">
            Enable it in Settings to upload and share files via a global folder
            or your own private folder. Host operators can bind-mount the folders
            so files dropped on the server also appear here.
          </p>
          <a href="/settings" data-route="/settings" class="btn btn--primary">Go to Settings</a>
        </div>
      </div>
    `;
    container.querySelector('[data-route]')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.planium.navigate('/settings');
    });
    window.lucide?.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="page filebox-page">
      <div class="page__header filebox-header">
        <h1 class="page__title">Filebox</h1>
        <div class="filebox-scope" role="tablist" aria-label="Scope">
          <button type="button" class="filebox-scope__btn filebox-scope__btn--active" data-scope="global" aria-pressed="true">
            <i data-lucide="users" aria-hidden="true"></i><span>Global</span>
          </button>
          <button type="button" class="filebox-scope__btn" data-scope="private" aria-pressed="false">
            <i data-lucide="user" aria-hidden="true"></i><span>Private</span>
          </button>
        </div>
      </div>

      <div class="filebox-dropzone" id="filebox-dropzone">
        <i data-lucide="upload-cloud" class="filebox-dropzone__icon" aria-hidden="true"></i>
        <div class="filebox-dropzone__text">Drop files here or</div>
        <button type="button" class="btn btn--primary" id="filebox-upload-btn">Choose files</button>
        <input type="file" id="filebox-file-input" multiple hidden />
      </div>

      <div class="filebox-list" id="filebox-list"></div>
    </div>
  `;

  window.lucide?.createIcons();

  // Scope toggle
  container.querySelectorAll('[data-scope]').forEach(btn => {
    btn.addEventListener('click', () => switchScope(btn.dataset.scope));
  });

  // Upload button + file input
  const fileInput = container.querySelector('#filebox-file-input');
  container.querySelector('#filebox-upload-btn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    uploadFiles(fileInput.files);
    fileInput.value = '';
  });

  // Drag-and-drop
  const dz = container.querySelector('#filebox-dropzone');
  ['dragenter', 'dragover'].forEach(ev => {
    dz.addEventListener(ev, (e) => {
      e.preventDefault();
      dz.classList.add('filebox-dropzone--active');
    });
  });
  ['dragleave', 'drop'].forEach(ev => {
    dz.addEventListener(ev, (e) => {
      e.preventDefault();
      if (ev === 'dragleave' && dz.contains(e.relatedTarget)) return;
      dz.classList.remove('filebox-dropzone--active');
    });
  });
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files);
  });

  await loadFiles();
}
