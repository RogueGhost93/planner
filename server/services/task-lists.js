import * as db from '../db.js';

const HOUSEHOLD_LIST_NAME = 'Household';
const HOUSEHOLD_LIST_COLOR = '#2563EB';

function getHouseholdList() {
  return db.get()
    .prepare('SELECT * FROM task_lists WHERE is_household = 1 LIMIT 1')
    .get();
}

/**
 * Ensure the shared household task list exists.
 *
 * On a fresh install the first admin is created after migrations finished, so
 * migration 25 cannot create the household list yet. This helper fills that
 * gap and also shares the list with any already-existing users.
 */
export function ensureHouseholdTaskList(ownerId) {
  if (!ownerId) {
    throw new Error('ownerId is required to create the household task list.');
  }

  const d = db.get();
  const existing = getHouseholdList();
  if (existing) {
    return existing.id;
  }

  const result = d.prepare(`
    INSERT INTO task_lists (owner_id, name, color, sort_order, is_household, show_priority)
    VALUES (?, ?, ?, -1, 1, 1)
  `).run(ownerId, HOUSEHOLD_LIST_NAME, HOUSEHOLD_LIST_COLOR);

  const listId = result.lastInsertRowid;

  d.prepare(`
    INSERT OR IGNORE INTO task_list_shares (list_id, user_id)
    SELECT ?, id
    FROM users
    WHERE id != ?
  `).run(listId, ownerId);

  return listId;
}

/**
 * Share the household list with a newly created member.
 *
 * If the list does not exist yet, this is a no-op. Bootstrap creation is
 * handled separately by ensureHouseholdTaskList().
 */
export function shareHouseholdTaskListWithUser(userId) {
  if (!userId) {
    throw new Error('userId is required to share the household task list.');
  }

  const householdList = getHouseholdList();
  if (!householdList) {
    return null;
  }

  db.get().prepare(`
    INSERT OR IGNORE INTO task_list_shares (list_id, user_id)
    VALUES (?, ?)
  `).run(householdList.id, userId);

  return householdList.id;
}
