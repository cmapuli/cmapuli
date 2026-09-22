# Simple Savings

A small savings tracker: create goals, log deposits and withdrawals, and watch your progress bar fill up.

## Stack

- **Backend:** Node.js + [Express](https://expressjs.com/), using Node's built-in `node:sqlite` module for storage (no native dependencies to compile).
- **Frontend:** Plain HTML/CSS/JavaScript, no build step.

## Requirements

- Node.js 22.5+ (for built-in `node:sqlite`)

## Running locally

```bash
npm install
npm start
```

Then open http://localhost:3000.

A `savings.db` SQLite file is created automatically in the project root on first run (git-ignored).

## API

| Method | Path                          | Description                                  |
|--------|-------------------------------|-----------------------------------------------|
| GET    | `/api/goals`                  | List all goals with their current saved total |
| POST   | `/api/goals`                  | Create a goal `{ name, target_cents }`        |
| DELETE | `/api/goals/:id`              | Delete a goal and its transactions            |
| GET    | `/api/goals/:id/transactions` | List a goal's transactions                    |
| POST   | `/api/goals/:id/transactions` | Add a transaction `{ amount_cents, note? }` (negative `amount_cents` = withdrawal) |

All amounts are stored in cents as integers to avoid floating-point rounding issues.
