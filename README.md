# ArrowMaze

A lightweight React puzzle game (SVG-based) — ready to run and publish to GitHub.

## Quick start

1. Install dependencies:
   ```
   npm install
   ```
2. Start dev server:
   ```
   npm run dev
   ```
3. Build for production:
   ```
   npm run build
   ```

## Project notes

- App.jsx contains a simple puzzle engine: levels are arrays of segments with direction.
- Add more levels by editing `LEVELS` in `App.jsx`.
- To publish: push files to GitHub and host `dist/` (Parcel build) on GitHub Pages.
