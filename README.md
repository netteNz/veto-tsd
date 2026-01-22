# TSD Veto Tool (Frontend)

---

## Description

TSD Veto Tool streamlines the process of setting up competitive Halo Infinite matches by providing an interactive veto system. Teams can pick and ban map-mode combinations, lock in Slayer selections, and track the final series layout in real time. The tool ensures transparency, consistency, and speed for both tournament organizers and players.


---

## 📝 Current Status

**Frontend-Only Demo (Refactoring in Progress)**

This project is currently being refactored to run as a **frontend-only application** for demonstration purposes. The Django REST backend has been decoupled, and the tool now operates independently using client-side state management. This allows for rapid prototyping and easier deployment while we prepare the full-stack integration for production.

---

## Features

- Set up best-of series formats (Bo3 / Bo5 / Bo7)

- Pick / Ban map-mode combinations

- Slayer mode map selection

- Live series view to track picks, bans, and outcomes

---

## Tech Stack

- React

- Vite

- Tailwind CSS

---

Setup & Usage

```bash
# Install dependencies
npm install

# Run in development mode (localhost:5173)
npm run dev

# Create production build
npm run build

# Preview production build
npm run preview
```

---

## TODO

[ ] Export veto layout (image/PDF for sharing)

[ ] Improve mobile UX (responsive veto board)

[ ] UI/UX polish for series setup

---

## Project Info

Repository: github.com/netteNz/veto-tsd

Live demo: GitHub Pages deployment
