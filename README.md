# Escape Puzzle — 500 Levels

A small, deployable puzzle game built with Vite + React + Tailwind. 500 procedurally-generated levels with progress saving, hints, and level map.

## Quick start

1. Clone this repo

```bash
git clone https://github.com/<your-username>/escape-puzzle-500.git
cd escape-puzzle-500
```

2. Install

```bash
npm ci
```

3. Dev

```bash
npm run dev
```

4. Build

```bash
npm run build
```

5. Deploy

Push to `main` — GitHub Actions will build & deploy to Pages automatically. Alternatively, run `npm run deploy` (gh-pages) locally.

## Create GitHub repo & push (commands)

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit — Escape Puzzle 500 levels"
# create repo on GitHub and replace URL below
git remote add origin https://github.com/<your-username>/escape-puzzle-500.git
git push -u origin main
```

## Android (Capacitor) quick steps

This repo includes a script `build_apk.sh` which offers guidance to build a WebView-based APK using Capacitor. You must run these steps locally (Android SDK + Node + npm + Java installed).

See `build_apk.sh` for exact commands.
