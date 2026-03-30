/**
 * Modul: Shared Modal-System
 * Zweck: Einheitliches Modal mit Focus-Trap, Escape-Handler, Overlay-Click,
 *        Focus-Restore, Scroll-Lock und aria-modal.
 * Abhängigkeiten: CSS-Klassen aus layout.css (.modal-overlay, .modal-panel, etc.)
 *
 * API:
 *   openModal({ title, content, onSave, onDelete, size }) → void
 *   closeModal() → void
 */

let activeOverlay = null;
let previouslyFocused = null;
let focusTrapHandler = null;

// Overlay-Dimming: theme-color abdunkeln im Standalone-Modus
const OVERLAY_THEME_COLOR = '#1A1A1A';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// --------------------------------------------------------
// Focus-Trap (Spec §5.2)
// --------------------------------------------------------

function trapFocus(container) {
  focusTrapHandler = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = container.querySelectorAll(FOCUSABLE);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  container.addEventListener('keydown', focusTrapHandler);

  // Virtual Keyboard: Focused Input in sichtbaren Bereich scrollen
  function onInputFocus(e) {
    const tag = e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return;
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
  container.addEventListener('focusin', onInputFocus);
  container._onInputFocus = onInputFocus;

  // Focus first focusable element
  const first = container.querySelector(FOCUSABLE);
  if (first) {
    setTimeout(() => first.focus(), 50);
  }
}

// --------------------------------------------------------
// Escape-Handler
// --------------------------------------------------------

function onEscape(e) {
  if (e.key === 'Escape') closeModal();
}

// --------------------------------------------------------
// openModal
// --------------------------------------------------------

/**
 * Öffnet ein Modal mit dem Shared-System.
 *
 * @param {Object}   opts
 * @param {string}   opts.title    — Titel im Modal-Header
 * @param {string}   opts.content  — HTML-String für den Modal-Body
 * @param {Function} [opts.onSave]   — Callback, wird nach Einfügen in DOM aufgerufen
 *                                      (zum Binden von Form-Events)
 * @param {Function} [opts.onDelete] — Falls vorhanden, wird ein Löschen-Button eingebaut
 * @param {string}   [opts.size='md'] — 'sm' | 'md' | 'lg'
 */
export function openModal({ title, content, onSave, onDelete, size = 'md' } = {}) {
  // Vorheriges Modal schließen (kein Stacking)
  if (activeOverlay) closeModal();

  // Focus-Restore vorbereiten
  previouslyFocused = document.activeElement;

  // Scroll-Lock
  document.body.style.overflow = 'hidden';

  const sizeClass = size !== 'md' ? ` modal-panel--${size}` : '';

  const html = `
    <div class="modal-overlay" id="shared-modal-overlay">
      <div class="modal-panel${sizeClass}" role="dialog" aria-modal="true"
           aria-labelledby="shared-modal-title">
        <div class="modal-panel__header">
          <h2 class="modal-panel__title" id="shared-modal-title">${title}</h2>
          <button class="modal-panel__close" data-action="close-modal" aria-label="Schließen">
            <i data-lucide="x" style="width:18px;height:18px" aria-hidden="true"></i>
          </button>
        </div>
        <div class="modal-panel__body">
          ${content}
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
  activeOverlay = document.getElementById('shared-modal-overlay');

  // Lucide-Icons rendern
  if (window.lucide) window.lucide.createIcons();

  // Focus-Trap
  const panel = activeOverlay.querySelector('.modal-panel');
  trapFocus(panel);

  // Overlay-Click schließt Modal
  activeOverlay.addEventListener('click', (e) => {
    if (e.target === activeOverlay) closeModal();
  });

  // Close-Button
  activeOverlay.querySelector('[data-action="close-modal"]')
    ?.addEventListener('click', closeModal);

  // Escape
  document.addEventListener('keydown', onEscape);

  // Callback für Aufrufer (Form-Events binden etc.)
  if (typeof onSave === 'function') onSave(panel);

  // Standalone: Statusbar abdunkeln (Overlay-Effekt)
  if (window.oikos?.setThemeColor) {
    window.oikos.setThemeColor(OVERLAY_THEME_COLOR, OVERLAY_THEME_COLOR);
  }
}

// --------------------------------------------------------
// closeModal
// --------------------------------------------------------

export function closeModal() {
  if (!activeOverlay) return;

  document.removeEventListener('keydown', onEscape);

  // Focus-Trap-Handler entfernen
  if (focusTrapHandler) {
    const panel = activeOverlay.querySelector('.modal-panel');
    if (panel) panel.removeEventListener('keydown', focusTrapHandler);
    focusTrapHandler = null;
  }

  // Virtual-Keyboard-Listener entfernen
  const panel = activeOverlay.querySelector('.modal-panel');
  if (panel?._onInputFocus) {
    panel.removeEventListener('focusin', panel._onInputFocus);
  }

  activeOverlay.remove();
  activeOverlay = null;

  // Scroll-Lock aufheben
  document.body.style.overflow = '';

  // Focus-Restore
  if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
    previouslyFocused.focus();
    previouslyFocused = null;
  }

  // Standalone: Statusbar-Farbe zur aktuellen Route wiederherstellen
  if (window.oikos?.restoreThemeColor) {
    window.oikos.restoreThemeColor();
  }
}
