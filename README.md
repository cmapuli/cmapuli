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

## Deploying to Render

This app needs a Node.js runtime (it has a server and a SQLite file), so it can't be hosted on GitHub Pages, which only serves static files. `render.yaml` in this repo configures it as a [Render](https://render.com) Blueprint.

1. Sign in to Render and go to **New > Blueprint**.
2. Connect the `cmapuli/cmapuli` repository and select the `main` branch.
3. Render reads `render.yaml` automatically and provisions a free web service (`simple-savings-app`) with `npm install` as the build command and `npm start` as the start command.
4. Deploy. Render assigns a public URL (e.g. `https://simple-savings-app.onrender.com`).

**Caveat:** Render's free plan uses an ephemeral filesystem, so the `savings.db` SQLite file is wiped on every redeploy or restart. Fine for demos; for real persistence, add a paid [Render Disk](https://render.com/docs/disks) mounted at the project root, or swap in a managed database.

## Android app

The `android/` directory is a [Capacitor](https://capacitorjs.com/) wrapper that loads the live app (`https://cmapuli.onrender.com`, configured in `capacitor.config.json`) inside a native WebView — no offline bundling, so it always reflects the deployed site.

A debug APK is built automatically by [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) on every push to `main` that touches `android/`, `public/`, or `capacitor.config.json` (or manually via the "Run workflow" button on the Actions tab). Download it from the finished run's **Artifacts** section (`simple-savings-debug-apk`).

To build locally instead (requires the Android SDK):

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```

The unsigned debug APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.
