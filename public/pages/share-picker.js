import { api } from '/api.js';
import { openModal, closeModal } from '/components/modal.js';
import { openNewBookmarkModal } from '/pages/bookmarks.js';
import { getPreferredTaskListId, rememberTaskListId, openItemEditDialog } from '/pages/tasks.js';
import { esc } from '/utils/html.js';

export async function render(container) {
  const params      = new URLSearchParams(window.location.search);
  const sharedUrl   = params.get('shared_url') || '';
  const sharedTitle = params.get('shared_title') || '';

  if (!sharedUrl) {
    window.planium.navigate('/');
    return;
  }

  history.replaceState({}, '', '/share-picker');

  container.innerHTML = `<div style="padding:var(--space-6);color:var(--color-text-secondary);font-size:14px">Loading…</div>`;

  const [listsResult, linkdingResult] = await Promise.allSettled([
    api.get('/task-lists'),
    api.get('/linkding/status'),
  ]);

  const taskLists         = listsResult.status === 'fulfilled' ? (listsResult.value.data ?? []) : [];
  const linkdingAvailable = linkdingResult.status === 'fulfilled' && linkdingResult.value?.configured;
  const displayLabel = sharedTitle || sharedUrl;
  const preferredTaskListId = getPreferredTaskListId(taskLists);
  const preferredTaskListName = taskLists.find((list) => list.id === preferredTaskListId)?.name || 'first available list';

  const taskAvailable = taskLists.length > 0;
  const chooserState = [
    !taskAvailable ? 'No task list available' : null,
    !linkdingAvailable ? 'Bookmarks are not configured' : null,
  ].filter(Boolean).join(' • ');

  container.innerHTML = `<div style="padding:var(--space-6);color:var(--color-text-secondary);font-size:14px">Opening…</div>`;
  let handled = false;

  openModal({
    title: 'Shared Link',
    size: 'sm',
    content: `
      <div style="display:grid;gap:var(--space-4)">
        <div>
          <h1 style="margin:0 0 var(--space-2);font-size:20px;line-height:1.2">What do you want to do with this link?</h1>
          <p style="margin:0;font-size:14px;line-height:1.5;color:var(--color-text-secondary);word-break:break-word">${esc(displayLabel)}</p>
        </div>

        ${chooserState ? `
          <div style="padding:var(--space-3);border-radius:var(--radius-md);background:var(--color-surface-secondary);font-size:13px;color:var(--color-text-secondary)">
            ${esc(chooserState)}
          </div>
        ` : ''}

        <div style="display:grid;gap:var(--space-3)">
          <div style="display:grid;gap:var(--space-2)">
            <button type="button" id="share-quick-task" class="btn btn--primary" style="justify-content:center;min-height:48px" ${taskAvailable ? '' : 'disabled'}>
              Quick Task
            </button>
            <div style="font-size:12px;line-height:1.4;color:var(--color-text-secondary)">
              Uses last list: ${esc(preferredTaskListName)}
            </div>
          </div>
          <button type="button" id="share-as-task" class="btn btn--primary" style="justify-content:center;min-height:48px" ${taskAvailable ? '' : 'disabled'}>
            Task
          </button>
          <div style="display:grid;gap:var(--space-2)">
            <button type="button" id="share-quick-bookmark" class="btn btn--primary" style="justify-content:center;min-height:48px" ${linkdingAvailable ? '' : 'disabled'}>
              Quick Bookmark
            </button>
            <div style="font-size:12px;line-height:1.4;color:var(--color-text-secondary)">
              Saves unread, no tags
            </div>
          </div>
          <button type="button" id="share-as-bookmark" class="btn btn--primary" style="justify-content:center;min-height:48px" ${linkdingAvailable ? '' : 'disabled'}>
            Bookmark
          </button>
        </div>

        <div id="share-error" hidden style="padding:var(--space-3);border-radius:var(--radius-md);background:var(--color-danger-bg, rgba(220,38,38,0.08));color:var(--color-danger);font-size:13px;line-height:1.4"></div>

        <div style="display:flex;justify-content:flex-end">
          <button type="button" id="share-cancel" class="btn btn--ghost">Cancel</button>
        </div>
      </div>
    `,
    onClose() {
      if (!handled) window.planium.navigate('/');
    },
    onSave(panel) {
      const errorEl = panel.querySelector('#share-error');
      const controls = [
        panel.querySelector('#share-quick-task'),
        panel.querySelector('#share-as-task'),
        panel.querySelector('#share-quick-bookmark'),
        panel.querySelector('#share-as-bookmark'),
        panel.querySelector('#share-cancel'),
      ].filter(Boolean);
      const controlDefaults = new Map(controls.map((button) => [button, button.disabled]));

      const setBusy = (busy, message = '') => {
        controls.forEach((button) => {
          button.disabled = busy || controlDefaults.get(button);
        });
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.hidden = !message;
        }
      };

      const quickTaskTitle = sharedTitle || sharedUrl;

      panel.querySelector('#share-quick-task')?.addEventListener('click', async () => {
        if (!taskAvailable) return;
        const listId = getPreferredTaskListId(taskLists);
        if (!listId) {
          setBusy(false, 'No task list available');
          return;
        }

        setBusy(true);
        try {
          await api.post(`/personal-lists/${listId}/items`, {
            title: quickTaskTitle,
            description: sharedUrl,
            label_names: [],
            priority: 'none',
            due_date: null,
            due_time: null,
            alarm_at: null,
            is_recurring: 0,
            recurrence_rule: null,
          });
          rememberTaskListId(listId);
          handled = true;
          closeModal();
          setTimeout(() => {
            window.planium.showToast('Task added', 'success');
            window.planium.navigate('/tasks');
          }, 0);
        } catch (err) {
          setBusy(false, err.message || 'Failed to save task');
        }
      });

      panel.querySelector('#share-as-task')?.addEventListener('click', () => {
        if (!taskAvailable) return;
        handled = true;
        closeModal();
        setTimeout(() => {
          openItemEditDialog({
            item: {
              title: sharedTitle || sharedUrl,
              description: sharedUrl,
              labels: [],
              priority: 'none',
              due_date: '',
              due_time: '',
              alarm_at: null,
              recurrence_rule: null,
            },
            showListPicker: true,
            listId: preferredTaskListId,
            taskLists,
            container: document.createElement('div'),
            onSaved: () => {
              window.planium.showToast('Task added', 'success');
              window.planium.navigate('/tasks');
            },
            onClose: () => {
              window.planium.navigate('/');
            },
          });
        }, 0);
      });

      panel.querySelector('#share-quick-bookmark')?.addEventListener('click', async () => {
        if (!linkdingAvailable) return;

        setBusy(true);
        try {
          await api.post('/linkding/bookmarks', {
            url: sharedUrl,
            title: sharedTitle || sharedUrl,
            unread: true,
          });
          handled = true;
          closeModal();
          setTimeout(() => {
            window.planium.showToast('Bookmark saved', 'success');
            window.planium.navigate('/bookmarks');
          }, 0);
        } catch (err) {
          setBusy(false, err.message || 'Failed to save bookmark');
        }
      });

      panel.querySelector('#share-as-bookmark')?.addEventListener('click', () => {
        if (!linkdingAvailable) return;
        handled = true;
        closeModal();
        setTimeout(() => {
          openNewBookmarkModal(null, {
            url: sharedUrl,
            title: sharedTitle || '',
            description: '',
            tags: [],
            unread: true,
          }, () => {
            window.planium.navigate('/');
          });
        }, 0);
      });

      panel.querySelector('#share-cancel')?.addEventListener('click', () => {
        handled = true;
        closeModal();
        window.planium.navigate('/');
      });
    },
  });
}
