# CamperPlan Dev Startup (Beginner Guide)

This is the only guide you need to reliably run the app.

## 0) First-time setup (one-time only)

1. Install Node Version Manager (NVM) if needed.
2. In Terminal, run:

```bash
source ~/.nvm/nvm.sh
nvm install 20
nvm use 20
```

3. Confirm:

```bash
node -v
```

You should see `v20.x.x`.

---

## 1) Start the app (normal day-to-day)

Open **one terminal tab only** and run:

```bash
cd ~/Documents/CamperCalc
npm run start
```

What this does:
- runs preflight checks (Node + Watchman + busy ports)
- starts Expo in tunnel mode on port `8083`

When it is healthy, you will see:
- `Tunnel connected. Tunnel ready.`
- `Metro waiting on exp://...exp.direct`

---

## 2) If the terminal looks stuck

Most of the time it is not stuck; it is compiling.

If you need to stop what is running in that terminal:
- Press `Ctrl + C`
- Wait for prompt (`%`) to come back

If prompt does not come back:
- Press `Ctrl + C` again
- If still frozen, close that terminal tab and open a new one

---

## 3) "How do I kill a terminal process before opening another?"

You have two safe options:

### Option A (best)
- In the same terminal, press `Ctrl + C`

### Option B (if truly hung)
Open a new terminal and run:

```bash
killall node
```

This kills Expo/Metro processes.

---

## 4) Common mistakes to avoid

- Do not run `npx expo start` directly (it may default to localhost mode)
- Do not run multiple Expo terminals at once
- Do not spam restart commands while bundle is compiling
- Avoid `-c` unless needed (clean cache is slower)

---

## 5) If you need a full reset

```bash
killall node
cd ~/Documents/CamperCalc
npm run start:clean
```

---

## 6) Phone connection checklist (Expo Go)

1. Keep the terminal open.
2. Use the QR from the current terminal only.
3. In Expo Go, remove old cached sessions if needed.
4. If red screen appears immediately, tap **Reload JS** once after bundle completes.

