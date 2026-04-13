# ✦ Luminary — AI-Powered Photo Editor

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-rolldown-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Groq%20LLM-F55036?style=flat-square" />
</p>

<p align="center">
  <a href="https://moon-knight-jet.vercel.app"><strong>Live Demo →</strong></a>
</p>

**Edit photos by describing what you want.** Luminary is an AI-first photo editor — type _"make it cinematic"_ or _"warm film look with grain"_ and watch it happen. Full manual controls are there too, but you'll rarely need them.

---

## ✨ Core Features

### 🤖 AI Editing (Star Feature)
- **Natural language commands** — type what you want, AI translates it to precise adjustments
- **15 style presets** understood by AI: cinematic, moody, film, noir, golden hour, vintage, dramatic, dreamy, vivid, airy, faded, soft, warm, cool, and more
- **Iterative commands** — say _"reduce it a bit"_ or _"make it warmer"_ and AI adjusts relative to current state
- **AI History Panel** — live timeline of every AI command with applied parameters
- **Suggestion chips** — click to instantly apply a style
- **Non-destructive** — AI never touches pixels directly, only generates parameter diffs

### 🎨 Manual Controls
| Category | Controls |
|---|---|
| **Light** | Exposure, Contrast, Highlights, Shadows, Whites, Blacks |
| **Color** | Temperature, Tint, Vibrance, Saturation |
| **Tone Curve** | Interactive Catmull-Rom spline editor |
| **HSL** | Per-channel control across 8 color ranges |
| **Effects** | Clarity, Dehaze, Vignette, Film Grain, Blur |
| **Presets** | Vivid, Film, Portrait, Monochrome |

### ⚡ Editing Engine
- **Dual-canvas architecture** — preview canvas (max 1200px) + hidden full-res canvas for lossless exports
- **Non-destructive pipeline** — every frame starts from original pixel data
- **Web Worker export** — full-resolution processing off the main thread
- **50-step Undo / Redo** with 600ms debounce
- **SmartSliders** — flash violet when AI changes a parameter
- **Live RGB histogram**

### 👤 User Accounts & Albums
- JWT authentication (7-day expiry)
- Save edits with metadata, paginated listing, search & sort
- Album management (create, rename, delete, assign photos)

---

## 🏗 Architecture

```
User types: "make it cinematic with warm tones"
        │
        ▼
  AICommandBar.jsx  →  POST /api/ai-edit  →  Groq LLM (llama-3.3-70b)
        │                                        │
        │                                   Prompt engineering
        │                                   + JSON validation
        │                                   + range clamping
        │                                        │
        ▼                                        ▼
  mergeAIEdit()  ←  { contrast: 35, temperature: 25, vignette: 30 }
        │
        ▼
  setAdjustments()  →  useHistory (undo stack)  →  useCanvasEditor (RAF render)
        │
        ▼
  Canvas pixel pipeline (10 stages, non-destructive)
```

### 3-Panel Editor Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Toolbar  [Back] [Undo/Redo] [Before] [Histogram] [Controls]   │
├─────────────────────────────────────────────────────────────────┤
│  AI Command Bar  [✦ Describe your edit...]  [Chips]  [Apply]   │
├──────────┬───────────────────────────────────┬──────────────────┤
│ AI Panel │                                   │  Manual Controls │
│          │                                   │                  │
│ History  │          Image Canvas             │  Light / Color   │
│ ──────── │           (dominant)              │  Curve / HSL     │
│ AI Styles│                                   │  FX / Blur       │
│          │                                   │                  │
│  224px   │           flex-1                  │  272px           │
└──────────┴───────────────────────────────────┴──────────────────┘
```

---

## 🛠 Tech Stack

**Frontend:** React 19 · Vite (rolldown) · Tailwind CSS 4 · Framer Motion · GSAP · OGL (WebGL starfield) · Canvas API

**Backend:** Express 4 · Prisma ORM · bcryptjs · JWT · Groq API (llama-3.3-70b-versatile)

**Database:** PostgreSQL (Neon serverless)

**Deploy:** Vercel (frontend) · Railway / Render (backend)

---

## 🚀 Quick Start

### Frontend
```bash
git clone https://github.com/pankaj-cod/Moon_Knight-.git
cd Moon_Knight-/moonlight
npm install
echo "VITE_APP_API_URL=http://localhost:5001/api" > .env
npm run dev
# → http://localhost:5173
```

### Backend
```bash
cd moon_backend
npm install
npx prisma migrate dev --name init
node server.js
# → http://localhost:5001/api
```

---

## 🔑 Environment Variables

### `moonlight/.env`
```
VITE_APP_API_URL=http://localhost:5001/api
```

### `moon_backend/.env`
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your-secret
PORT=5001
GROQ_API_KEY=gsk_your_groq_api_key_here
FRONTEND_URL=http://localhost:5173
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

> ⚠️ Never commit `.env` files. Both are in `.gitignore`.

---

## 📂 Project Structure

```
moonlight/
├── public/                     # Stock moon photos (6 PNGs)
├── src/
│   ├── main.jsx                # React entry
│   ├── App.jsx                 # Root state, routing, auth
│   ├── index.css               # Global styles, slider theme, scrollbar
│   │
│   ├── components/
│   │   ├── AICommandBar.jsx    # Hero AI input bar with suggestion chips
│   │   ├── AIHistoryPanel.jsx  # Left panel: edit history + style grid
│   │   ├── Header.jsx          # Nav bar with AI badge
│   │   ├── Slider.jsx          # Reusable range input
│   │   ├── Histogram.jsx       # RGB histogram chart
│   │   ├── ToneCurveEditor.jsx # Interactive spline canvas
│   │   ├── HSLPanel.jsx        # Per-channel HSL sliders
│   │   ├── Galaxy.jsx          # WebGL animated starfield
│   │   ├── AuthModal.jsx       # Login / signup modal
│   │   └── StockPhotosModal.jsx # Sample photo picker
│   │
│   ├── pages/
│   │   ├── Home.jsx            # AI-first landing page
│   │   ├── Editor.jsx          # 3-panel editing workspace
│   │   ├── Dashboard.jsx       # Saved edits grid
│   │   └── Albums.jsx          # Album management
│   │
│   ├── hooks/
│   │   ├── useCanvasEditor.js  # Dual-canvas editing + export
│   │   └── useHistory.js       # Debounced undo/redo (50 steps)
│   │
│   ├── utils/
│   │   ├── imageProcessing.js  # 10-stage pixel pipeline
│   │   ├── mergeAIEdit.js      # Maps flat AI diff → nested adjustments
│   │   └── ToneCurve.js        # Catmull-Rom spline + LUT generator
│   │
│   └── workers/
│       └── imageProcessingWorker.js  # Web Worker for full-res export
│
├── moon_backend/
│   ├── server.js               # Express API + AI endpoint + auth + CRUD
│   ├── prisma/schema.prisma    # User, Edit, Album models
│   └── package.json
│
├── vite.config.js
├── package.json
└── index.html
```

---

## 🤖 AI Endpoint

### `POST /api/ai-edit`

Converts natural language to structured adjustment JSON via Groq LLM.

**Request:**
```json
{
  "prompt": "make it warmer and cinematic",
  "currentAdjustments": { "basic": { "exposure": 0, ... }, "color": { ... }, "effects": { ... } }
}
```

**Response:**
```json
{
  "adjustments": {
    "temperature": 25,
    "contrast": 40,
    "shadows": 15,
    "highlights": -25,
    "vignette": 30,
    "clarity": 15
  },
  "prompt": "make it warmer and cinematic"
}
```

**How it works:**
1. Sends the user prompt + current state to Groq (llama-3.3-70b-versatile)
2. LLM returns JSON with only the keys that need to change
3. Server-side validation strips unknown keys and clamps all values to valid ranges
4. Frontend merges the diff into the nested adjustments structure via `mergeAIEdit()`
5. `setAdjustments()` pushes to the undo stack — Ctrl+Z works automatically

---

## 📦 Deploy

| Target | Steps |
|---|---|
| **Vercel** | Root dir → `moonlight`, add `VITE_APP_API_URL`, deploy |
| **Railway** | `nixpacks.toml` handles install → prisma generate → migrate → start |
| **Render** | Root → `moonlight/moon_backend`, build: `npm ci && npx prisma generate && npx prisma migrate deploy`, start: `node server.js` |

Add `GROQ_API_KEY` to your deployment environment variables for AI editing to work.

---

<p align="center">Built with ✦ AI at its core</p>
