/**
 * Modul: Listen (Shopping / Packing)
 * Zweck: REST-API-Routen für Listen (type='shopping'|'packing'), Items, Autocomplete, Clone
 * Abhängigkeiten: express, server/db.js
 *
 * Routen-Reihenfolge: Statische Pfade (/suggestions, /items/:id) müssen
 * vor dynamischen (/:listId) registriert sein, damit Express korrekt matcht.
 */

import { createLogger } from '../logger.js';
import express from 'express';
import * as db from '../db.js';
import { str, oneOf, collectErrors, MAX_TITLE, MAX_SHORT } from '../middleware/validate.js';

const log = createLogger('Lists');

const router  = express.Router();

// --------------------------------------------------------
// Konstanten
// --------------------------------------------------------

const LIST_TYPES = ['shopping', 'packing'];

const CATEGORIES_BY_TYPE = {
  shopping: [
    'Fruit & Veg', 'Bakery', 'Dairy', 'Meat & Fish',
    'Frozen', 'Drinks', 'Household', 'Toiletries', 'Other',
  ],
  packing: [
    'Clothes', 'Toiletries', 'Electronics', 'Documents', 'Other',
  ],
};

const ALL_CATEGORIES = [...new Set(Object.values(CATEGORIES_BY_TYPE).flat())];

// --------------------------------------------------------
// GET /api/v1/lists/suggestions?q=…&type=shopping
// --------------------------------------------------------
router.get('/suggestions', (req, res) => {
  try {
    const q = (req.query.q ?? '').trim();
    if (q.length < 1) return res.json({ data: [] });

    const type = req.query.type;
    let sql;
    let params;
    if (type && LIST_TYPES.includes(type)) {
      sql = `
        SELECT DISTINCT li.name FROM list_items li
        JOIN lists l ON l.id = li.list_id
        WHERE l.type = ? AND li.name LIKE ? COLLATE NOCASE
        ORDER BY li.name ASC LIMIT 8
      `;
      params = [type, `${q}%`];
    } else {
      sql = `
        SELECT DISTINCT name FROM list_items
        WHERE name LIKE ? COLLATE NOCASE
        ORDER BY name ASC LIMIT 8
      `;
      params = [`${q}%`];
    }

    const rows = db.get().prepare(sql).all(...params);
    res.json({ data: rows.map((r) => r.name) });
  } catch (err) {
    log.error('suggestions Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

// --------------------------------------------------------
// GET /api/v1/lists/categories?type=shopping
// --------------------------------------------------------
router.get('/categories', (req, res) => {
  const type = req.query.type;
  if (!LIST_TYPES.includes(type))
    return res.status(400).json({ error: 'Invalid type.', code: 400 });
  res.json({ data: CATEGORIES_BY_TYPE[type] });
});

// --------------------------------------------------------
// PATCH /api/v1/lists/items/:itemId
// --------------------------------------------------------
router.patch('/items/:itemId', (req, res) => {
  try {
    const item = db.get()
      .prepare('SELECT * FROM list_items WHERE id = ?')
      .get(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Artikel nicht gefunden.', code: 404 });

    const {
      is_checked = item.is_checked,
      name       = item.name,
      quantity   = item.quantity,
      category   = item.category,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'name darf nicht leer sein.', code: 400 });
    if (category && !ALL_CATEGORIES.includes(category))
      return res.status(400).json({ error: 'Invalid category.', code: 400 });

    db.get().prepare(`
      UPDATE list_items
      SET is_checked = ?, name = ?, quantity = ?, category = ?
      WHERE id = ?
    `).run(is_checked ? 1 : 0, name.trim(), quantity ?? null, category, req.params.itemId);

    const updated = db.get()
      .prepare('SELECT * FROM list_items WHERE id = ?')
      .get(req.params.itemId);
    res.json({ data: updated });
  } catch (err) {
    log.error('PATCH items/:id Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

// --------------------------------------------------------
// DELETE /api/v1/lists/items/:itemId
// --------------------------------------------------------
router.delete('/items/:itemId', (req, res) => {
  try {
    const result = db.get()
      .prepare('DELETE FROM list_items WHERE id = ?')
      .run(req.params.itemId);
    if (result.changes === 0)
      return res.status(404).json({ error: 'Artikel nicht gefunden.', code: 404 });
    res.json({ ok: true });
  } catch (err) {
    log.error('DELETE items/:id Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

// --------------------------------------------------------
// GET /api/v1/lists?type=shopping
// --------------------------------------------------------
router.get('/', (req, res) => {
  try {
    const type = req.query.type;
    let sql = `
      SELECT
        l.*,
        COUNT(li.id)                                         AS item_total,
        SUM(CASE WHEN li.is_checked = 1 THEN 1 ELSE 0 END)   AS item_checked
      FROM lists l
      LEFT JOIN list_items li ON li.list_id = l.id
    `;
    const params = [];
    if (type && LIST_TYPES.includes(type)) {
      sql += ' WHERE l.type = ? ';
      params.push(type);
    }
    sql += ' GROUP BY l.id ORDER BY l.sort_order ASC';

    const lists = db.get().prepare(sql).all(...params);
    res.json({ data: lists });
  } catch (err) {
    log.error('GET / Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

// --------------------------------------------------------
// PATCH /api/v1/lists/reorder
// --------------------------------------------------------
router.patch('/reorder', (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array.', code: 400 });

    const update    = db.get().prepare('UPDATE lists SET sort_order = ? WHERE id = ?');
    const updateAll = db.get().transaction((idList) => {
      idList.forEach((id, index) => update.run(index, id));
    });
    updateAll(ids);

    res.json({ ok: true });
  } catch (err) {
    log.error('PATCH /reorder Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

// --------------------------------------------------------
// POST /api/v1/lists
// Body: { name, type?, items?: [{name, quantity?, category?}] }
// --------------------------------------------------------
router.post('/', (req, res) => {
  try {
    const vName = str(req.body.name, 'Name', { max: MAX_TITLE });
    if (vName.error) return res.status(400).json({ error: vName.error, code: 400 });

    const type = req.body.type || 'shopping';
    if (!LIST_TYPES.includes(type))
      return res.status(400).json({ error: 'Invalid type.', code: 400 });

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    for (const it of items) {
      if (!it || typeof it.name !== 'string' || !it.name.trim())
        return res.status(400).json({ error: 'Each item requires a name.', code: 400 });
    }

    const validCategories = CATEGORIES_BY_TYPE[type];
    const newId = db.transaction(() => {
      const maxOrder = db.get()
        .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM lists')
        .get().m;

      const { lastInsertRowid } = db.get()
        .prepare('INSERT INTO lists (name, type, created_by, sort_order) VALUES (?, ?, ?, ?)')
        .run(vName.value, type, req.session.userId, maxOrder + 1);

      const insertItem = db.get().prepare(`
        INSERT INTO list_items (list_id, name, quantity, category) VALUES (?, ?, ?, ?)
      `);
      for (const it of items) {
        const cat = validCategories.includes(it.category) ? it.category : 'Other';
        insertItem.run(lastInsertRowid, it.name.trim(), it.quantity?.trim() || null, cat);
      }

      return lastInsertRowid;
    });

    const list = db.get().prepare('SELECT * FROM lists WHERE id = ?').get(newId);
    res.status(201).json({ data: list });
  } catch (err) {
    log.error('POST / Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

// --------------------------------------------------------
// POST /api/v1/lists/:listId/clone
// Body: { name?, type? }
// --------------------------------------------------------
router.post('/:listId/clone', (req, res) => {
  try {
    const source = db.get().prepare('SELECT * FROM lists WHERE id = ?').get(req.params.listId);
    if (!source) return res.status(404).json({ error: 'Liste nicht gefunden.', code: 404 });

    const newName = (req.body.name ?? `${source.name} (copy)`).trim();
    if (!newName) return res.status(400).json({ error: 'Name ist erforderlich.', code: 400 });

    const newType = req.body.type || source.type;
    if (!LIST_TYPES.includes(newType))
      return res.status(400).json({ error: 'Invalid type.', code: 400 });

    const newId = db.transaction(() => {
      const maxOrder = db.get()
        .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM lists')
        .get().m;

      const { lastInsertRowid } = db.get()
        .prepare('INSERT INTO lists (name, type, created_by, sort_order) VALUES (?, ?, ?, ?)')
        .run(newName, newType, req.session.userId, maxOrder + 1);

      db.get().prepare(`
        INSERT INTO list_items (list_id, name, quantity, category, is_checked)
        SELECT ?, name, quantity, category, 0 FROM list_items WHERE list_id = ?
      `).run(lastInsertRowid, source.id);

      return lastInsertRowid;
    });

    const list = db.get().prepare('SELECT * FROM lists WHERE id = ?').get(newId);
    res.status(201).json({ data: list });
  } catch (err) {
    log.error('POST /:listId/clone Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

// --------------------------------------------------------
// PUT /api/v1/lists/:listId
// --------------------------------------------------------
router.put('/:listId', (req, res) => {
  try {
    const current = db.get().prepare('SELECT * FROM lists WHERE id = ?').get(req.params.listId);
    if (!current) return res.status(404).json({ error: 'Liste nicht gefunden.', code: 404 });

    const vName = str(req.body.name, 'Name', { max: MAX_TITLE });
    if (vName.error) return res.status(400).json({ error: vName.error, code: 400 });

    const type = req.body.type || current.type;
    if (!LIST_TYPES.includes(type))
      return res.status(400).json({ error: 'Invalid type.', code: 400 });

    db.get()
      .prepare('UPDATE lists SET name = ?, type = ? WHERE id = ?')
      .run(vName.value, type, req.params.listId);

    const list = db.get().prepare('SELECT * FROM lists WHERE id = ?').get(req.params.listId);
    res.json({ data: list });
  } catch (err) {
    log.error('PUT /:listId Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

// --------------------------------------------------------
// DELETE /api/v1/lists/:listId
// --------------------------------------------------------
router.delete('/:listId', (req, res) => {
  try {
    const result = db.get()
      .prepare('DELETE FROM lists WHERE id = ?')
      .run(req.params.listId);
    if (result.changes === 0)
      return res.status(404).json({ error: 'Liste nicht gefunden.', code: 404 });
    res.json({ ok: true });
  } catch (err) {
    log.error('DELETE /:listId Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

// --------------------------------------------------------
// GET /api/v1/lists/:listId/items
// --------------------------------------------------------
router.get('/:listId/items', (req, res) => {
  try {
    const list = db.get()
      .prepare('SELECT * FROM lists WHERE id = ?')
      .get(req.params.listId);
    if (!list) return res.status(404).json({ error: 'Liste nicht gefunden.', code: 404 });

    const cats = CATEGORIES_BY_TYPE[list.type] || CATEGORIES_BY_TYPE.shopping;
    const categoryOrder = cats.map((c, i) => `WHEN '${c.replace(/'/g, "''")}' THEN ${i}`).join(' ');

    const items = db.get().prepare(`
      SELECT * FROM list_items
      WHERE list_id = ?
      ORDER BY
        CASE category ${categoryOrder} ELSE ${cats.length} END,
        is_checked ASC,
        created_at ASC
    `).all(req.params.listId);

    res.json({ data: items, list, categories: cats });
  } catch (err) {
    log.error('GET /:listId/items Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

// --------------------------------------------------------
// POST /api/v1/lists/:listId/items
// --------------------------------------------------------
router.post('/:listId/items', (req, res) => {
  try {
    const list = db.get()
      .prepare('SELECT id, type FROM lists WHERE id = ?')
      .get(req.params.listId);
    if (!list) return res.status(404).json({ error: 'Liste nicht gefunden.', code: 404 });

    const cats = CATEGORIES_BY_TYPE[list.type] || CATEGORIES_BY_TYPE.shopping;

    const vName = str(req.body.name, 'Name', { max: MAX_TITLE });
    const vQty  = str(req.body.quantity, 'Menge', { max: MAX_SHORT, required: false });
    const vCat  = oneOf(req.body.category || 'Other', cats, 'Kategorie');
    const errors = collectErrors([vName, vQty, vCat]);
    if (errors.length) return res.status(400).json({ error: errors.join(' '), code: 400 });

    const result = db.get().prepare(`
      INSERT INTO list_items (list_id, name, quantity, category)
      VALUES (?, ?, ?, ?)
    `).run(req.params.listId, vName.value, vQty.value, vCat.value || 'Other');

    const item = db.get()
      .prepare('SELECT * FROM list_items WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json({ data: item });
  } catch (err) {
    log.error('POST /:listId/items Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

// --------------------------------------------------------
// DELETE /api/v1/lists/:listId/items/checked
// --------------------------------------------------------
router.delete('/:listId/items/checked', (req, res) => {
  try {
    const result = db.get().prepare(`
      DELETE FROM list_items WHERE list_id = ? AND is_checked = 1
    `).run(req.params.listId);
    res.json({ deleted: result.changes });
  } catch (err) {
    log.error('DELETE /:listId/items/checked Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.', code: 500 });
  }
});

export default router;
