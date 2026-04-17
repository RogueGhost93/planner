/**
 * Modul: Persönliche Aufgabenlisten (Personal Task Lists)
 * Zweck: REST-API für solo Todo-Listen pro Benutzer.
 *        Listen sind privat (nur owner sieht sie), Items sind einfach
 *        (Titel + done-Flag, keine Kategorien, kein Datum).
 * Abhängigkeiten: express, server/db.js, validate.js
 */

import { createLogger } from '../logger.js';
import express from 'express';
import * as db from '../db.js';
import { str, color, collectErrors, MAX_TITLE } from '../middleware/validate.js';

const log = createLogger('PersonalLists');
const router = express.Router();

// --------------------------------------------------------
// Helpers
// --------------------------------------------------------

/** Returns the list row only if it exists AND belongs to the given user. */
function ownedList(listId, userId) {
  return db.get()
    .prepare('SELECT * FROM task_lists WHERE id = ? AND owner_id = ?')
    .get(listId, userId);
}

// --------------------------------------------------------
// GET /api/v1/personal-lists
// All lists owned by the current user, with item counts.
// --------------------------------------------------------
router.get('/', (req, res) => {
  try {
    const lists = db.get().prepare(`
      SELECT
        l.*,
        COALESCE(SUM(CASE WHEN t.done = 0 THEN 1 ELSE 0 END), 0) AS pending_count,
        COALESCE(COUNT(t.id), 0) AS total_count
      FROM task_lists l
      LEFT JOIN personal_tasks t ON t.list_id = l.id
      WHERE l.owner_id = ?
      GROUP BY l.id
      ORDER BY l.sort_order ASC, l.created_at ASC
    `).all(req.session.userId);
    res.json({ data: lists });
  } catch (err) {
    log.error('GET /', err);
    res.status(500).json({ error: 'Server error.', code: 500 });
  }
});

// --------------------------------------------------------
// POST /api/v1/personal-lists
// Body: { name, color? }
// --------------------------------------------------------
router.post('/', (req, res) => {
  try {
    const vName  = str(req.body.name, 'name', { max: MAX_TITLE });
    const vColor = color(req.body.color, 'color');
    const errs = collectErrors([vName, vColor]);
    if (errs.length) return res.status(400).json({ error: errs.join(' '), code: 400 });

    const id = db.transaction(() => {
      const maxOrder = db.get()
        .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM task_lists WHERE owner_id = ?')
        .get(req.session.userId).m;
      const result = db.get().prepare(`
        INSERT INTO task_lists (owner_id, name, color, sort_order)
        VALUES (?, ?, ?, ?)
      `).run(req.session.userId, vName.value, vColor.value || '#2563EB', maxOrder + 1);
      return result.lastInsertRowid;
    });

    const list = db.get().prepare('SELECT * FROM task_lists WHERE id = ?').get(id);
    res.status(201).json({ data: { ...list, pending_count: 0, total_count: 0 } });
  } catch (err) {
    log.error('POST /', err);
    res.status(500).json({ error: 'Server error.', code: 500 });
  }
});

// --------------------------------------------------------
// PUT /api/v1/personal-lists/:id
// Body: { name?, color? }
// --------------------------------------------------------
router.put('/:id', (req, res) => {
  try {
    const list = ownedList(req.params.id, req.session.userId);
    if (!list) return res.status(404).json({ error: 'Not found.', code: 404 });

    const checks = [];
    if (req.body.name  !== undefined) checks.push(str(req.body.name, 'name', { max: MAX_TITLE }));
    if (req.body.color !== undefined) checks.push(color(req.body.color, 'color'));
    const errs = collectErrors(checks);
    if (errs.length) return res.status(400).json({ error: errs.join(' '), code: 400 });

    const newName  = req.body.name  !== undefined ? req.body.name.trim() : list.name;
    const newColor = req.body.color !== undefined ? req.body.color       : list.color;

    db.get().prepare('UPDATE task_lists SET name = ?, color = ? WHERE id = ?')
      .run(newName, newColor, req.params.id);

    res.json({ data: db.get().prepare('SELECT * FROM task_lists WHERE id = ?').get(req.params.id) });
  } catch (err) {
    log.error('PUT /:id', err);
    res.status(500).json({ error: 'Server error.', code: 500 });
  }
});

// --------------------------------------------------------
// DELETE /api/v1/personal-lists/:id
// Cascades to all items.
// --------------------------------------------------------
router.delete('/:id', (req, res) => {
  try {
    const list = ownedList(req.params.id, req.session.userId);
    if (!list) return res.status(404).json({ error: 'Not found.', code: 404 });

    db.get().prepare('DELETE FROM task_lists WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    log.error('DELETE /:id', err);
    res.status(500).json({ error: 'Server error.', code: 500 });
  }
});

// --------------------------------------------------------
// GET /api/v1/personal-lists/:id/items
// All items for the given list (owner-scoped).
// Pending first, then done; insertion order within each.
// --------------------------------------------------------
router.get('/:id/items', (req, res) => {
  try {
    const list = ownedList(req.params.id, req.session.userId);
    if (!list) return res.status(404).json({ error: 'Not found.', code: 404 });

    const items = db.get().prepare(`
      SELECT * FROM personal_tasks
      WHERE list_id = ?
      ORDER BY done ASC, sort_order ASC, id ASC
    `).all(req.params.id);
    res.json({ data: items });
  } catch (err) {
    log.error('GET /:id/items', err);
    res.status(500).json({ error: 'Server error.', code: 500 });
  }
});

// --------------------------------------------------------
// POST /api/v1/personal-lists/:id/items
// Body: { title }
// --------------------------------------------------------
router.post('/:id/items', (req, res) => {
  try {
    const list = ownedList(req.params.id, req.session.userId);
    if (!list) return res.status(404).json({ error: 'Not found.', code: 404 });

    const v = str(req.body.title, 'title', { max: MAX_TITLE });
    if (v.error) return res.status(400).json({ error: v.error, code: 400 });

    const id = db.transaction(() => {
      const maxOrder = db.get()
        .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM personal_tasks WHERE list_id = ?')
        .get(req.params.id).m;
      const result = db.get().prepare(`
        INSERT INTO personal_tasks (list_id, title, sort_order)
        VALUES (?, ?, ?)
      `).run(req.params.id, v.value, maxOrder + 1);
      return result.lastInsertRowid;
    });

    res.status(201).json({
      data: db.get().prepare('SELECT * FROM personal_tasks WHERE id = ?').get(id),
    });
  } catch (err) {
    log.error('POST /:id/items', err);
    res.status(500).json({ error: 'Server error.', code: 500 });
  }
});

// --------------------------------------------------------
// PATCH /api/v1/personal-lists/:id/items/:itemId
// Body: { title?, done? }
// --------------------------------------------------------
router.patch('/:id/items/:itemId', (req, res) => {
  try {
    const list = ownedList(req.params.id, req.session.userId);
    if (!list) return res.status(404).json({ error: 'Not found.', code: 404 });

    const item = db.get()
      .prepare('SELECT * FROM personal_tasks WHERE id = ? AND list_id = ?')
      .get(req.params.itemId, req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.', code: 404 });

    const updates = [];
    const params  = [];

    if (req.body.title !== undefined) {
      const v = str(req.body.title, 'title', { max: MAX_TITLE });
      if (v.error) return res.status(400).json({ error: v.error, code: 400 });
      updates.push('title = ?');
      params.push(v.value);
    }

    if (req.body.done !== undefined) {
      updates.push('done = ?');
      params.push(req.body.done ? 1 : 0);
    }

    if (!updates.length) return res.json({ data: item });

    params.push(req.params.itemId);
    db.get().prepare(`UPDATE personal_tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    res.json({
      data: db.get().prepare('SELECT * FROM personal_tasks WHERE id = ?').get(req.params.itemId),
    });
  } catch (err) {
    log.error('PATCH /:id/items/:itemId', err);
    res.status(500).json({ error: 'Server error.', code: 500 });
  }
});

// --------------------------------------------------------
// DELETE /api/v1/personal-lists/:id/items/:itemId
// --------------------------------------------------------
router.delete('/:id/items/:itemId', (req, res) => {
  try {
    const list = ownedList(req.params.id, req.session.userId);
    if (!list) return res.status(404).json({ error: 'Not found.', code: 404 });

    const result = db.get()
      .prepare('DELETE FROM personal_tasks WHERE id = ? AND list_id = ?')
      .run(req.params.itemId, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Item not found.', code: 404 });
    res.json({ ok: true });
  } catch (err) {
    log.error('DELETE /:id/items/:itemId', err);
    res.status(500).json({ error: 'Server error.', code: 500 });
  }
});

// --------------------------------------------------------
// POST /api/v1/personal-lists/:id/clear-done
// Bulk-removes all done items from a list.
// --------------------------------------------------------
router.post('/:id/clear-done', (req, res) => {
  try {
    const list = ownedList(req.params.id, req.session.userId);
    if (!list) return res.status(404).json({ error: 'Not found.', code: 404 });

    const result = db.get()
      .prepare('DELETE FROM personal_tasks WHERE list_id = ? AND done = 1')
      .run(req.params.id);
    res.json({ ok: true, deleted: result.changes });
  } catch (err) {
    log.error('POST /:id/clear-done', err);
    res.status(500).json({ error: 'Server error.', code: 500 });
  }
});

export default router;
