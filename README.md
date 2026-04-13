# 🌙 Moonlight — Professional Night Photo Editor

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-rolldown-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

> **Live Demo** → [https://moon-knight-jet.vercel.app](https://moon-knight-jet.vercel.app)  
> **API Base URL** → [https://moon-knight.onrender.com/api](https://moon-knight.onrender.com/api)

---

## Table of Contents

- [Overview](#overview)
- [Feature Highlights](#feature-highlights)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
  - [Image Processing Pipeline](#image-processing-pipeline)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Auth Routes](#auth-routes)
  - [Edits Routes](#edits-routes)
  - [Albums Routes](#albums-routes)
- [Database Schema](#database-schema)
- [Core Modules Deep Dive](#core-modules-deep-dive)
  - [useCanvasEditor Hook](#usecanvaseditor-hook)
  - [useHistory Hook](#usehistory-hook)
  - [Image Processing Utils](#image-processing-utils)
  - [ToneCurve Utility](#tonecurve-utility)
- [Presets](#presets)
- [Deployment](#deployment)
  - [Frontend (Vercel)](#frontend-vercel)
  - [Backend (Railway / Render)](#backend-railway--render)
- [Contributing](#contributing)

---

## Overview

**Moonlight** is a full-stack, professional-grade photo editing web application tailored for moon and night photography. It brings desktop-class image controls to the browser using the **HTML5 Canvas API** — no server-side processing, no plugins, just raw pixel manipulation on the client.

Key differentiators:
- **Non-destructive editing** — all adjustments are applied from the original pixel data on every frame.
- **Dual-canvas architecture** — a downscaled preview canvas (max 1200px) delivers smooth real-time feedback while a hidden full-resolution canvas is used exclusively for lossless exports.
- **Web Worker export** — high-resolution image processing during download runs off the main thread so the UI stays completely responsive.
- **50-step undo/redo** with 600ms debounce, collapsing rapid slider drags into a single history entry.
- **Interactive tone curve editor** rendered on a `<canvas>` with draggable Catmull-Rom spline control points.

---

## Feature Highlights

### 🎨 Editor

| Category | Controls |
|---|---|
| **Basic** | Exposure, Contrast, Highlights, Shadows, Whites, Blacks |
| **Color** | Temperature, Tint, Vibrance, Saturation |
| **Tone Curve** | Interactive spline editor (add / drag / remove control points) |
| **HSL** | Per-color Hue, Saturation, Luminance for 8 color ranges (Red, Orange, Yellow, Green, Aqua, Blue, Purple, Magenta) |
| **Effects** | Clarity (mid-tone contrast), Dehaze, Vignette, Film Grain, Blur |
| **Presets** | Vivid, Film, Portrait, Monochrome — one-click starting points |
| **History** | 50-step Undo / Redo with debounced captures |
| **Before/After** | Toggle to compare edited vs. original |
| **Histogram** | Live RGB channel histogram overlay |
| **Export** | Full-resolution PNG / JPEG download via Web Worker |

### 👤 User Accounts
- Sign up / Log in with JWT authentication (7-day expiry)
- Persistent sessions via `localStorage`
- Saved edits with metadata, paginated listing, search and sort

### 📁 Album Management
- Create, rename, and delete albums
- Assign saved edits to albums
- Paginated album view with photo count

### 🌌 Stock Photos
- 6 curated moon photograph presets served from the public folder (Full Moon, Crescent, Lunar Surface, Blood Moon, Half Moon, Gibbous Moon)

### ✨ Galaxy Background
- Animated starfield canvas background (`Galaxy.jsx`) using WebGL via the [OGL](https://github.com/oframe/ogl) library

---

## Tech Stack

### Frontend
| Package | Purpose |
|---|---|
| `react@19` | UI framework |
| `vite` (rolldown-vite) | Build tool & dev server |
| `tailwindcss@4` | Utility-first CSS |
| `framer-motion` | Animations |
| `gsap` + `@gsap/react` | Advanced timeline animations (Galaxy background) |
| `ogl` | Lightweight WebGL library for the starfield |
| Canvas API (native) | All image processing |

### Backend
| Package | Purpose |
|---|---|
| `express@4` | HTTP server |
| `@prisma/client` | Type-safe database ORM |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT authentication |
| `cors` | Cross-origin resource sharing |
| `dotenv` | Environment variable management |

### Database & Deployment
| Service | Role |
|---|---|
| **Neon** (PostgreSQL) | Serverless Postgres database |
| **Vercel** | Frontend deployment (zero-config) |
| **Render / Railway** | Backend deployment |

---

## Architecture

### Frontend Architecture

The app uses a **single-page, view-based routing** pattern managed through React state (`currentView`). There is no client-side router — views are toggled conditionally in `App.jsx`.

```
App.jsx (root state & logic)
├── Galaxy          — WebGL starfield background
├── Header          — Nav, auth buttons, current user
├── AuthModal       — Login / Signup modal
├── StockPhotosModal — Sample moon photo picker
│
└── Views (conditional render)
    ├── Home        — Landing page & upload CTA
    ├── Dashboard   — Grid of saved edits
    ├── Albums      — Album management page
    └── Editor      — Full-screen editing workspace
        ├── useCanvasEditor  (preview + export canvases)
        ├── useHistory       (undo/redo stack)
        ├── ToneCurveEditor  (interactive spline canvas)
        ├── HSLPanel         (per-channel HSL controls)
        ├── Histogram        (RGB histogram overlay)
        └── Slider           (reusable range input)
```

**State flow:**

```
App.jsx (adjustments + history)
       │
       ▼  adjustments prop
    Editor.jsx
       │
       ▼  setAdjustments callback
  useHistory.js  ──────────────────►  undo / redo stack (max 50)
       │
       ▼  adjustments
  useCanvasEditor.js
       │
       ├── requestAnimationFrame ──►  preview canvas (max 1200px)
       └── Web Worker            ──►  full-res canvas (export only)
```

### Backend Architecture

The backend is a lightweight **Express REST API** with three route groups. All modifying routes are protected by a JWT middleware (`authenticateToken`).

```
server.js
├── POST  /api/auth/signup
├── POST  /api/auth/login
├── GET   /api/auth/me          [protected]
│
├── POST  /api/edits/save       [protected]
├── GET   /api/edits            [protected]  — paginated, searchable, sortable
├── PUT   /api/edits/:id        [protected]
├── DELETE /api/edits/:id       [protected]
│
├── POST  /api/albums           [protected]
├── GET   /api/albums           [protected]  — paginated, searchable
├── PUT   /api/albums/:id       [protected]
├── DELETE /api/albums/:id      [protected]
│
└── GET   /api/health           — health-check (DB ping)
```

All routes accept and return **JSON**. The `express.json()` body parser is configured with a **50 MB limit** to allow Base64-encoded image data to be stored directly in the database.

### Image Processing Pipeline

Every time adjustments change, `useCanvasEditor` schedules a render via `requestAnimationFrame`. The pipeline always starts from a **fresh copy** of the original pixel data (non-destructive):

```
Original ImageData (previewOriginalRef)
       │  (cloned every frame)
       ▼
1. applyBasicAdjustments   — exposure, contrast, highlights, shadows, whites, blacks
2. applyTemperatureAndTint — warm/cool color cast
3. applyVibrance           — vibrance + saturation
4. applyToneCurve          — lookup-table-based curve mapping
5. applyHSLAdjustments     — per–color-range HSL shifts (8 ranges)
6. applyClarity            — separable box-blur unsharp mask (midtones only)
7. applyDehaze             — dark channel prior atmospheric correction
8. applyVignette           — radial light falloff
9. applyGrain              — additive random noise
10. applyBlur              — O(n·2r) separable box blur
       │
       ▼
ctx.putImageData → preview canvas
```

For **export**, the same pipeline runs inside a `Worker` against the **full-resolution** original, leaving the UI completely unblocked.

---

## Project Structure

```
Moon_light/
└── moonlight/                  ← repository root
    ├── public/                 ← static assets (stock moon PNGs)
    │   ├── moon_full.png
    │   ├── moon_crescent.png
    │   ├── moon_surface.png
    │   ├── moon_blood.png
    │   ├── moon_half.png
    │   └── moon_gibbous.png
    │
    ├── src/
    │   ├── main.jsx            ← React entry point
    │   ├── App.jsx             ← Root component, global state, routing
    │   ├── App.css
    │   ├── index.css
    │   │
    │   ├── components/
    │   │   ├── AuthModal.jsx       — Login / signup form modal
    │   │   ├── Galaxy.jsx          — WebGL animated starfield
    │   │   ├── Header.jsx          — Top navigation bar
    │   │   ├── Histogram.jsx       — RGB histogram chart
    │   │   ├── HSLPanel.jsx        — Per-channel HSL sliders
    │   │   ├── Slider.jsx          — Reusable labeled range input
    │   │   ├── StockPhotosModal.jsx — Stock photo picker
    │   │   └── ToneCurveEditor.jsx — Interactive tone curve canvas
    │   │
    │   ├── pages/
    │   │   ├── Home.jsx            — Landing page
    │   │   ├── Editor.jsx          — Full editing workspace
    │   │   ├── Dashboard.jsx       — Saved edits grid
    │   │   └── Albums.jsx          — Album management
    │   │
    │   ├── hooks/
    │   │   ├── useCanvasEditor.js  — Dual-canvas editing + export hook
    │   │   └── useHistory.js       — Debounced undo/redo state
    │   │
    │   ├── utils/
    │   │   ├── imageProcessing.js  — All pixel-level processing functions
    │   │   └── ToneCurve.js        — Catmull-Rom spline + LUT generator
    │   │
    │   └── workers/
    │       └── imageProcessingWorker.js — Web Worker for full-res export
    │
    ├── moon_backend/           ← Node.js / Express backend
    │   ├── server.js           — All routes + middleware
    │   ├── index.js            — Entry point (requires server.js)
    │   ├── prisma/
    │   │   └── schema.prisma   — Database schema (User, Edit, Album)
    │   ├── package.json
    │   └── .env                — Backend environment variables
    │
    ├── index.html              ← HTML shell
    ├── vite.config.js
    ├── eslint.config.js
    ├── nixpacks.toml           ← Railway deployment config
    ├── railway.json
    └── package.json            ← Frontend dependencies
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **PostgreSQL** database (local or hosted — [Neon](https://neon.tech) free tier works great)

### Frontend Setup

```bash
# 1. Clone the repository
git clone https://github.com/pankaj-cod/Moon_Knight-.git
cd Moon_Knight-/moonlight

# 2. Install dependencies
npm install

# 3. Create the frontend environment file
echo "VITE_APP_API_URL=http://localhost:5001/api" > .env

# 4. Start the dev server
npm run dev
```

The app will be available at **http://localhost:5173**.

### Backend Setup

```bash
# 1. Navigate to the backend folder
cd moon_backend

# 2. Install dependencies
npm install

# 3. Create the backend environment file
cp .env.example .env   # then edit .env with your values

# 4. Run Prisma migrations to create tables
npx prisma migrate dev --name init

# 5. (Optional) Open Prisma Studio to inspect the database
npx prisma studio

# 6. Start the backend server
npm run dev
```

The API will be running at **http://localhost:5001/api**.

---

## Environment Variables

### Frontend — `moonlight/.env`

| Variable | Description | Example |
|---|---|---|
| `VITE_APP_API_URL` | Base URL of the backend API | `http://localhost:5001/api` |

### Backend — `moonlight/moon_backend/.env`

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Secret key for signing JWTs | `a-long-random-secret-string` |
| `PORT` | Port for the Express server | `5001` |
| `FRONTEND_URL` | Allowed CORS origin | `https://moon-knight-jet.vercel.app` |

> ⚠️ **Never commit `.env` files.** Both are already listed in their respective `.gitignore` files.

---

## API Reference

All protected routes require an `Authorization: Bearer <token>` header.

### Auth Routes

#### `POST /api/auth/signup`
Create a new user account.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Pankaj"
}
```

**Response `201`:**
```json
{
  "message": "User created successfully",
  "token": "<jwt>",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

---

#### `POST /api/auth/login`
Authenticate an existing user.

**Request body:**
```json
{ "email": "user@example.com", "password": "password123" }
```

**Response `200`:**
```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

---

#### `GET /api/auth/me` 🔒
Fetch the profile of the currently authenticated user.

**Response `200`:**
```json
{ "id": "...", "email": "...", "name": "...", "createdAt": "..." }
```

---

### Edits Routes

#### `POST /api/edits/save` 🔒
Save an edited image with its adjustment metadata.

**Request body:**
```json
{
  "imageData": "data:image/jpeg;base64,...",
  "settings": { "brightness": 100, "contrast": 100, ... },
  "presetName": "Custom Edit",
  "albumId": "optional-album-id"
}
```

---

#### `GET /api/edits` 🔒
Retrieve all saved edits for the authenticated user.

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page |
| `search` | string | — | Search preset name |
| `sortBy` | string | `createdAt` | Sort field |
| `order` | string | `desc` | `asc` or `desc` |
| `presetName` | string | — | Filter by exact preset name |
| `albumId` | string | — | Filter by album |

**Response `200`:**
```json
{
  "edits": [ { "id": "...", "imageData": "...", "presetName": "...", "settings": {}, "createdAt": "...", "albumId": null } ],
  "pagination": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

---

#### `PUT /api/edits/:id` 🔒
Update an existing edit's preset name, settings, or album assignment.

#### `DELETE /api/edits/:id` 🔒
Permanently delete an edit.

---

### Albums Routes

#### `POST /api/albums` 🔒
Create a new album.

**Request body:**
```json
{ "name": "Night Sky 2026", "description": "Optional description" }
```

---

#### `GET /api/albums` 🔒
List albums with pagination and search. Each album includes a `_count.edits` field showing how many edits belong to it.

| Param | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `limit` | `10` | Items per page |
| `search` | — | Search by name or description |
| `sortBy` | `createdAt` | Sort field |
| `order` | `desc` | Sort direction |

#### `PUT /api/albums/:id` 🔒
Rename or update description of an album.

#### `DELETE /api/albums/:id` 🔒
Delete an album (edits inside are unlinked, not deleted).

---

#### `GET /api/health`
Health check — pings the database and returns status.

```json
{
  "status": "Server is running!",
  "database": "Connected",
  "timestamp": "2026-04-13T04:00:00.000Z"
}
```

---

## Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String              // bcrypt hash
  createdAt DateTime @default(now())
  edits     Edit[]
  albums    Album[]
}

model Edit {
  id         String  @id @default(cuid())
  userId     String
  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  imageData  String              // Base64 data URL
  presetName String  @default("Custom")
  brightness Int     @default(100)
  contrast   Int     @default(100)
  saturate   Int     @default(100)
  blur       Int     @default(0)
  hue        Int     @default(0)
  temperature Int    @default(0)
  albumId    String?
  album      Album?  @relation(fields: [albumId], references: [id])
  createdAt  DateTime @default(now())
  @@index([userId])
  @@index([albumId])
}

model Album {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  edits       Edit[]
  @@index([userId])
}
```

---

## Core Modules Deep Dive

### `useCanvasEditor` Hook

**File:** `src/hooks/useCanvasEditor.js`

This hook powers the entire editing pipeline. It manages two canvases:

| Canvas | Size | Purpose |
|---|---|---|
| `canvasRef` (preview) | Max 1200px on longest side | Live editing — always visible |
| `fullCanvasRef` (full-res) | Original image dimensions | Export only — never mounted in DOM |

**Key methods:**

```js
const {
  canvasRef,          // attach to <canvas> in JSX
  applyAdjustments,  // schedules RAF render on preview canvas
  exportBlob,        // returns Promise<Blob> via Web Worker (full-res)
  exportImage,       // legacy: returns data URL from preview canvas
  renderOriginal,    // shows before state (cancels pending RAF)
  getHistogramData,  // reads preview canvas, returns { r, g, b, maxVal }
} = useCanvasEditor(originalImage);
```

**RAF coalescing:** rapid calls to `applyAdjustments` discard intermediate values — only the **latest** adjustment object is processed per animation frame.

---

### `useHistory` Hook

**File:** `src/hooks/useHistory.js`

```js
const { adjustments, setAdjustments, undo, redo, canUndo, canRedo, historyLength }
  = useHistory(initialAdjustments);
```

- Maintains `{ past[], present, future[] }` internally.
- `setAdjustments` updates `present` immediately (live preview) and debounces the push to `past` by **600ms** — slider drags become a single undo step.
- Stack capacity: **50 entries** (oldest are dropped).
- Calling `undo` or `redo` flushes any pending debounce timer first.

---

### Image Processing Utils

**File:** `src/utils/imageProcessing.js`

All functions accept and return an `ImageData` object. Every function is **pure** (does not mutate the input when used via `useCanvasEditor` — it receives a fresh clone each frame).

| Function | Algorithm |
|---|---|
| `applyBasicAdjustments` | Luminance-weighted per-pixel ops for exposure (pow-2), highlights/shadows (range-gated), whites/blacks, contrast |
| `applyTemperatureAndTint` | Red/blue channel shifts for warmth; red/green/blue shifts for tint |
| `applyVibrance` | Vibrance boosts under-saturated pixels more; saturation adjusts all equally |
| `applyToneCurve` | O(n) lookup table — one array dereference per channel per pixel |
| `applyHSLAdjustments` | RGB → HSL → adjust hue/sat/lum per color range → HSL → RGB with soft blend |
| `applyClarity` | Unsharp mask using separable box blur; weighted to midtones |
| `applyDehaze` | Dark channel prior to estimate atmospheric light; scene radiance recovery |
| `applyVignette` | Radial distance-based darkening with configurable midpoint |
| `applyGrain` | Additive uniform random noise |
| `applyBlur` | **Separable two-pass box blur** O(n·2r) — ~5.5× faster than naive O(n·r²) |

#### Separable Box Blur

Instead of a single O(r²) kernel per pixel, `separableBoxBlur` applies:
1. **Horizontal pass** — averages `2r+1` neighbors along x → intermediate buffer.
2. **Vertical pass** — averages `2r+1` neighbors along y → final result.

For radius=5 this is **22 operations/pixel** vs. the naive **121 ops/pixel**.

---

### ToneCurve Utility

**File:** `src/utils/ToneCurve.js`

```js
const curve = new ToneCurve();
curve.addPoint(128, 160);    // lift midtones
curve.updatePoint(1, 130, 165);
curve.removePoint(1);
const lut = curve.lookupTable;  // Uint8Array[256]
curve.toJSON();              // serialize for API save
ToneCurve.fromJSON(json);   // hydrate from saved data
```

Uses **Catmull-Rom spline** interpolation across the control points to produce a smooth 256-entry lookup table. The tone curve editor renders the LUT directly on a `<canvas>` for instant visual feedback.

---

## Presets

Four built-in presets are available in the editor toolbar:

| Preset | Effect |
|---|---|
| **Vivid** | Boosted exposure, high vibrance (+35), clarity, and contrast — punchy and colourful |
| **Film** | Warm tones, lifted shadows, heavy grain (+20) and vignette — analogue look |
| **Portrait** | Soft clarity (-5), raised shadows, subtle vignette — flattering skin tones |
| **Monochrome** | Full desaturation, high contrast (+35), strong clarity — dramatic B&W |

Presets push to the undo history, so they can be undone with a single Ctrl+Z.

---

## Deployment

### Frontend (Vercel)

1. Push the repository to GitHub.
2. Import the repo in [vercel.com](https://vercel.com).
3. Set **Root Directory** to `moonlight`.
4. Add environment variable `VITE_APP_API_URL` → your backend URL.
5. Deploy — Vercel auto-detects Vite.

### Backend (Railway / Render)

The backend ships with **nixpacks** and **Railway** configuration files for zero-config deployment.

#### Railway

```bash
# nixpacks.toml handles the full lifecycle:
# 1. install:  cd moon_backend && npm ci
# 2. build:    cd moon_backend && npx prisma generate
# 3. start:    cd moon_backend && npx prisma migrate deploy && node server.js
```

Set these environment variables in the Railway dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon / Supabase PostgreSQL URL |
| `JWT_SECRET` | A strong random string |
| `FRONTEND_URL` | Your Vercel deployment URL |

#### Render

1. Create a **Web Service** pointing to the repo.
2. Set **Root Directory** to `moonlight/moon_backend`.
3. Build command: `npm ci && npx prisma generate && npx prisma migrate deploy`
4. Start command: `node server.js`
5. Add the same environment variables as above.

---

## Contributing

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. Make your changes and commit:
   ```bash
   git commit -m "feat: add my new feature"
   ```
4. Push and open a Pull Request against `main`.

**Code style:** ESLint is configured via `eslint.config.js`. Run `npm run lint` before submitting a PR.

---

## License

This project is open-source. Feel free to use it as a reference or starting point for your own photo editing app.

---

<p align="center">Made with 🌙 for night photography enthusiasts</p>
