# 🌙 Luminary — Professional Photo Editor

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-rolldown-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
</p>

<p align="center">
  <a href="https://moon-knight-jet.vercel.app"><strong>Live Demo →</strong></a>
</p>

A full-stack, browser-based photo editor with desktop-class controls — powered by the HTML5 Canvas API. No plugins, no server-side rendering. Pure pixel manipulation on the client.

---

## ✨ Features

| Category | What you get |
|---|---|
| **Basic** | Exposure, Contrast, Highlights, Shadows, Whites, Blacks |
| **Color** | Temperature, Tint, Vibrance, Saturation |
| **Tone Curve** | Interactive Catmull-Rom spline editor |
| **HSL** | Per-channel control across 8 color ranges |
| **Effects** | Clarity, Dehaze, Vignette, Film Grain, Blur |
| **Presets** | Vivid, Film, Portrait, Monochrome |
| **History** | 50-step Undo / Redo (600ms debounce) |
| **Export** | Full-resolution PNG / JPEG via Web Worker |
| **Accounts** | JWT auth, saved edits, album management |

---

## 🛠 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, Framer Motion, OGL (WebGL)
- **Backend:** Express 4, Prisma ORM, bcryptjs, JWT
- **Database:** PostgreSQL (Neon serverless)
- **Deploy:** Vercel (frontend) · Railway / Render (backend)

---

## 🚀 Quick Start

**Frontend**
```bash
git clone https://github.com/pankaj-cod/Moon_Knight-.git
cd Moon_Knight-/moonlight
npm install
echo "VITE_APP_API_URL=http://localhost:5001/api" > .env
npm run dev
# → http://localhost:5173
```

**Backend**
```bash
cd moon_backend
npm install
# Fill in .env (see below)
npx prisma migrate dev --name init
npm run dev
# → http://localhost:5001/api
```

---

## 🔑 Environment Variables

**`moonlight/.env`**
```
VITE_APP_API_URL=http://localhost:5001/api
```

**`moon_backend/.env`**
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your-secret
PORT=5001
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## 🏗 Architecture

- **Dual-canvas:** preview canvas (max 1200px) for smooth real-time edits + hidden full-res canvas for lossless exports.
- **Non-destructive:** every frame starts from the original pixel data.
- **Web Worker export:** full-resolution processing runs off the main thread.
- **Separable box blur:** O(n·2r) — ~5.5× faster than a naive kernel.

---

## 📦 Deploy

| Target | Steps |
|---|---|
| **Vercel** | Set root dir → `moonlight`, add `VITE_APP_API_URL`, deploy |
| **Railway** | `nixpacks.toml` handles install → prisma generate → migrate → start |
| **Render** | Root → `moonlight/moon_backend`, build: `npm ci && npx prisma generate && npx prisma migrate deploy`, start: `node server.js` |

---

<p align="center">Made with 🌙 for photography enthusiasts</p>
