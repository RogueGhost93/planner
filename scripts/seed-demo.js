/**
 * Demo Seed Script - Planium
 * Usage: node scripts/seed-demo.js [--db /path/to/planium.db]
 *
 * Creates:
 *   - 2 users (admin: demo / member: sam)
 *   - Task lists with personal tasks
 *   - Calendar events
 *   - Meals (full week, all slots)
 *   - Contacts
 *   - Budget entries
 *   - Quick notes (public + private)
 *   - Shopping list with multiple sublists
 *   - Notebook notes
 *   - Filebox files (global + per-user)
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const dbIdx = args.indexOf('--db');
const DB_PATH = dbIdx !== -1 ? args[dbIdx + 1] : resolve(__dirname, '..', 'planium.db');

// Mirror filebox.js resolveDataDir() logic
const DATA_DIR    = process.env.DATA_DIR || dirname(DB_PATH);
const FILEBOX_ROOT = resolve(DATA_DIR, 'filebox');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function dateTimeFromNow(days, hour, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, min, 0, 0);
  return d.toISOString().slice(0, 16);
}

function thisMonthDate(day) {
  const d = new Date();
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}

function lastMonthDate(day) {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}

// ── Wipe existing data ───────────────────────────────────────────────────────

console.log('Clearing existing data…');
db.prepare('DELETE FROM personal_task_labels').run();
db.prepare('DELETE FROM personal_labels').run();
db.prepare('DELETE FROM task_list_shares').run();
db.prepare('DELETE FROM personal_tasks').run();
db.prepare('DELETE FROM task_lists').run();
db.prepare('DELETE FROM list_items').run();
db.prepare('DELETE FROM lists').run();
db.prepare('DELETE FROM head_lists').run();
db.prepare('DELETE FROM notebook_note_tags').run();
db.prepare('DELETE FROM notebook_tags').run();
db.prepare('DELETE FROM notebook_notes').run();
db.prepare('DELETE FROM budget_entries').run();
db.prepare('DELETE FROM contacts').run();
db.prepare('DELETE FROM notes').run();
db.prepare('DELETE FROM meal_ingredients').run();
db.prepare('DELETE FROM meals').run();
db.prepare('DELETE FROM calendar_events').run();
db.prepare('DELETE FROM tasks').run();
db.prepare("DELETE FROM app_settings  WHERE key = 'quick_note_public'").run();
db.prepare("DELETE FROM user_settings WHERE key IN ('quick_note', 'filebox_enabled')").run();
db.prepare('DELETE FROM users').run();
db.prepare(`DELETE FROM sqlite_sequence WHERE name IN (
  'users','tasks','calendar_events','meals','contacts','notes',
  'budget_entries','lists','list_items','head_lists',
  'task_lists','personal_tasks','notebook_notes','notebook_tags'
)`).run();

// Wipe filebox directories so files don't accumulate across reseeds
try { rmSync(resolve(FILEBOX_ROOT, 'global'),  { recursive: true, force: true }); } catch {}
try { rmSync(resolve(FILEBOX_ROOT, 'demo'),    { recursive: true, force: true }); } catch {}
try { rmSync(resolve(FILEBOX_ROOT, 'sam'),     { recursive: true, force: true }); } catch {}

// ── Users ────────────────────────────────────────────────────────────────────

console.log('Creating users…');
const pw = bcrypt.hashSync('demo1234', 12);

const insertUser = db.prepare(`
  INSERT INTO users (username, display_name, password_hash, role, avatar_color)
  VALUES (?, ?, ?, ?, ?)
`);

const alexId = insertUser.run('demo', 'Alex Demo',   pw, 'admin',  '#2563EB').lastInsertRowid;
const samId  = insertUser.run('sam',  'Sam Johnson', pw, 'member', '#16A34A').lastInsertRowid;

console.log(`  demo (id=${alexId}), sam (id=${samId})`);

// ── Quick Notes ───────────────────────────────────────────────────────────────

console.log('Inserting quick notes…');

// Public (shared with all household members) — stored in app_settings
db.prepare(`INSERT INTO app_settings (key, value) VALUES ('quick_note_public', ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(
  "🛒 Pick up Emma from school at 15:00 today!\n📦 Parcel arriving — someone needs to be home Wed afternoon.\n🔧 Plumber confirmed for Thursday 10:00."
);

// Private per user — stored in user_settings
db.prepare(`INSERT INTO user_settings (user_id, key, value) VALUES (?, 'quick_note', ?)
  ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`).run(
  alexId,
  "Renewal reminder: car insurance due Oct 15.\nGP said follow up in 3 months re: blood pressure.\nPassword hint: usual + !25"
);
db.prepare(`INSERT INTO user_settings (user_id, key, value) VALUES (?, 'quick_note', ?)
  ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`).run(
  samId,
  "Yoga mat is in the boot of the car.\nCall Katrin re: Lena's birthday sleepover.\nReturn library books by Friday!"
);

// ── Task Lists + Personal Tasks ──────────────────────────────────────────────

console.log('Inserting task lists and personal tasks…');

const insertList = db.prepare(`
  INSERT INTO task_lists (owner_id, name, color, sort_order)
  VALUES (?, ?, ?, ?)
`);

const alexPersonalId = insertList.run(alexId, 'Personal', '#2563EB', 0).lastInsertRowid;
const alexWorkId     = insertList.run(alexId, 'Work',     '#7C3AED', 1).lastInsertRowid;
const alexHomeId     = insertList.run(alexId, 'Home',     '#059669', 2).lastInsertRowid;
const samFamilyId    = insertList.run(samId,  'Family',   '#DC2626', 0).lastInsertRowid;
const samSchoolId    = insertList.run(samId,  'School',   '#D97706', 1).lastInsertRowid;

const insertTask = db.prepare(`
  INSERT INTO personal_tasks (list_id, title, description, priority, status, due_date, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Alex – Personal
[
  [alexPersonalId, 'Book dentist appointment',   'Annual check-up for the whole family', 'high',   'open',        daysFromNow(3),  0],
  [alexPersonalId, 'Pay electricity bill',       'Due end of month - online banking',    'urgent', 'open',        daysFromNow(2),  1],
  [alexPersonalId, 'Renew car insurance',        'Compare quotes on check24.de first',   'high',   'open',        daysFromNow(10), 2],
  [alexPersonalId, 'Tax return 2025',            'Documents ready in the folder',        'high',   'open',        daysFromNow(18), 3],
  [alexPersonalId, 'Plan summer holiday',        'Italy or Croatia - check flights',     'medium', 'open',        daysFromNow(30), 4],
  [alexPersonalId, 'Call insurance about claim', 'Reference: CLM-2025-0492',            'high',   'done',        daysFromNow(-3), 5],
].forEach(row => insertTask.run(...row));

// Alex – Work
[
  [alexWorkId, 'Prepare Q2 presentation',  'Results + roadmap for all-hands',     'high',   'open',        daysFromNow(4), 0],
  [alexWorkId, 'Review team pull requests','Three open PRs waiting on approval',   'medium', 'open',        daysFromNow(2), 1],
  [alexWorkId, 'Schedule 1:1s for May',    '',                                     'low',    'open',        daysFromNow(7), 2],
  [alexWorkId, 'Onboard new team member',  'Laptop ready, access provisioned',    'medium', 'in_progress', daysFromNow(5), 3],
].forEach(row => insertTask.run(...row));

// Alex – Home
[
  [alexHomeId, 'Fix leaking bathroom faucet', 'Replace washer, tools in basement', 'medium', 'open', daysFromNow(7),  0],
  [alexHomeId, 'Oil change - VW Golf',        'Every 15 000 km / 12 months',       'medium', 'open', daysFromNow(6),  1],
  [alexHomeId, 'Clean out garage',            'Donate old stuff to charity',       'low',    'open', daysFromNow(14), 2],
  [alexHomeId, 'Update home inventory',       'For insurance purposes',            'low',    'open', daysFromNow(25), 3],
  [alexHomeId, 'Grocery run',                 'See shopping list for details',     'medium', 'done', daysFromNow(-1), 4],
].forEach(row => insertTask.run(...row));

// Sam – Family
[
  [samFamilyId, 'Order birthday cake',      "Emma's 8th birthday - chocolate cake", 'high',   'open', daysFromNow(5),  0],
  [samFamilyId, 'Buy birthday gift for Mum','Amazon wishlist or book voucher',      'medium', 'open', daysFromNow(8),  1],
  [samFamilyId, "Emma's party decorations", 'Balloons, banners, table covers',      'medium', 'open', daysFromNow(5),  2],
  [samFamilyId, 'Book summer holiday',      'Italy or Croatia - check with Alex',   'medium', 'open', daysFromNow(30), 3],
].forEach(row => insertTask.run(...row));

// Sam – School
[
  [samSchoolId, 'Sign school permission slip', 'Field trip to the science museum',  'urgent', 'open', daysFromNow(1),  0],
  [samSchoolId, 'Renew library cards',         'All three cards expired last month','low',    'open', daysFromNow(20), 1],
  [samSchoolId, "Leo's football boots",        'Size 35 — paid',                    'medium', 'done', daysFromNow(-2), 2],
].forEach(row => insertTask.run(...row));

// ── Calendar Events ───────────────────────────────────────────────────────────

console.log('Inserting calendar events…');
const insertEvent = db.prepare(`
  INSERT INTO calendar_events (title, description, start_datetime, end_datetime, all_day, location, color, assigned_to, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

[
  ["Emma's Birthday Party",     'Bouncy castle & cake at home',              daysFromNow(5)  + 'T14:00', daysFromNow(5)  + 'T17:00', 0, 'Home',                      '#F59E0B', samId,  samId ],
  ['Dentist - Family',          'Dr. Müller, bring insurance cards',         daysFromNow(3)  + 'T10:00', daysFromNow(3)  + 'T11:30', 0, 'Dental Practice Müller',    '#EF4444', alexId, alexId],
  ['Parent-Teacher Evening',    'Room 12, bring report card',                daysFromNow(9)  + 'T18:30', daysFromNow(9)  + 'T20:00', 0, 'Westpark Primary School',   '#8B5CF6', samId,  samId ],
  ['Science Museum Field Trip', 'Emma - permission slip signed',             daysFromNow(1)  + 'T08:30', daysFromNow(1)  + 'T15:00', 0, 'Natural History Museum',    '#06B6D4', samId,  samId ],
  ['Family BBQ - Mum & Dad',    'Bring potato salad',                        daysFromNow(12) + 'T13:00', daysFromNow(12) + 'T19:00', 0, "Grandma's Garden",          '#F59E0B', alexId, alexId],
  ['Car Service Appointment',   'VW Golf, oil change + tyre check',          daysFromNow(6)  + 'T09:00', daysFromNow(6)  + 'T10:30', 0, 'AutoHaus König',            '#6B7280', alexId, alexId],
  ['Yoga Class',                'Weekly - bring mat',                        daysFromNow(2)  + 'T19:00', daysFromNow(2)  + 'T20:00', 0, 'FitLife Studio',            '#10B981', samId,  samId ],
  ['Yoga Class',                'Weekly - bring mat',                        daysFromNow(9)  + 'T19:00', daysFromNow(9)  + 'T20:00', 0, 'FitLife Studio',            '#10B981', samId,  samId ],
  ["Mum's Birthday",            '',                                          daysFromNow(8)  + 'T00:00', daysFromNow(8)  + 'T00:00', 1, '',                          '#EC4899', alexId, alexId],
  ['Company All-Hands',         'Q2 results + roadmap presentation',         daysFromNow(4)  + 'T10:00', daysFromNow(4)  + 'T12:00', 0, 'Office - Conference Room B','#2563EB', alexId, alexId],
  ['Football Training - Leo',   'Boots & water bottle',                      daysFromNow(2)  + 'T17:00', daysFromNow(2)  + 'T18:30', 0, 'Sports Ground West',        '#F97316', samId,  samId ],
  ['Football Training - Leo',   'Boots & water bottle',                      daysFromNow(7)  + 'T17:00', daysFromNow(7)  + 'T18:30', 0, 'Sports Ground West',        '#F97316', samId,  samId ],
  ['Holiday Planning Evening',  'Italy vs Croatia - laptops out',            daysFromNow(3)  + 'T21:00', daysFromNow(3)  + 'T22:00', 0, 'Home',                      '#14B8A6', alexId, samId ],
  ['GP Appointment - Alex',     'Annual health check',                       daysFromNow(15) + 'T11:00', daysFromNow(15) + 'T11:30', 0, 'Dr. Weber - City Practice', '#EF4444', alexId, alexId],
  ['Weekend City Break',        'Hotel booked - just pack bags!',            daysFromNow(20) + 'T00:00', daysFromNow(22) + 'T00:00', 1, 'Amsterdam',                 '#0EA5E9', alexId, alexId],
].forEach(row => insertEvent.run(...row));

// ── Meals ─────────────────────────────────────────────────────────────────────

console.log('Inserting meals…');
const insertMeal = db.prepare(`
  INSERT INTO meals (date, meal_type, title, notes, created_by)
  VALUES (?, ?, ?, ?, ?)
`);

[
  [-1, 'breakfast', 'Scrambled eggs & toast',      'With smoked salmon'],
  [-1, 'lunch',     'Tomato soup',                  'Served with sourdough bread'],
  [-1, 'dinner',    'Spaghetti Bolognese',           'Kids loved it'],
  [-1, 'snack',     'Apple slices & peanut butter', ''],
  [ 0, 'breakfast', 'Overnight oats',              'Blueberries & honey'],
  [ 0, 'lunch',     'Caesar salad with chicken',    'Homemade dressing'],
  [ 0, 'dinner',    'Grilled salmon & roasted veg', 'Lemon butter sauce'],
  [ 0, 'snack',     'Hummus with carrot sticks',    ''],
  [ 1, 'breakfast', 'Avocado toast',               'Poached eggs on top'],
  [ 1, 'lunch',     'Lentil soup',                 'With crusty bread'],
  [ 1, 'dinner',    'Chicken tikka masala',         'Basmati rice & naan'],
  [ 2, 'breakfast', 'Pancakes with maple syrup',   'Blueberry compote'],
  [ 2, 'lunch',     'Greek salad & pita',          'Extra feta'],
  [ 2, 'dinner',    'Beef stir-fry',               'Jasmine rice, pak choi'],
  [ 2, 'snack',     'Yoghurt & granola',           ''],
  [ 3, 'breakfast', 'Porridge with banana',        'Cinnamon & honey'],
  [ 3, 'lunch',     'Tuna melt sandwich',          'Toasted ciabatta'],
  [ 3, 'dinner',    'Homemade pizza',              "Emma's favourite night!"],
  [ 4, 'breakfast', 'Granola & mixed berries',     'Greek yoghurt'],
  [ 4, 'lunch',     'Minestrone soup',             'Topped with Parmesan'],
  [ 4, 'dinner',    'Roast chicken & potatoes',    'Sunday roast vibes'],
  [ 4, 'snack',     'Fruit salad',                ''],
  [ 5, 'breakfast', 'French toast',               'Powdered sugar & berries'],
  [ 5, 'lunch',     'BLT sandwich',               'Wholemeal bread'],
  [ 5, 'dinner',    'Fish & chips',               'Mushy peas, tartare sauce'],
  [ 6, 'breakfast', 'Smoothie bowl',              'Acai, banana, chia seeds'],
  [ 6, 'lunch',     'Caprese salad & focaccia',   'Fresh basil'],
  [ 6, 'dinner',    'Lamb chops & couscous',      'Mint yoghurt dressing'],
].forEach(([days, type, title, notes]) => insertMeal.run(daysFromNow(days), type, title, notes, alexId));

// ── Contacts ──────────────────────────────────────────────────────────────────

console.log('Inserting contacts…');
const insertContact = db.prepare(`
  INSERT INTO contacts (name, category, phone, email, address, notes)
  VALUES (?, ?, ?, ?, ?, ?)
`);

[
  ['Dr. Anna Weber',           'Doctor',         '+49 231 445 2210', 'praxis@dr-weber.de',            'Bürgerstraße 12, Dortmund',    'GP - appointments Mon–Thu'],
  ['Dr. Thomas Müller',        'Doctor',         '+49 231 887 0034', 'info@zahnarzt-mueller.de',      'Hansastraße 55, Dortmund',     'Family dentist'],
  ['Grandma & Grandpa Johnson','Other',          '+49 2304 78 221',  'oma.johnson@gmail.com',         'Ahornweg 4, Castrop-Rauxel',   "Emma & Leo's grandparents"],
  ['Westpark Primary School',  'School/Nursery', '+49 231 556 8810', 'office@westpark-grundschule.de','Westparkstraße 20, Dortmund',  "Emma's school - Mrs Bauer is class teacher"],
  ['AutoHaus König',           'Tradesperson',   '+49 231 997 1100', 'service@autohaus-koenig.de',    'Industriestraße 88, Dortmund', 'VW service partner - Ref: Golf TDI 2021'],
  ['FitLife Studio',           'Tradesperson',   '+49 231 340 5060', 'hello@fitlife-dortmund.de',     'Rheinlanddamm 14, Dortmund',   "Sam's yoga - Tuesdays 19:00"],
  ['Uncle Mike Johnson',       'Other',          '+49 172 3340 551', 'mike.j@outlook.com',            '',                             "Alex's brother - lives in Hamburg"],
  ['Aunt Claire Becker',       'Other',          '+49 151 2234 8876','claire.becker@web.de',          'Fichtenweg 7, Bochum',         "Sam's sister"],
  ["Leo's Football Coach",     'School/Nursery', '+49 176 5512 4490','trainer@svwest-dortmund.de',    'Sportplatz West, Dortmund',    'Training Tues & Sat 17:00'],
  ['City Library',             'Authority',      '+49 231 502 6600', 'stadtbibliothek@dortmund.de',   'Königswall 18, Dortmund',      'Family cards - renew every 2 years'],
  ['Landlord - Mr Groß',       'Tradesperson',   '+49 231 112 7743', 'vermieter.gross@gmail.com',     '',                             'Emergency maintenance: same number'],
  ["Emma's Best Friend Lena",  'Other',          '+49 231 774 3309', '',                              '',                             "Lena Braun - mum is Katrin +49 231 774 3308"],
].forEach(row => insertContact.run(...row));

// ── Budget ────────────────────────────────────────────────────────────────────

console.log('Inserting budget entries…');
const insertBudget = db.prepare(`
  INSERT INTO budget_entries (title, amount, category, date, is_recurring, created_by)
  VALUES (?, ?, ?, ?, ?, ?)
`);

[
  // Income (positive amount, category = 'Other')
  ['Alex - Monthly Salary',      3850.00,  'Other',     thisMonthDate(1),  1, alexId],
  ['Sam - Part-time Work',       1200.00,  'Other',     thisMonthDate(1),  1, alexId],
  ['Child Benefit',               250.00,  'Other',     thisMonthDate(5),  1, alexId],

  // Fixed expenses
  ['Rent',                      -1450.00,  'Rent',      thisMonthDate(1),  1, alexId],
  ['Car Insurance - VW Golf',     -89.50,  'Insurance', thisMonthDate(1),  1, alexId],
  ['Health Insurance',           -310.00,  'Insurance', thisMonthDate(1),  1, alexId],
  ['Internet & Phone Bundle',     -49.99,  'Other',     thisMonthDate(5),  1, alexId],
  ['Electricity Bill',            -78.00,  'Other',     thisMonthDate(15), 1, alexId],
  ['Netflix',                     -17.99,  'Leisure',   thisMonthDate(10), 1, alexId],
  ['Spotify Family',              -16.99,  'Leisure',   thisMonthDate(10), 1, alexId],
  ['Gym - FitLife Monthly',       -39.00,  'Health',    thisMonthDate(1),  1, alexId],

  // Variable this month
  ['Weekly Groceries - Wk 1',   -142.30,  'Groceries', thisMonthDate(4),  0, samId ],
  ['Weekly Groceries - Wk 2',   -118.75,  'Groceries', thisMonthDate(11), 0, samId ],
  ['Weekly Groceries - Wk 3',   -134.20,  'Groceries', thisMonthDate(18), 0, samId ],
  ['School Trip Payment',         -25.00,  'Education', thisMonthDate(3),  0, samId ],
  ['Birthday Gift - Mum',         -60.00,  'Other',     thisMonthDate(7),  0, alexId],
  ['Restaurant - Date Night',     -87.50,  'Leisure',   thisMonthDate(9),  0, alexId],
  ['Fuel - VW Golf',              -68.00,  'Transport', thisMonthDate(6),  0, alexId],
  ['Pharmacy',                    -22.40,  'Health',    thisMonthDate(8),  0, samId ],
  ["Leo's Football Boots",        -54.99,  'Education', thisMonthDate(12), 0, samId ],
  ['Home Improvement - Tools',    -43.00,  'Other',     thisMonthDate(14), 0, alexId],
  ['Clothing - Emma',             -38.50,  'Clothing',  thisMonthDate(16), 0, samId ],
  ['Weekend Trip Deposit',       -200.00,  'Leisure',   thisMonthDate(19), 0, alexId],

  // Last month (for trend comparison)
  ['Alex - Monthly Salary',      3850.00,  'Other',     lastMonthDate(1),  0, alexId],
  ['Sam - Part-time Work',       1200.00,  'Other',     lastMonthDate(1),  0, alexId],
  ['Rent',                      -1450.00,  'Rent',      lastMonthDate(1),  0, alexId],
  ['Weekly Groceries',           -489.00,  'Groceries', lastMonthDate(10), 0, samId ],
  ['Electricity Bill',            -82.00,  'Other',     lastMonthDate(15), 0, alexId],
  ['Fuel - VW Golf',              -71.00,  'Transport', lastMonthDate(8),  0, alexId],
].forEach(row => insertBudget.run(...row));

// ── Board Notes ───────────────────────────────────────────────────────────────

console.log('Inserting board notes…');
const insertNote = db.prepare(`
  INSERT INTO notes (title, content, color, pinned, shared, created_by)
  VALUES (?, ?, ?, ?, ?, ?)
`);

[
  // shared = 1 (visible to all household members)
  ['How to use this demo',
   'Tasks: track what needs doing.\nCalendar: appointments and recurring events.\nMeals: the week plan and ingredients.\nBudget: income, expenses, and monthly trends.\nNotes: quick reference cards.\nContacts: family and service numbers.\nShopping list: what to buy next.',
   '#2563EB', 1, 1, alexId],

  ['Holiday Checklist',
   'Passports (exp. 2028)\nTravel insurance - check!\nEuro cash - €300\nBook airport parking\nAsk Mike to water plants\nPack sunscreen SPF 50',
   '#0EA5E9', 1, 1, alexId],

  ['WiFi & Smart Home',
   'WiFi: Planium_Home_5G\nPassword: sunshine2024!\nPhilips Hue app: bridge IP 192.168.1.42\nNest thermostat: eco mode 18°C',
   '#F59E0B', 1, 1, alexId],

  ["Emma's School Info",
   "Class: 3b - Mrs Bauer\nSchool starts: 08:10\nCollection: 13:30 (Tue/Thu 15:00)\nAllergy: mild lactose intolerance\nBest friends: Lena, Sophie, Tim",
   '#EC4899', 1, 1, samId],

  ["Leo's Activities",
   'Football: Tues & Sat 17:00 - SV West\nSwimming: Fri 16:00 - Westbad\nNeeds: boots size 35, goggles\nCoach: Herr Krüger +49 176 5512 4490',
   '#F97316', 1, 1, samId],

  ['Emergency Numbers',
   'Police: 110\nFire / Ambulance: 112\nPoison Control: 0800 192 11 10\nLocal GP out-of-hours: 116 117\nNearest A&E: Klinikum Dortmund',
   '#EF4444', 1, 1, alexId],

  // shared = 0 (private — only visible to the creator)
  ['Car - Important Dates',
   'Next service: June 2025 (60,000 km)\nTÜV due: September 2025\nWinter tyres: stored at AutoHaus König\nInsurance renewal: October 2025',
   '#6B7280', 0, 0, alexId],

  ['Book Recommendations',
   'Currently reading: "Atomic Habits" - James Clear\nWishlist:\n• The Thursday Murder Club\n• Lessons in Chemistry\n• Tomorrow, and Tomorrow, and Tomorrow',
   '#8B5CF6', 0, 0, samId],

  ['Garden To-Do',
   '□ Re-pot herbs (basil, rosemary)\n□ Fix fence panel (3rd from gate)\n□ Order mulch for flower beds\n□ Plant tulip bulbs before Nov',
   '#10B981', 0, 0, alexId],
].forEach(row => insertNote.run(...row));

// ── Shopping Lists ────────────────────────────────────────────────────────────

console.log('Inserting shopping lists…');

const insertSublist = db.prepare(`INSERT INTO lists (name, head_list_id, created_by, sort_order) VALUES (?, ?, ?, ?)`);
const insertItem    = db.prepare(`INSERT INTO list_items (list_id, name, quantity, category, is_checked) VALUES (?, ?, ?, ?, ?)`);

// Head list: Groceries
const groceriesHeadId = db.prepare(`INSERT INTO head_lists (name, created_by) VALUES (?, ?)`).run('Groceries', alexId).lastInsertRowid;

const weeklyShopId = insertSublist.run('Weekly Shop', groceriesHeadId, alexId, 0).lastInsertRowid;
[
  ['Whole milk',          '2 l',       'dairy',   0],
  ['Greek yoghurt',       '500 g',     'dairy',   0],
  ['Cheddar cheese',      '300 g',     'dairy',   0],
  ['Free-range eggs',     '12',        'dairy',   0],
  ['Sourdough bread',     '1 loaf',    'bakery',  0],
  ['Wholemeal bread',     '1 loaf',    'bakery',  0],
  ['Chicken breast',      '800 g',     'meat',    0],
  ['Minced beef',         '500 g',     'meat',    0],
  ['Salmon fillets',      '2',         'fish',    0],
  ['Broccoli',            '1 head',    'veg',     0],
  ['Cherry tomatoes',     '250 g',     'veg',     0],
  ['Avocados',            '3',         'veg',     0],
  ['Bananas',             '6',         'fruit',   0],
  ['Blueberries',         '125 g',     'fruit',   0],
  ['Pasta - spaghetti',   '500 g',     'pantry',  0],
  ['Basmati rice',        '1 kg',      'pantry',  0],
  ['Olive oil',           '500 ml',    'pantry',  0],
  ['Oat milk',            '1 l',       'dairy',   0],
  ['Orange juice',        '1 l',       'drinks',  0],
  ['Sparkling water',     '6 × 1 l',   'drinks',  1],
  ["Children's vitamins", '1 pack',    'health',  0],
].forEach(([n, q, c, ch]) => insertItem.run(weeklyShopId, n, q, c, ch));

const farmersMarketId = insertSublist.run('Farmers Market', groceriesHeadId, alexId, 1).lastInsertRowid;
[
  ['Sourdough loaf',      '1',         'bakery',  0],
  ['Free-range eggs',     '6',         'dairy',   0],
  ['Seasonal veg box',    '1',         'veg',     0],
  ['Honey',               '1 jar',     'pantry',  0],
  ['Goat cheese',         '150 g',     'dairy',   0],
  ['Fresh herbs',         'basil, mint','veg',    0],
].forEach(([n, q, c, ch]) => insertItem.run(farmersMarketId, n, q, c, ch));

const pharmacyListId = insertSublist.run('Pharmacy', groceriesHeadId, samId, 2).lastInsertRowid;
[
  ['Paracetamol',         '1 pack',    'health',  0],
  ['Ibuprofen',           '1 pack',    'health',  0],
  ["Children's cough syrup",'1 bottle','health',  0],
  ['Plasters assorted',   '1 box',     'health',  1],
  ['Sunscreen SPF 50',    '200 ml',    'health',  0],
].forEach(([n, q, c, ch]) => insertItem.run(pharmacyListId, n, q, c, ch));

// Head list: Amsterdam Trip (packing list)
const tripHeadId = db.prepare(`INSERT INTO head_lists (name, created_by) VALUES (?, ?)`).run('Amsterdam Trip', alexId).lastInsertRowid;

const packingId = insertSublist.run('Packing', tripHeadId, alexId, 0).lastInsertRowid;
[
  ['Passports',           '2',         'documents',0],
  ['Travel insurance',    '1',         'documents',0],
  ['Phone charger',       '1',         'electronics',0],
  ['Camera',              '1',         'electronics',0],
  ['Rain jacket',         '2',         'clothing', 0],
  ['Comfortable shoes',   '2 pairs',   'clothing', 0],
  ['Sunglasses',          '2',         'clothing', 1],
  ['Toiletries bag',      '1',         'health',   0],
].forEach(([n, q, c, ch]) => insertItem.run(packingId, n, q, c, ch));

// ── Notebook ──────────────────────────────────────────────────────────────────

console.log('Inserting notebook notes…');
const insertNbNote = db.prepare(`
  INSERT INTO notebook_notes (title, content, parent_id, sort_order, created_by)
  VALUES (?, ?, ?, ?, ?)
`);

// Root pages
const nbHomeId = insertNbNote.run('Home & Family', '', null, 0, alexId).lastInsertRowid;
const nbWorkId = insertNbNote.run('Work',          '', null, 1, alexId).lastInsertRowid;
const nbPersonalId = insertNbNote.run('Personal',  '', null, 2, alexId).lastInsertRowid;

// Home & Family children
insertNbNote.run(
  'Holiday Ideas',
  '# Summer Holiday 2025\n\n## Italy\n- Tuscany — Florence, Siena, San Gimignano\n- Amalfi Coast — best in June before crowds\n- Budget estimate: €3,200 all-in\n\n## Croatia\n- Dubrovnik + island hopping\n- Split — great base, cheaper flights\n- Budget estimate: €2,600 all-in\n\n## Decision deadline: end of May',
  nbHomeId, 0, alexId
);
insertNbNote.run(
  "Children's School Info",
  "# Emma — Year 3, Class 3b\n**Teacher:** Mrs Bauer\n**School:** Westpark Primary\n**Hours:** 08:10 – 13:30 (Tue/Thu until 15:00)\n**Allergy:** mild lactose intolerance\n\n# Leo — Year 1\n**Teacher:** Mr Fischer\n**After school club:** Mon & Wed until 16:00",
  nbHomeId, 1, samId
);
insertNbNote.run(
  'Emergency Contacts & Numbers',
  '| Service | Number |\n|---|---|\n| Police | 110 |\n| Fire / Ambulance | 112 |\n| Poison Control | 0800 192 11 10 |\n| GP out-of-hours | 116 117 |\n| Nearest A&E | Klinikum Dortmund |\n\n**Landlord (Mr Groß):** +49 231 112 7743',
  nbHomeId, 2, alexId
);

// Work children
insertNbNote.run(
  'Q2 Planning Notes',
  '# Q2 Goals\n\n- [ ] Ship v2.4 release by end of May\n- [ ] Onboard two new engineers\n- [ ] Complete security audit\n- [ ] Launch beta programme\n\n## All-Hands Agenda\n1. Q1 retrospective (15 min)\n2. Q2 roadmap walkthrough (30 min)\n3. Team Q&A (15 min)',
  nbWorkId, 0, alexId
);
insertNbNote.run(
  'Meeting Notes — April',
  '## 2025-04-22 — Sprint Review\n- Velocity: 42 points (target 40)\n- Blockers: design sign-off on search UI pending\n- Action: Alex to chase design by Friday\n\n## 2025-04-15 — Stakeholder Sync\n- Budget approved for Q2 hires\n- Security audit scheduled for May 12',
  nbWorkId, 1, alexId
);

// Personal children
insertNbNote.run(
  'Reading List',
  '## Currently Reading\n- *Atomic Habits* — James Clear (p. 187)\n\n## Up Next\n- The Thursday Murder Club — Richard Osman\n- Lessons in Chemistry — Bonnie Garmus\n- Tomorrow, and Tomorrow, and Tomorrow — Gabrielle Zevin\n\n## Finished\n- ~~Project Hail Mary~~ ⭐⭐⭐⭐⭐\n- ~~The Midnight Library~~ ⭐⭐⭐⭐',
  nbPersonalId, 0, samId
);
insertNbNote.run(
  'Fitness Goals 2025',
  '# Goals\n- Run 5 km under 28 min by June\n- Yoga 2× per week (on track)\n- Lose 4 kg before summer holiday\n\n# Weekly Log\n| Week | Yoga | Run | Notes |\n|------|------|-----|-------|\n| Apr W3 | ✓ | 4.2 km | good |\n| Apr W4 | ✓ | 4.8 km | PB! |',
  nbPersonalId, 1, alexId
);

// ── Filebox ───────────────────────────────────────────────────────────────────

console.log('Setting up filebox…');

// Enable filebox for both users
const upsertSetting = db.prepare(`
  INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?)
  ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
`);
upsertSetting.run(alexId, 'filebox_enabled', '1');
upsertSetting.run(samId,  'filebox_enabled', '1');

// Create directories
const globalDir = resolve(FILEBOX_ROOT, 'global');
const alexDir   = resolve(FILEBOX_ROOT, 'demo');
const samDir    = resolve(FILEBOX_ROOT, 'sam');
mkdirSync(globalDir, { recursive: true });
mkdirSync(alexDir,   { recursive: true });
mkdirSync(samDir,    { recursive: true });

// Global (shared) files
writeFileSync(resolve(globalDir, 'Emergency Contacts.txt'),
`EMERGENCY CONTACTS
==================
Police:             110
Fire / Ambulance:   112
Poison Control:     0800 192 11 10
GP out-of-hours:    116 117
Nearest A&E:        Klinikum Dortmund

Landlord (Mr Groß): +49 231 112 7743
`);

writeFileSync(resolve(globalDir, 'WiFi & Smart Home.txt'),
`WIFI & SMART HOME
=================
Network:     Planium_Home_5G
Password:    sunshine2024!

Philips Hue bridge IP: 192.168.1.42
Nest thermostat eco mode: 18°C
`);

writeFileSync(resolve(globalDir, 'Holiday Checklist.txt'),
`AMSTERDAM TRIP CHECKLIST
========================
[ ] Passports (exp. 2028)
[ ] Travel insurance — check!
[ ] Euro cash — €300
[ ] Book airport parking
[ ] Ask Mike to water plants
[ ] Pack sunscreen SPF 50
[ ] Phone + camera charged
[ ] Hotel confirmation printed
`);

// Alex's private files
writeFileSync(resolve(alexDir, 'Car Documents.txt'),
`CAR — VW GOLF TDI 2021
======================
Insurance:     CLM-2025-0492  (renewal Oct 2025)
Service:       June 2025 @ 60,000 km
TÜV due:       September 2025
Winter tyres:  stored at AutoHaus König
Workshop:      AutoHaus König — +49 231 997 1100
`);

writeFileSync(resolve(alexDir, 'Work Notes.txt'),
`Q2 PRIORITIES
=============
1. Ship v2.4 by end of May
2. Onboard two new engineers
3. Complete security audit (scheduled May 12)
4. Launch beta programme

USEFUL CONTACTS
===============
IT Helpdesk:  ext. 4400
HR (Maria):   ext. 2201
`);

// Sam's private files
writeFileSync(resolve(samDir, "Children's Medical Info.txt"),
`CHILDREN — MEDICAL INFO
=======================
EMMA (DOB: 2017-03-14)
  Allergy: mild lactose intolerance
  GP: Dr. Anna Weber — +49 231 445 2210
  Blood type: A+

LEO (DOB: 2019-09-02)
  No known allergies
  GP: Dr. Anna Weber — +49 231 445 2210
  Blood type: O+
`);

writeFileSync(resolve(samDir, 'School Timetable.txt'),
`EMMA — CLASS 3B (MRS BAUER)
============================
Mon  08:10–13:30
Tue  08:10–15:00  (after-school club)
Wed  08:10–13:30
Thu  08:10–15:00  (after-school club)
Fri  08:10–12:30

LEO — CLASS 1B (MR FISCHER)
============================
Mon–Thu  08:00–13:00
Fri      08:00–12:00
`);

// ── Done ──────────────────────────────────────────────────────────────────────

db.close();
console.log('\n✓ Demo data inserted successfully!');
console.log('  Login: demo / demo1234  (admin)');
console.log('  Login: sam  / demo1234  (member)');
