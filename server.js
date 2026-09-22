const express = require('express');
const path = require('node:path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getGoalWithTotal(id) {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  if (!goal) return null;
  const { total } = db
    .prepare('SELECT COALESCE(SUM(amount_cents), 0) AS total FROM transactions WHERE goal_id = ?')
    .get(id);
  return { ...goal, saved_cents: total };
}

app.get('/api/goals', (req, res) => {
  const goals = db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all();
  const withTotals = goals.map((g) => getGoalWithTotal(g.id));
  res.json(withTotals);
});

app.post('/api/goals', (req, res) => {
  const { name, target_cents } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!Number.isInteger(target_cents) || target_cents <= 0) {
    return res.status(400).json({ error: 'target_cents must be a positive integer' });
  }
  const result = db
    .prepare('INSERT INTO goals (name, target_cents) VALUES (?, ?)')
    .run(name.trim(), target_cents);
  res.status(201).json(getGoalWithTotal(Number(result.lastInsertRowid)));
});

app.delete('/api/goals/:id', (req, res) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
  if (!goal) return res.status(404).json({ error: 'goal not found' });
  db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

app.get('/api/goals/:id/transactions', (req, res) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
  if (!goal) return res.status(404).json({ error: 'goal not found' });
  const txns = db
    .prepare('SELECT * FROM transactions WHERE goal_id = ? ORDER BY created_at DESC')
    .all(req.params.id);
  res.json(txns);
});

app.post('/api/goals/:id/transactions', (req, res) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
  if (!goal) return res.status(404).json({ error: 'goal not found' });

  const { amount_cents, note } = req.body;
  if (!Number.isInteger(amount_cents) || amount_cents === 0) {
    return res.status(400).json({ error: 'amount_cents must be a non-zero integer (negative for withdrawals)' });
  }
  db.prepare('INSERT INTO transactions (goal_id, amount_cents, note) VALUES (?, ?, ?)').run(
    req.params.id,
    amount_cents,
    note || null
  );
  res.status(201).json(getGoalWithTotal(req.params.id));
});

app.listen(PORT, () => {
  console.log(`Savings app running at http://localhost:${PORT}`);
});
