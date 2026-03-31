# Shopping Swipe Gestures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add left-swipe-to-toggle and right-swipe-to-delete touch gestures to Shopping list items on mobile, replacing the visible × delete button on small screens.

**Architecture:** Shared swipe base CSS is moved from `tasks.css` to `layout.css` so both modules can use it. Shopping-specific styles (delete reveal, mobile button hiding) go in `shopping.css`. `shopping.js` wraps each item in a `swipe-row` and registers touch handlers via a new `wireSwipeGestures()` function, called after every list re-render.

**Tech Stack:** Vanilla JS (ES modules), Touch Events API, CSS custom properties, Node.js built-in test runner (regression tests only — no DOM test framework in this project).

---

## File Map

| File | Change |
|------|--------|
| `public/styles/tasks.css` | Remove `.swipe-row`, `.swipe-reveal`, `.swipe-reveal--done` (moved to layout.css) |
| `public/styles/layout.css` | Add moved shared swipe styles + `.swipe-reveal--done` |
| `public/styles/shopping.css` | Add `.swipe-reveal--delete`, `.swipe-row .shopping-item`, `.swipe-row--swiping .shopping-item`, mobile hide for `.item-delete` |
| `public/pages/shopping.js` | Wrap `renderItem()` output in swipe-row, add `wireSwipeGestures(container)`, call it from `updateItemsList()` |

---

### Task 1: Move shared swipe CSS from tasks.css to layout.css

**Files:**
- Modify: `public/styles/tasks.css` (lines 170–229)
- Modify: `public/styles/layout.css` (append before Print section)

- [ ] **Step 1: Remove base swipe styles from tasks.css**

In `public/styles/tasks.css`, delete the block from `/* Swipe-Wrapper (Mobil-Gesten) */` through `.swipe-reveal--done { ... }` (lines 170–216). Keep only the task-specific rules that follow:

```css
/* Kein Margin mehr am Task-Card selbst (übernimmt swipe-row) */
.swipe-row .task-card {
  margin-bottom: 0;
  border-radius: var(--radius-md);
  position: relative;
  z-index: 1;
  will-change: transform;
}

/* Rechts hinter der Karte = Bearbeiten (Swipe nach rechts) */
.swipe-reveal--edit {
  left: 0;
  background-color: var(--color-accent);
  color: #fff;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}

/* Touch-Feedback: leichte Hervorhebung während Swipe */
.swipe-row--swiping .task-card {
  box-shadow: var(--shadow-lg);
}
```

Add a comment header so the section remains clear:

```css
/* --------------------------------------------------------
 * Swipe-Wrapper — Task-spezifische Styles
 * Basis-Styles (.swipe-row, .swipe-reveal, .swipe-reveal--done)
 * liegen in layout.css
 * -------------------------------------------------------- */
```

- [ ] **Step 2: Add shared swipe styles to layout.css**

In `public/styles/layout.css`, find the Print section (`/* Print-Styles */`) and insert the following block **directly before it**:

```css
/* --------------------------------------------------------
 * Swipe-Wrapper — Gemeinsame Basis (Tasks + Shopping)
 * Modul-spezifische Styles (.swipe-reveal--edit, .swipe-reveal--delete,
 * .swipe-row .task-card, .swipe-row .shopping-item) liegen in den Modul-CSS.
 * -------------------------------------------------------- */
.swipe-row {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
  /* Verhindert ungewolltes Flackern auf iOS */
  -webkit-backface-visibility: hidden;
}

/* Reveal-Panels hinter der Karte */
.swipe-reveal {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  opacity: 0;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.05s linear;
}

/* Gemeinsam: Erledigt / Abhaken (Swipe nach links) */
.swipe-reveal--done {
  right: 0;
  background-color: var(--color-success);
  color: #fff;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
```

- [ ] **Step 3: Run regression tests**

```bash
npm test
```

Expected: `# pass 12` and `# fail 0`

- [ ] **Step 4: Verify tasks swipe still works visually**

Open the app in a browser (or mobile DevTools touch emulation), go to Tasks list, swipe an item left and right. The green "Erledigt" and blue "Bearbeiten" panels must still appear correctly.

- [ ] **Step 5: Commit**

```bash
git add public/styles/tasks.css public/styles/layout.css
git commit -m "refactor: move shared swipe CSS from tasks.css to layout.css"
```

---

### Task 2: Add shopping-specific swipe CSS

**Files:**
- Modify: `public/styles/shopping.css`

- [ ] **Step 1: Find the correct insertion point in shopping.css**

In `public/styles/shopping.css`, locate the section for `.shopping-item` styles. The new swipe styles go **after** the existing `.shopping-item` block.

- [ ] **Step 2: Add the styles**

Append the following after the existing `.shopping-item` rules in `public/styles/shopping.css`:

```css
/* --------------------------------------------------------
 * Swipe-Wrapper — Shopping-spezifische Styles
 * -------------------------------------------------------- */

/* Kein Margin mehr am shopping-item selbst (übernimmt swipe-row) */
.swipe-row .shopping-item {
  margin-bottom: 0;
  border-radius: var(--radius-md);
  position: relative;
  z-index: 1;
  will-change: transform;
}

/* Rechts hinter der Karte = Löschen (Swipe nach rechts) */
.swipe-reveal--delete {
  left: 0;
  background-color: var(--color-danger);
  color: #fff;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}

/* Touch-Feedback: leichte Hervorhebung während Swipe */
.swipe-row--swiping .shopping-item {
  box-shadow: var(--shadow-lg);
}

/* × Löschen-Button auf Mobile ausblenden — Swipe übernimmt */
@media (max-width: 1023px) {
  .item-delete {
    display: none;
  }
}
```

- [ ] **Step 3: Run regression tests**

```bash
npm test
```

Expected: `# pass 12` and `# fail 0`

- [ ] **Step 4: Commit**

```bash
git add public/styles/shopping.css
git commit -m "feat: add shopping swipe CSS (delete reveal, mobile button hide)"
```

---

### Task 3: Wrap renderItem with swipe-row in shopping.js

**Files:**
- Modify: `public/pages/shopping.js`

- [ ] **Step 1: Update renderItem()**

Find `function renderItem(item)` in `public/pages/shopping.js` (currently returns a `.shopping-item` div). Replace the entire function with:

```js
function renderItem(item) {
  const isDone = Boolean(item.is_checked);
  return `
    <div class="swipe-row" data-swipe-id="${item.id}" data-swipe-checked="${item.is_checked}">
      <div class="swipe-reveal swipe-reveal--done" aria-hidden="true">
        <i data-lucide="${isDone ? 'rotate-ccw' : 'check'}" style="width:22px;height:22px" aria-hidden="true"></i>
        <span>${isDone ? 'Zurück' : 'Abhaken'}</span>
      </div>
      <div class="swipe-reveal swipe-reveal--delete" aria-hidden="true">
        <i data-lucide="trash-2" style="width:22px;height:22px" aria-hidden="true"></i>
        <span>Löschen</span>
      </div>
      <div class="shopping-item ${isDone ? 'shopping-item--checked' : ''}"
           data-item-id="${item.id}">
        <button class="item-check ${isDone ? 'item-check--checked' : ''}"
                data-action="toggle-item" data-id="${item.id}" data-checked="${item.is_checked}"
                aria-label="${item.name} ${isDone ? 'als nicht erledigt markieren' : 'abhaken'}">
          <i data-lucide="check" class="item-check__icon" aria-hidden="true"></i>
        </button>
        <div class="item-body">
          <div class="item-name">${item.name}</div>
          ${item.quantity ? `<div class="item-quantity">${item.quantity}</div>` : ''}
        </div>
        <button class="item-delete" data-action="delete-item" data-id="${item.id}"
                aria-label="${item.name} löschen">
          <i data-lucide="x" style="width:16px;height:16px" aria-hidden="true"></i>
        </button>
      </div>
    </div>`;
}
```

- [ ] **Step 2: Run regression tests**

```bash
npm test
```

Expected: `# pass 12` and `# fail 0`

- [ ] **Step 3: Verify shopping list renders without errors**

Open the app in a browser, navigate to Shopping. Items must render with the swipe-row wrapper. The × button must be hidden on mobile (visible on desktop ≥ 1024px). The existing checkbox toggle must still work.

- [ ] **Step 4: Commit**

```bash
git add public/pages/shopping.js
git commit -m "feat: wrap shopping items in swipe-row"
```

---

### Task 4: Add wireSwipeGestures and wire into updateItemsList

**Files:**
- Modify: `public/pages/shopping.js`

- [ ] **Step 1: Add constants at the top of shopping.js**

After the `import` statements (before the `state` declaration), add:

```js
// Swipe-Gesten Konstanten (identisch zu tasks.js)
const SWIPE_THRESHOLD = 80;   // px — Mindestweg für Aktion
const SWIPE_MAX_VERT  = 12;   // px — vertikaler Toleranzbereich
const SWIPE_LOCK_VERT = 30;   // px — ab diesem Weg gilt es als Scroll
```

- [ ] **Step 2: Add wireSwipeGestures() function**

Add the following function **before** `updateItemsList()` in `shopping.js`:

```js
function wireSwipeGestures(container) {
  const listEl = container.querySelector('#items-list');
  if (!listEl) return;

  listEl.querySelectorAll('.swipe-row').forEach((row) => {
    let startX = 0, startY = 0;
    let dx = 0;
    let locked = false; // false | 'swipe' | 'scroll'
    const card = row.querySelector('.shopping-item');
    if (!card) return;

    function resetCard(animate = true) {
      card.style.transition = animate ? 'transform 0.25s ease' : '';
      card.style.transform  = '';
      row.classList.remove('swipe-row--swiping');
      row.querySelector('.swipe-reveal--done').style.opacity    = '0';
      row.querySelector('.swipe-reveal--delete').style.opacity  = '0';
    }

    row.addEventListener('touchstart', (e) => {
      if (document.getElementById('shared-modal-overlay')) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dx     = 0;
      locked = false;
      card.style.transition = '';
    }, { passive: true });

    row.addEventListener('touchmove', (e) => {
      if (locked === 'scroll') return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      dx = currentX - startX;
      const dy = Math.abs(currentY - startY);

      if (locked === false) {
        if (dy > SWIPE_MAX_VERT && Math.abs(dx) < dy) {
          locked = 'scroll';
          resetCard(false);
          return;
        }
        if (Math.abs(dx) > SWIPE_MAX_VERT) {
          locked = 'swipe';
        }
      }

      if (locked !== 'swipe') return;

      if (dy < SWIPE_LOCK_VERT) e.preventDefault();

      const dampened = dx > 0
        ? Math.min(dx,  SWIPE_THRESHOLD + (dx  - SWIPE_THRESHOLD) * 0.2)
        : Math.max(dx, -(SWIPE_THRESHOLD + (-dx - SWIPE_THRESHOLD) * 0.2));

      card.style.transform = `translateX(${dampened}px)`;
      row.classList.add('swipe-row--swiping');

      const progress = Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1);
      if (dx < 0) {
        row.querySelector('.swipe-reveal--done').style.opacity   = String(progress);
        row.querySelector('.swipe-reveal--delete').style.opacity = '0';
      } else {
        row.querySelector('.swipe-reveal--delete').style.opacity = String(progress);
        row.querySelector('.swipe-reveal--done').style.opacity   = '0';
      }
    }, { passive: false });

    row.addEventListener('touchend', async () => {
      if (locked !== 'swipe') { resetCard(false); return; }

      const itemId  = Number(row.dataset.swipeId);
      const checked = Number(row.dataset.swipeChecked);

      if (dx < -SWIPE_THRESHOLD) {
        // Swipe links → abhaken / zurück
        card.style.transition = 'transform 0.2s ease';
        card.style.transform  = 'translateX(-110%)';
        vibrate(40);
        setTimeout(async () => {
          resetCard(false);
          const newVal = checked ? 0 : 1;
          const item   = state.items.find((i) => i.id === itemId);
          if (item) {
            item.is_checked = newVal;
            updateItemsList(container);
            updateListCounter(state.activeListId, 0, newVal ? 1 : -1);
            renderTabs(container);
          }
          try {
            await api.patch(`/shopping/items/${itemId}`, { is_checked: newVal });
            vibrate(10);
          } catch (err) {
            if (item) item.is_checked = checked;
            updateItemsList(container);
            window.oikos.showToast(err.message, 'danger');
          }
        }, 200);

      } else if (dx > SWIPE_THRESHOLD) {
        // Swipe rechts → löschen
        card.style.transition = 'transform 0.2s ease';
        card.style.transform  = 'translateX(110%)';
        vibrate(40);
        setTimeout(async () => {
          const item = state.items.find((i) => i.id === itemId);
          try {
            await api.delete(`/shopping/items/${itemId}`);
            state.items = state.items.filter((i) => i.id !== itemId);
            updateItemsList(container);
            updateListCounter(state.activeListId, -1, item?.is_checked ? -1 : 0);
            renderTabs(container);
          } catch (err) {
            resetCard(true);
            window.oikos.showToast(err.message, 'danger');
          }
        }, 200);

      } else {
        resetCard(true);
      }
    });
  });
}
```

- [ ] **Step 3: Call wireSwipeGestures from updateItemsList()**

In `updateItemsList(container)`, after the `stagger(...)` call, add:

```js
wireSwipeGestures(container);
```

The updated block looks like this:

```js
function updateItemsList(container) {
  const listEl = container.querySelector('#items-list');
  if (listEl) {
    listEl.innerHTML = renderItems();
    if (window.lucide) window.lucide.createIcons();
    stagger(listEl.querySelectorAll('.shopping-item'));
    wireSwipeGestures(container);   // ← new
  }
  // ... rest of function unchanged
}
```

- [ ] **Step 4: Run regression tests**

```bash
npm test
```

Expected: `# pass 12` and `# fail 0`

- [ ] **Step 5: Verify swipe gestures work end-to-end**

Test in mobile DevTools (Chrome → Toggle device toolbar → touch emulation):

1. Open Shopping, add 3 test items
2. Swipe an item **left** past 80 px → green panel appears → item toggles to checked (strikethrough) → swipe again to uncheck
3. Swipe an item **right** past 80 px → red panel appears → item is removed from list
4. Swipe < 80 px in either direction → card springs back, no action
5. Scroll the list vertically → no swipe triggers
6. On desktop (≥ 1024px): × delete button is visible, swipe not triggered by mouse

- [ ] **Step 6: Update CHANGELOG.md**

Add to `## [Unreleased]` → `### Added`:

```
- Shopping: swipe-left to toggle checked/unchecked, swipe-right to delete items on mobile; × delete button hidden on mobile in favour of swipe gesture
```

- [ ] **Step 7: Commit**

```bash
git add public/pages/shopping.js CHANGELOG.md
git commit -m "feat: swipe gestures on shopping list items (toggle + delete)"
```

---

### Task 5: Push

- [ ] **Push to remote**

```bash
git push
```
