/**
 * Modul: Kontakte (Contacts)
 * Zweck: REST-API-Routen für wichtige Familienkontakte
 * Abhängigkeiten: express, server/db.js, server/auth.js
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../db');

const VALID_CATEGORIES = ['Arzt', 'Schule/Kita', 'Behörde', 'Versicherung',
                           'Handwerker', 'Notfall', 'Sonstiges'];

/**
 * GET /api/v1/contacts
 * Alle Kontakte, optional nach Kategorie gefiltert und nach Name gesucht.
 * Query: ?category=<cat>&q=<search>
 * Response: { data: Contact[] }
 */
router.get('/', (req, res) => {
  try {
    let sql    = 'SELECT * FROM contacts';
    const params = [];
    const where  = [];

    if (req.query.category && VALID_CATEGORIES.includes(req.query.category)) {
      where.push('category = ?');
      params.push(req.query.category);
    }

    if (req.query.q) {
      where.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      const like = `%${req.query.q}%`;
      params.push(like, like, like);
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY category ASC, name ASC';

    const contacts = db.get().prepare(sql).all(...params);
    res.json({ data: contacts });
  } catch (err) {
    console.error('[contacts/GET /]', err);
    res.status(500).json({ error: 'Interner Fehler', code: 500 });
  }
});

/**
 * POST /api/v1/contacts
 * Neuen Kontakt anlegen.
 * Body: { name, category?, phone?, email?, address?, notes? }
 * Response: { data: Contact }
 */
router.post('/', (req, res) => {
  try {
    const {
      name, category = 'Sonstiges',
      phone = null, email = null, address = null, notes = null,
    } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ error: 'Name ist erforderlich', code: 400 });
    if (!VALID_CATEGORIES.includes(category))
      return res.status(400).json({ error: `Ungültige Kategorie: ${category}`, code: 400 });

    const result = db.get().prepare(`
      INSERT INTO contacts (name, category, phone, email, address, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), category, phone || null, email || null,
           address || null, notes || null);

    const contact = db.get().prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ data: contact });
  } catch (err) {
    console.error('[contacts/POST /]', err);
    res.status(500).json({ error: 'Interner Fehler', code: 500 });
  }
});

/**
 * PUT /api/v1/contacts/:id
 * Kontakt bearbeiten.
 * Body: alle Felder optional
 * Response: { data: Contact }
 */
router.put('/:id', (req, res) => {
  try {
    const id      = parseInt(req.params.id, 10);
    const contact = db.get().prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    if (!contact) return res.status(404).json({ error: 'Kontakt nicht gefunden', code: 404 });

    const { name, category, phone, email, address, notes } = req.body;

    if (category !== undefined && !VALID_CATEGORIES.includes(category))
      return res.status(400).json({ error: `Ungültige Kategorie: ${category}`, code: 400 });

    db.get().prepare(`
      UPDATE contacts
      SET name     = COALESCE(?, name),
          category = COALESCE(?, category),
          phone    = ?,
          email    = ?,
          address  = ?,
          notes    = ?
      WHERE id = ?
    `).run(
      name?.trim() ?? null,
      category ?? null,
      phone   !== undefined ? (phone   || null) : contact.phone,
      email   !== undefined ? (email   || null) : contact.email,
      address !== undefined ? (address || null) : contact.address,
      notes   !== undefined ? (notes   || null) : contact.notes,
      id
    );

    const updated = db.get().prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    res.json({ data: updated });
  } catch (err) {
    console.error('[contacts/PUT /:id]', err);
    res.status(500).json({ error: 'Interner Fehler', code: 500 });
  }
});

/**
 * DELETE /api/v1/contacts/:id
 * Kontakt löschen.
 * Response: 204 No Content
 */
router.delete('/:id', (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const result = db.get().prepare('DELETE FROM contacts WHERE id = ?').run(id);
    if (result.changes === 0)
      return res.status(404).json({ error: 'Kontakt nicht gefunden', code: 404 });
    res.status(204).end();
  } catch (err) {
    console.error('[contacts/DELETE /:id]', err);
    res.status(500).json({ error: 'Interner Fehler', code: 500 });
  }
});

/**
 * GET /api/v1/contacts/meta
 * Kategorien-Liste für Dropdowns.
 * Response: { data: { categories } }
 */
router.get('/meta', (req, res) => {
  res.json({ data: { categories: VALID_CATEGORIES } });
});

module.exports = router;
