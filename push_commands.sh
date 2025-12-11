#!/bin/bash
# Replace <your-username> and repo name before running
git init
git branch -M main
git add .
git commit -m "Initial commit — Escape Puzzle 500 levels"
git remote add origin https://github.com/<your-username>/escape-puzzle-500.git
git push -u origin main
