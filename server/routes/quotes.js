/**
 * Modul: Quotes
 * Zweck: Liefert ein Zitat des Tages basierend auf dem aktuellen Datum
 * Abhängigkeiten: express, server/data/quotes.json
 */

import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();

let quotes = [];
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const raw = readFileSync(join(__dirname, '..', 'data', 'quotes.json'), 'utf-8');
  quotes = JSON.parse(raw).quotes;
} catch (err) {
  console.error('[Quotes] Failed to load quotes.json:', err.message);
}

/**
 * GET /api/v1/quotes/today
 * Returns a deterministic quote-of-the-day based on the current date.
 */
router.get('/today', (_req, res) => {
  if (!quotes.length) return res.status(404).json({ error: 'No quotes available' });
  const now = new Date();
  const dayOfYear = Math.floor(
    (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % quotes.length;
  res.json(quotes[index]);
});

export default router;
