import express from 'express';
import type { Request, Response } from 'express';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, 'personal_expense_tracker');
fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, 'database.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Education',
  'Entertainment',
  'Healthcare',
  'Others',
] as const;

const PAYMENT_METHODS = [
  'UPI',
  'Debit Card',
  'Credit Card',
  'Cash',
  'Net Banking',
] as const;

const BILLING_CYCLES = ['Monthly', 'Quarterly', 'Yearly'] as const;
const SUBSCRIPTION_STATUSES = ['Active', 'Cancelled'] as const;

function ymDay(baseYear: number, baseMonth: number, monthOffset: number, day: number): string {
  let m = baseMonth + monthOffset;
  let y = baseYear;
  while (m <= 0) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  const safeDay = Math.min(Math.max(1, day), 28);
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      description TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      start_date TEXT NOT NULL,
      next_payment_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
      year INTEGER NOT NULL CHECK(year BETWEEN 2000 AND 2100),
      budget_limit REAL NOT NULL CHECK(budget_limit > 0),
      UNIQUE(month, year)
    );
  `);

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const expCount = (db.prepare('SELECT COUNT(*) as c FROM expenses').get() as { c: number }).c;
  if (expCount === 0) {
    const insertExp = db.prepare(`
      INSERT INTO expenses (title, amount, category, date, payment_method, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const sampleExpenses: [string, number, string, string, string, string][] = [
      ['Fresh Market Groceries', 3450.0, 'Food', ymDay(curYear, curMonth, 0, 2), 'UPI', 'Weekly produce and pantry essentials'],
      ['Metro Transit Pass', 1200.0, 'Travel', ymDay(curYear, curMonth, 0, 3), 'UPI', 'Monthly city commuter pass'],
      ['Electricity & Water Utility', 2850.0, 'Bills', ymDay(curYear, curMonth, 0, 5), 'Net Banking', 'Apartment electricity and water bill'],
      ['Campus Textbook Bundle', 1850.0, 'Education', ymDay(curYear, curMonth, 0, 7), 'Credit Card', 'Database systems and algorithms references'],
      ['Coffee & Lunch with Friends', 980.0, 'Food', ymDay(curYear, curMonth, 0, 9), 'UPI', 'Weekend cafe lunch'],
      ['Running Shoes', 3299.0, 'Shopping', ymDay(curYear, curMonth, 0, 11), 'Credit Card', 'Daily jogging sneakers'],
      ['Pharmacy Prescription', 640.0, 'Healthcare', ymDay(curYear, curMonth, 0, 13), 'Debit Card', 'Vitamins and cold relief'],
      ['Weekend Cinema Tickets', 860.0, 'Entertainment', ymDay(curYear, curMonth, 0, 15), 'UPI', 'Evening movie tickets and snacks'],
      ['Airport Cab Fare', 1150.0, 'Travel', ymDay(curYear, curMonth, 0, 17), 'Credit Card', 'Drop-off ride to station'],
      ['High-Speed Broadband', 999.0, 'Bills', ymDay(curYear, curMonth, 0, 19), 'Net Banking', 'Home fiber internet plan'],
      ['Grocery Restock', 3120.0, 'Food', ymDay(curYear, curMonth, -1, 6), 'Debit Card', 'Monthly grocery staples'],
      ['Train Tickets', 1650.0, 'Travel', ymDay(curYear, curMonth, -1, 14), 'UPI', 'Intercity weekend return fare'],
      ['Online Course Certification', 2499.0, 'Education', ymDay(curYear, curMonth, -1, 19), 'Credit Card', 'Web engineering certificate'],
      ['Utility Bill', 2740.0, 'Bills', ymDay(curYear, curMonth, -1, 22), 'Net Banking', 'Monthly electricity usage'],
      ['Winter Jacket', 3800.0, 'Shopping', ymDay(curYear, curMonth, -2, 8), 'Credit Card', 'Seasonal apparel purchase'],
      ['Dental Checkup', 1500.0, 'Healthcare', ymDay(curYear, curMonth, -2, 16), 'Debit Card', 'Routine cleaning visit'],
      ['Supermarket Run', 3250.0, 'Food', ymDay(curYear, curMonth, -2, 21), 'UPI', 'Household food and snacks'],
      ['Concert Tickets', 2200.0, 'Entertainment', ymDay(curYear, curMonth, -3, 12), 'Credit Card', 'Local live music evening'],
      ['Utility & Mobile Plan', 2680.0, 'Bills', ymDay(curYear, curMonth, -3, 20), 'Net Banking', 'Combined monthly bills'],
      ['Family Dinner', 2450.0, 'Food', ymDay(curYear, curMonth, -4, 15), 'Debit Card', 'Weekend dinner outing'],
    ];
    const seedMany = db.transaction((items: typeof sampleExpenses) => {
      for (const row of items) insertExp.run(...row);
    });
    seedMany(sampleExpenses);
  }

  const subCount = (db.prepare('SELECT COUNT(*) as c FROM subscriptions').get() as { c: number }).c;
  if (subCount === 0) {
    const insertSub = db.prepare(`
      INSERT INTO subscriptions (name, amount, category, billing_cycle, start_date, next_payment_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const sampleSubs: [string, number, string, string, string, string, string][] = [
      ['Netflix Standard', 499.0, 'Entertainment', 'Monthly', ymDay(curYear, curMonth, -5, 10), ymDay(curYear, curMonth, 0, 26), 'Active'],
      ['Spotify Student', 59.0, 'Entertainment', 'Monthly', ymDay(curYear, curMonth, -6, 4), ymDay(curYear, curMonth, 0, 24), 'Active'],
      ['Amazon Prime', 1499.0, 'Shopping', 'Yearly', ymDay(curYear, curMonth, -3, 15), ymDay(curYear, curMonth, 9, 15), 'Active'],
      ['Cloud Storage 200GB', 630.0, 'Bills', 'Quarterly', ymDay(curYear, curMonth, -2, 1), ymDay(curYear, curMonth, 1, 1), 'Active'],
      ['Coursera Plus', 2199.0, 'Education', 'Monthly', ymDay(curYear, curMonth, -4, 18), ymDay(curYear, curMonth, 0, 28), 'Active'],
      ['Fitness App Pro', 499.0, 'Healthcare', 'Monthly', ymDay(curYear, curMonth, -7, 12), ymDay(curYear, curMonth, -1, 12), 'Cancelled'],
    ];
    const seedSubs = db.transaction((items: typeof sampleSubs) => {
      for (const row of items) insertSub.run(...row);
    });
    seedSubs(sampleSubs);
  }

  const budgetCount = (
    db.prepare('SELECT COUNT(*) as c FROM budgets WHERE month = ? AND year = ?').get(curMonth, curYear) as { c: number }
  ).c;
  if (budgetCount === 0) {
    db.prepare('INSERT INTO budgets (month, year, budget_limit) VALUES (?, ?, ?)').run(curMonth, curYear, 25000.0);
  }
}

initDatabase();

function normalizeMonthlyCost(amount: number, cycle: string): number {
  if (cycle === 'Quarterly') return amount / 3;
  if (cycle === 'Yearly') return amount / 12;
  return amount;
}

function isIsoDate(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const d = new Date(`${val}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(val);
}

function parsePositiveId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function parseMonthYear(req: Request): { month: number; year: number } {
  const now = new Date();
  const rawMonth = Number(req.query.month);
  const rawYear = Number(req.query.year);
  const month = Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : now.getMonth() + 1;
  const year = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : now.getFullYear();
  return { month, year };
}

function csvEscape(val: unknown): string {
  let str = val === null || val === undefined ? '' : String(val);
  if (str.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(str[0])) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface SubscriptionRow {
  id: number;
  name: string;
  amount: number;
  category: string;
  billing_cycle: string;
  start_date: string;
  next_payment_date: string;
  status: string;
}

function buildSnapshot(month: number, year: number) {
  const ymPrefix = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;

  const expAgg = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS txCount
       FROM expenses
       WHERE strftime('%Y-%m', date) = ?`
    )
    .get(ymPrefix) as { total: number; txCount: number };

  const monthlyExpenses = Math.round(expAgg.total * 100) / 100;
  const txCount = expAgg.txCount;

  const activeSubs = db
    .prepare(
      `SELECT * FROM subscriptions
       WHERE status = 'Active'
       ORDER BY next_payment_date ASC`
    )
    .all() as SubscriptionRow[];

  const monthlySubscriptionCost =
    Math.round(
      activeSubs.reduce((acc, s) => acc + normalizeMonthlyCost(s.amount, s.billing_cycle), 0) * 100
    ) / 100;

  const totalMonthlySpending = Math.round((monthlyExpenses + monthlySubscriptionCost) * 100) / 100;

  const budgetRow = db
    .prepare('SELECT budget_limit FROM budgets WHERE month = ? AND year = ?')
    .get(month, year) as { budget_limit: number } | undefined;

  const budgetLimit = budgetRow ? Math.round(budgetRow.budget_limit * 100) / 100 : 0;
  const remainingBudget = Math.round((budgetLimit - totalMonthlySpending) * 100) / 100;
  const usagePercent =
    budgetLimit > 0 ? Math.round((totalMonthlySpending / budgetLimit) * 1000) / 10 : 0;

  const categoryBreakdown = db
    .prepare(
      `SELECT category, ROUND(SUM(amount), 2) AS total
       FROM expenses
       WHERE strftime('%Y-%m', date) = ?
       GROUP BY category
       ORDER BY total DESC`
    )
    .all(ymPrefix) as { category: string; total: number }[];

  const monthlyTotalsDesc = db
    .prepare(
      `SELECT strftime('%Y-%m', date) AS monthKey, ROUND(SUM(amount), 2) AS total
       FROM expenses
       GROUP BY monthKey
       ORDER BY monthKey DESC
       LIMIT 6`
    )
    .all() as { monthKey: string; total: number }[];
  const monthlyTotals = [...monthlyTotalsDesc].reverse();

  const dailyTrends = db
    .prepare(
      `SELECT date, ROUND(SUM(amount), 2) AS total
       FROM expenses
       WHERE strftime('%Y-%m', date) = ?
       GROUP BY date
       ORDER BY date ASC`
    )
    .all(ymPrefix) as { date: string; total: number }[];

  const recentExpenses = db
    .prepare(
      `SELECT * FROM expenses
       ORDER BY date DESC, id DESC
       LIMIT 6`
    )
    .all();

  const upcomingSubscriptions = activeSubs.slice(0, 5).map((s) => ({
    ...s,
    monthly_equivalent: Math.round(normalizeMonthlyCost(s.amount, s.billing_cycle) * 100) / 100,
  }));

  return {
    month,
    year,
    monthlyExpenses,
    monthlySubscriptionCost,
    totalMonthlySpending,
    budgetLimit,
    remainingBudget,
    usagePercent,
    txCount,
    activeSubscriptionCount: activeSubs.length,
    recentExpenses,
    upcomingSubscriptions,
    categoryBreakdown,
    monthlyTotals,
    dailyTrends,
  };
}

const app = express();
app.use(express.json({ limit: '256kb' }));

// Dashboard & Reports Snapshot
app.get('/api/dashboard', (req: Request, res: Response) => {
  const { month, year } = parseMonthYear(req);
  res.json(buildSnapshot(month, year));
});

// Expenses CRUD + Search & Filters
app.get('/api/expenses', (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate.trim() : '';
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate.trim() : '';

  let sql = 'SELECT * FROM expenses WHERE 1=1';
  const params: (string | number)[] = [];

  if (search) {
    sql += ' AND (title LIKE ? OR description LIKE ? OR payment_method LIKE ?)';
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }
  if (category && (CATEGORIES as readonly string[]).includes(category)) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (startDate && isIsoDate(startDate)) {
    sql += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate && isIsoDate(endDate)) {
    sql += ' AND date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY date DESC, id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post('/api/expenses', (req: Request, res: Response) => {
  const { title, amount, category, date, payment_method, description } = req.body ?? {};
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const numAmount = Number(amount);
  const cleanDesc = typeof description === 'string' ? description.trim().slice(0, 300) : '';

  if (!cleanTitle || cleanTitle.length > 120) {
    res.status(400).json({ error: 'Expense title is required (max 120 characters).' });
    return;
  }
  if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > 1_000_000) {
    res.status(400).json({ error: 'Amount must be a positive number.' });
    return;
  }
  if (typeof category !== 'string' || !(CATEGORIES as readonly string[]).includes(category)) {
    res.status(400).json({ error: 'Please select a valid category.' });
    return;
  }
  if (!isIsoDate(date)) {
    res.status(400).json({ error: 'Please provide a valid date (YYYY-MM-DD).' });
    return;
  }
  if (typeof payment_method !== 'string' || !(PAYMENT_METHODS as readonly string[]).includes(payment_method)) {
    res.status(400).json({ error: 'Please select a valid payment method.' });
    return;
  }

  const rounded = Math.round(numAmount * 100) / 100;
  const info = db
    .prepare(
      `INSERT INTO expenses (title, amount, category, date, payment_method, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(cleanTitle, rounded, category, date, payment_method, cleanDesc);

  const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

app.put('/api/expenses/:id', (req: Request, res: Response) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid expense ID.' });
    return;
  }
  const existing = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Expense record not found.' });
    return;
  }

  const { title, amount, category, date, payment_method, description } = req.body ?? {};
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const numAmount = Number(amount);
  const cleanDesc = typeof description === 'string' ? description.trim().slice(0, 300) : '';

  if (!cleanTitle || cleanTitle.length > 120) {
    res.status(400).json({ error: 'Expense title is required (max 120 characters).' });
    return;
  }
  if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > 1_000_000) {
    res.status(400).json({ error: 'Amount must be a positive number.' });
    return;
  }
  if (typeof category !== 'string' || !(CATEGORIES as readonly string[]).includes(category)) {
    res.status(400).json({ error: 'Please select a valid category.' });
    return;
  }
  if (!isIsoDate(date)) {
    res.status(400).json({ error: 'Please provide a valid date (YYYY-MM-DD).' });
    return;
  }
  if (typeof payment_method !== 'string' || !(PAYMENT_METHODS as readonly string[]).includes(payment_method)) {
    res.status(400).json({ error: 'Please select a valid payment method.' });
    return;
  }

  const rounded = Math.round(numAmount * 100) / 100;
  db.prepare(
    `UPDATE expenses
     SET title = ?, amount = ?, category = ?, date = ?, payment_method = ?, description = ?
     WHERE id = ?`
  ).run(cleanTitle, rounded, category, date, payment_method, cleanDesc, id);

  const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  res.json(updated);
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid expense ID.' });
    return;
  }
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Expense record not found.' });
    return;
  }
  res.json({ deleted: true, id });
});

// Subscriptions CRUD
app.get('/api/subscriptions', (_req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM subscriptions ORDER BY status ASC, next_payment_date ASC')
    .all() as SubscriptionRow[];

  const enriched = rows.map((s) => ({
    ...s,
    monthly_equivalent: Math.round(normalizeMonthlyCost(s.amount, s.billing_cycle) * 100) / 100,
  }));
  res.json(enriched);
});

app.post('/api/subscriptions', (req: Request, res: Response) => {
  const { name, amount, category, billing_cycle, start_date, next_payment_date, status } = req.body ?? {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const numAmount = Number(amount);

  if (!cleanName || cleanName.length > 100) {
    res.status(400).json({ error: 'Subscription name is required (max 100 characters).' });
    return;
  }
  if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > 100_000) {
    res.status(400).json({ error: 'Subscription amount must be a positive number.' });
    return;
  }
  if (typeof category !== 'string' || !(CATEGORIES as readonly string[]).includes(category)) {
    res.status(400).json({ error: 'Please select a valid category.' });
    return;
  }
  if (typeof billing_cycle !== 'string' || !(BILLING_CYCLES as readonly string[]).includes(billing_cycle)) {
    res.status(400).json({ error: 'Billing cycle must be Monthly, Quarterly, or Yearly.' });
    return;
  }
  if (!isIsoDate(start_date) || !isIsoDate(next_payment_date)) {
    res.status(400).json({ error: 'Start date and next payment date must be valid dates (YYYY-MM-DD).' });
    return;
  }
  const cleanStatus = typeof status === 'string' && (SUBSCRIPTION_STATUSES as readonly string[]).includes(status) ? status : 'Active';

  const rounded = Math.round(numAmount * 100) / 100;
  const info = db
    .prepare(
      `INSERT INTO subscriptions (name, amount, category, billing_cycle, start_date, next_payment_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(cleanName, rounded, category, billing_cycle, start_date, next_payment_date, cleanStatus);

  const created = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(info.lastInsertRowid) as SubscriptionRow;
  res.status(201).json({
    ...created,
    monthly_equivalent: Math.round(normalizeMonthlyCost(created.amount, created.billing_cycle) * 100) / 100,
  });
});

app.put('/api/subscriptions/:id', (req: Request, res: Response) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid subscription ID.' });
    return;
  }
  const existing = db.prepare('SELECT id FROM subscriptions WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Subscription not found.' });
    return;
  }

  const { name, amount, category, billing_cycle, start_date, next_payment_date, status } = req.body ?? {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const numAmount = Number(amount);

  if (!cleanName || cleanName.length > 100) {
    res.status(400).json({ error: 'Subscription name is required (max 100 characters).' });
    return;
  }
  if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > 100_000) {
    res.status(400).json({ error: 'Subscription amount must be a positive number.' });
    return;
  }
  if (typeof category !== 'string' || !(CATEGORIES as readonly string[]).includes(category)) {
    res.status(400).json({ error: 'Please select a valid category.' });
    return;
  }
  if (typeof billing_cycle !== 'string' || !(BILLING_CYCLES as readonly string[]).includes(billing_cycle)) {
    res.status(400).json({ error: 'Billing cycle must be Monthly, Quarterly, or Yearly.' });
    return;
  }
  if (!isIsoDate(start_date) || !isIsoDate(next_payment_date)) {
    res.status(400).json({ error: 'Start date and next payment date must be valid dates.' });
    return;
  }
  if (typeof status !== 'string' || !(SUBSCRIPTION_STATUSES as readonly string[]).includes(status)) {
    res.status(400).json({ error: 'Status must be Active or Cancelled.' });
    return;
  }

  const rounded = Math.round(numAmount * 100) / 100;
  db.prepare(
    `UPDATE subscriptions
     SET name = ?, amount = ?, category = ?, billing_cycle = ?, start_date = ?, next_payment_date = ?, status = ?
     WHERE id = ?`
  ).run(cleanName, rounded, category, billing_cycle, start_date, next_payment_date, status, id);

  const updated = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as SubscriptionRow;
  res.json({
    ...updated,
    monthly_equivalent: Math.round(normalizeMonthlyCost(updated.amount, updated.billing_cycle) * 100) / 100,
  });
});

app.delete('/api/subscriptions/:id', (req: Request, res: Response) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid subscription ID.' });
    return;
  }
  const result = db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Subscription not found.' });
    return;
  }
  res.json({ deleted: true, id });
});

// Monthly Budget
app.post('/api/budget', (req: Request, res: Response) => {
  const { month, year, budget_limit } = req.body ?? {};
  const m = Number(month);
  const y = Number(year);
  const limit = Number(budget_limit);

  if (!Number.isInteger(m) || m < 1 || m > 12) {
    res.status(400).json({ error: 'Month must be between 1 and 12.' });
    return;
  }
  if (!Number.isInteger(y) || y < 2000 || y > 2100) {
    res.status(400).json({ error: 'Year must be between 2000 and 2100.' });
    return;
  }
  if (!Number.isFinite(limit) || limit <= 0 || limit > 10_000_000) {
    res.status(400).json({ error: 'Monthly budget limit must be a positive number.' });
    return;
  }

  const rounded = Math.round(limit * 100) / 100;
  db.prepare(
    `INSERT INTO budgets (month, year, budget_limit)
     VALUES (?, ?, ?)
     ON CONFLICT(month, year) DO UPDATE SET budget_limit = excluded.budget_limit`
  ).run(m, y, rounded);

  res.json(buildSnapshot(m, y));
});

// CSV Export (Excel-compatible UTF-8 BOM + formula-injection protection)
app.get('/api/export/csv', (req: Request, res: Response) => {
  const exportType = typeof req.query.type === 'string' ? req.query.type : 'expenses';
  const { month, year } = parseMonthYear(req);
  const ymPrefix = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;

  const lines: string[] = [];
  let filename = `expenses_${ymPrefix}.csv`;

  if (exportType === 'subscriptions') {
    filename = `subscriptions_${ymPrefix}.csv`;
    lines.push(
      ['Name', 'Category', 'Amount (INR)', 'Billing Cycle', 'Monthly Equivalent (INR)', 'Start Date', 'Next Payment Date', 'Status']
        .map(csvEscape)
        .join(',')
    );
    const rows = db
      .prepare('SELECT * FROM subscriptions ORDER BY next_payment_date ASC')
      .all() as SubscriptionRow[];
    for (const r of rows) {
      const monthlyEq = Math.round(normalizeMonthlyCost(r.amount, r.billing_cycle) * 100) / 100;
      lines.push(
        [
          r.name,
          r.category,
          r.amount.toFixed(2),
          r.billing_cycle,
          monthlyEq.toFixed(2),
          r.start_date,
          r.next_payment_date,
          r.status,
        ]
          .map(csvEscape)
          .join(',')
      );
    }
  } else if (exportType === 'summary') {
    filename = `spending_summary_${ymPrefix}.csv`;
    const snap = buildSnapshot(month, year);
    lines.push(['Metric', 'Value (INR)'].map(csvEscape).join(','));
    lines.push(['Period', ymPrefix].map(csvEscape).join(','));
    lines.push(['Monthly Budget Limit', snap.budgetLimit.toFixed(2)].map(csvEscape).join(','));
    lines.push(['Total Monthly Expenses', snap.monthlyExpenses.toFixed(2)].map(csvEscape).join(','));
    lines.push(['Monthly Subscription Cost', snap.monthlySubscriptionCost.toFixed(2)].map(csvEscape).join(','));
    lines.push(['Total Monthly Spending', snap.totalMonthlySpending.toFixed(2)].map(csvEscape).join(','));
    lines.push(['Remaining Budget', snap.remainingBudget.toFixed(2)].map(csvEscape).join(','));
    lines.push(['Budget Usage (%)', `${snap.usagePercent.toFixed(1)}%`].map(csvEscape).join(','));
    lines.push('');
    lines.push(['Category', 'Monthly Total (INR)'].map(csvEscape).join(','));
    for (const c of snap.categoryBreakdown) {
      lines.push([c.category, c.total.toFixed(2)].map(csvEscape).join(','));
    }
  } else {
    lines.push(['Date', 'Title', 'Category', 'Amount (INR)', 'Payment Method', 'Description'].map(csvEscape).join(','));
    const rows = db
      .prepare(
        `SELECT date, title, category, amount, payment_method, description
         FROM expenses
         WHERE strftime('%Y-%m', date) = ?
         ORDER BY date DESC, id DESC`
      )
      .all(ymPrefix) as {
      date: string;
      title: string;
      category: string;
      amount: number;
      payment_method: string;
      description: string;
    }[];
    for (const r of rows) {
      lines.push(
        [r.date, r.title, r.category, r.amount.toFixed(2), r.payment_method, r.description]
          .map(csvEscape)
          .join(',')
      );
    }
  }

  const csvBody = '\ufeff' + lines.join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvBody);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`ExpenseTrack server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
