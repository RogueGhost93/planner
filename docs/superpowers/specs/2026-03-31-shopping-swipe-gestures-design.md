# Shopping Swipe Gestures — Design Spec

**Date:** 2026-03-31
**Status:** Approved

## Scope

Add swipe gestures to Shopping list items on mobile. Notes and other modules are explicitly out of scope.

## Behaviour

| Gesture | Action | Reveal colour |
|---------|--------|---------------|
| Swipe left (> threshold) | Toggle checked/unchecked | Green (`--color-success`) |
| Swipe right (> threshold) | Delete item | Red (`--color-danger`) |

- Reveal label for left swipe: "Abhaken" (unchecked) or "Zurück" (already checked)
- Reveal label for right swipe: "Löschen" (always)
- Threshold, damping, and scroll-lock logic identical to `tasks.js`
- On swipe-right delete: optimistic DOM removal → `DELETE /api/v1/shopping/items/:id` → on error restore item and show danger toast
- On swipe-left toggle: optimistic DOM update (class toggle) → `PATCH /api/v1/shopping/items/:id` → on error revert and show danger toast

## CSS Changes

**`layout.css`** — receives shared swipe infrastructure (moved from `tasks.css`):
- `.swipe-row` base styles
- `.swipe-reveal` base styles
- `.swipe-reveal--done` (green, used by tasks and shopping)

**`tasks.css`** — retains only task-specific styles:
- `.swipe-row .task-card`
- `.swipe-reveal--edit` (blue, tasks only)
- `.swipe-row--swiping .task-card`

**`shopping.css`** — new shopping-specific styles:
- `.swipe-row .shopping-item`
- `.swipe-row--swiping .shopping-item`
- `.swipe-reveal--delete` (red, `--color-danger`)
- `@media (max-width: 1023px) .item-delete { display: none }` — × button hidden on mobile, swipe replaces it

## JavaScript Changes (`shopping.js`)

### `renderItem(item)` → wrapped in swipe-row

```html
<div class="swipe-row" data-swipe-id="${item.id}" data-swipe-checked="${item.is_checked}">
  <div class="swipe-reveal swipe-reveal--done">
    <i data-lucide="check|rotate-ccw"></i>
    <span>Abhaken|Zurück</span>
  </div>
  <div class="swipe-reveal swipe-reveal--delete">
    <i data-lucide="trash-2"></i>
    <span>Löschen</span>
  </div>
  <!-- existing .shopping-item content, item-delete button kept for desktop -->
</div>
```

### New `wireSwipeGestures(container)`

Registers `touchstart` / `touchmove` (passive: false) / `touchend` on each `.swipe-row` inside `#items-list`. Logic mirrors tasks.js:

1. `touchstart`: record `startX`, `startY`, clear `locked` flag
2. `touchmove`: determine swipe vs. vertical scroll via angle; once locked to swipe, translate card, fade-in appropriate reveal panel proportionally
3. `touchend`: if locked and `|dx| > SWIPE_THRESHOLD` trigger action; otherwise spring back

Constants (same as tasks.js):
- `SWIPE_THRESHOLD = 80` px
- `SWIPE_LOCK_VERT = 8` px
- `SWIPE_MAX_VERT = 10` px

Called from `renderContent()` after DOM update, alongside existing `wireAutocomplete` and `wireQuickAdd` calls. Also called from `rerenderItems()` after any state change that re-renders the list.

## Out of Scope

- Notes swipe gestures
- Any other module
- Undo toast after delete (delete is immediate; existing × button provided undo-less delete already)
- Desktop swipe via mouse/pointer events
