# Luminary — AI-Powered Photo Editor

> Edit photos by describing what you want. Type *"make it cinematic with warm tones"* and watch it happen.

[Live Demo →](https://moon-knight-jet.vercel.app)

---

## What This Is

A production-grade, full-stack web photo editor where **AI is the primary interaction model**. Users type natural language commands instead of dragging sliders — the AI translates intent into precise image adjustments in real time. Full manual controls are available as a secondary workflow.

---

## What I Built

### 🤖 AI Editing Engine
- Integrated **Groq LLM (Llama 3.3 70B)** with custom prompt engineering to convert natural language into structured JSON edit parameters
- Server-side **validation and sanitization layer** — strips unknown keys, clamps values to defined ranges, enforces type safety
- **15+ style-aware keyword mappings** (cinematic, moody, film, noir, golden hour, vintage, etc.) baked into the system prompt
- **Context-aware iterative editing** — sends current adjustment state with each request so relative commands like *"reduce it a bit"* work correctly

### 🎨 Non-Destructive Image Pipeline
- **10-stage pixel processing chain**: exposure → contrast → highlights/shadows → whites/blacks → temperature/tint → vibrance/saturation → tone curve (Catmull-Rom spline + 256-entry LUT) → HSL per-channel → clarity/dehaze → vignette/grain/blur
- **Dual-canvas architecture**: downscaled preview canvas (max 1200px) for real-time editing + hidden full-resolution canvas for lossless exports
- **Web Worker export** — full-res processing runs off the main thread to prevent UI freezing
- **Separable box blur** (O(n·2r)) — 5.5× faster than naive kernel convolution

### 🖥 3-Panel Editor UI
- **AI Command Bar** (hero) — always-visible input with rotating placeholder text, suggestion chips, inline status feedback, and loading animations
- **AI History Panel** (left) — live timeline of every AI command with adjustment pills + one-click style grid
- **Manual Controls** (right, collapsible) — Light, Color, Tone Curve, HSL, and FX tabs with SmartSliders that auto-highlight when AI modifies their values
- **Framer Motion** panel animations, **GSAP** entrance sequences, **WebGL starfield** (OGL) on the landing page

### ⚡ Performance Engineering
- `requestAnimationFrame` coalescing prevents redundant canvas renders during rapid slider drags
- **50-step undo/redo** with 600ms debounce — collapses continuous drag sequences into single history entries
- AI calls are non-blocking with loading states — UI stays responsive during LLM inference

### 🔐 Full-Stack Auth & Data
- **JWT authentication** with bcrypt password hashing (7-day token expiry)
- **PostgreSQL** (Neon serverless) via **Prisma ORM**
- Paginated CRUD for saved edits, search & sort, album management (create, rename, delete, assign)

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite (rolldown), Tailwind CSS 4, Framer Motion, GSAP, OGL (WebGL), Canvas API |
| **Backend** | Node.js, Express 4, Prisma ORM, bcryptjs, JSON Web Tokens |
| **AI** | Groq API, Llama 3.3 70B Versatile, custom prompt engineering |
| **Database** | PostgreSQL (Neon serverless) |
| **Deploy** | Vercel (frontend), Railway / Render (backend) |

---

## Key Engineering Decisions

| Decision | Rationale |
|---|---|
| AI generates parameter diffs, not pixels | Clean separation between AI layer and rendering — AI output is validated, clamped, and merged via `mergeAIEdit()` before reaching the canvas |
| Dual-canvas (preview + full-res) | 12MP+ images render smoothly at 60fps during editing; full resolution is only processed at export time |
| Debounced undo history | Without debounce, dragging a slider from 0→50 would create 50 undo entries; with 600ms debounce, it collapses to 1 |
| `forwardRef` + `useImperativeHandle` on AICommandBar | Allows the left sidebar to trigger `runPrompt()` directly without lifting fetch logic to a parent component |
| Separable blur kernel | Two 1D passes instead of one 2D pass — reduces blur complexity from O(n·r²) to O(n·2r) |

---

## Project Scale

- **10 React components**, 4 pages, 3 utility modules, 2 custom hooks
- **~2,500 lines** of frontend code, **~720 lines** of backend code
- **14 adjustable parameters** controllable via AI or manual sliders
- **15+ AI style presets** with multi-parameter mappings
- **50-step undo/redo** history with full AI integration

---

*Built by [Pankaj](https://github.com/pankaj-cod)*
