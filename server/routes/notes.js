/**
 * Modul: Pinnwand / Notizen (Notes)
 * Zweck: REST-API-Routen für Notizen (CRUD, Pin-Toggle)
 * Abhängigkeiten: express, server/db.js, server/auth.js
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../db');

const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

/**
 * GET /api/v1/notes
 * Alle Notizen, angepinnte zuerst, dann nach updated_at DESC.
 * Response: { data: Note[] }
 */
router.get('/', (req, res) => {
  try {
    const notes = db.get().prepare(`
      SELECT n.*, u.display_name AS creator_name, u.avatar_color AS creator_color
      FROM notes n
      LEFT JOIN users u ON u.id = n.created_by
      ORDER BY n.pinned DESC, n.updated_at DESC
    `).all();
    res.json({ data: notes });
  } catch (err) {
    console.error('[notes/GET /]', err);
    res.status(500).json({ error: 'Interner Fehler', code: 500 });
  }
});

/**
 * POST /api/v1/notes
 * Neue Notiz anlegen.
 * Body: { content, title?, color?, pinned? }
 * Response: { data: Note }
 */
router.post('/', (req, res) => {
  try {
    const { content, title = null, color = '#FFEB3B', pinned = 0 } = req.body;

    if (!content || !content.trim())
      return res.status(400).json({ error: 'Inhalt ist erforderlich', code: 400 });
    if (!COLOR_RE.test(color))
      return res.status(400).json({ error: 'Farbe muss #RRGGBB sein', code: 400 });

    const result = db.get().prepare(`
      INSERT INTO notes (content, title, color, pinned, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(content.trim(), title?.trim() || null, color, pinned ? 1 : 0, req.session.userId);

    const note = db.get().prepare(`
      SELECT n.*, u.display_name AS creator_name, u.avatar_color AS creator_color
      FROM notes n LEFT JOIN users u ON u.id = n.created_by
      WHERE n.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ data: note });
  } catch (err) {
    console.error('[notes/POST /]', err);
    res.status(500).json({ error: 'Interner Fehler', code: 500 });
  }
});

/**
 * PUT /api/v1/notes/:id
 * Notiz bearbeiten.
 * Body: { content?, title?, color?, pinned? }
 * Response: { data: Note }
 */
router.put('/:id', (req, res) => {
  try {
    const id   = parseInt(req.params.id, 10);
    const note = db.get().prepare('SELECT * FROM notes WHERE id = ?').get(id);
    if (!note) return res.status(404).json({ error: 'Notiz nicht gefunden', code: 404 });

    const { content, title, color, pinned } = req.body;

    if (color !== undefined && !COLOR_RE.test(color))
      return res.status(400).json({ error: 'Farbe muss #RRGGBB sein', code: 400 });

    db.get().prepare(`
      UPDATE notes
      SET content = COALESCE(?, content),
          title   = ?,
          color   = COALESCE(?, color),
          pinned  = COALESCE(?, pinned)
      WHERE id = ?
    `).run(
      content?.trim() ?? null,
      title !== undefined ? (title?.trim() || null) : note.title,
      color ?? null,
      pinned !== undefined ? (pinned ? 1 : 0) : null,
      id
    );

    const updated = db.get().prepare(`
      SELECT n.*, u.display_name AS creator_name, u.avatar_color AS creator_color
      FROM notes n LEFT JOIN users u ON u.id = n.created_by WHERE n.id = ?
    `).get(id);

    res.json({ data: updated });
  } catch (err) {
    console.error('[notes/PUT /:id]', err);
    res.status(500).json({ error: 'Interner Fehler', code: 500 });
  }
});

/**
 * PATCH /api/v1/notes/:id/pin
 * Pin-Status toggeln.
 * Response: { data: { id, pinned } }
 */
router.patch('/:id/pin', (req, res) => {
  try {
    const id   = parseInt(req.params.id, 10);
    const note = db.get().prepare('SELECT pinned FROM notes WHERE id = ?').get(id);
    if (!note) return res.status(404).json({ error: 'Notiz nicht gefunden', code: 404 });

    const newPinned = note.pinned ? 0 : 1;
    db.get().prepare('UPDATE notes SET pinned = ? WHERE id = ?').run(newPinned, id);
    res.json({ data: { id, pinned: newPinned } });
  } catch (err) {
    console.error('[notes/PATCH /:id/pin]', err);
    res.status(500).json({ error: 'Interner Fehler', code: 500 });
  }
});

/**
 * DELETE /api/v1/notes/:id
 * Notiz löschen.
 * Response: 204 No Content
 */
router.delete('/:id', (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const result = db.get().prepare('DELETE FROM notes WHERE id = ?').run(id);
    if (result.changes === 0)
      return res.status(404).json({ error: 'Notiz nicht gefunden', code: 404 });
    res.status(204).end();
  } catch (err) {
    console.error('[notes/DELETE /:id]', err);
    res.status(500).json({ error: 'Interner Fehler', code: 500 });
  }
});

module.exports = router;
