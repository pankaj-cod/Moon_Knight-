// server.js - Prisma Backend
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;
const SECRET_KEY = process.env.JWT_SECRET || 'change-this-secret';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// SIGNUP
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET USER PROFILE
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== EDITS ROUTES ====================

// SAVE EDIT
app.post('/api/edits/save', authenticateToken, async (req, res) => {
  try {
    const { imageData, settings, presetName } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data required' });
    }

    const newEdit = await prisma.edit.create({
      data: {
        userId: req.user.id,
        imageData,
        presetName: presetName || 'Custom',
        brightness: settings?.brightness || 100,
        contrast: settings?.contrast || 100,
        saturate: settings?.saturate || 100,
        blur: settings?.blur || 0,
        hue: settings?.hue || 0,
        temperature: settings?.temperature || 0,
        ...(req.body.albumId && { albumId: req.body.albumId })
      }
    });

    res.status(201).json({
      message: 'Edit saved successfully',
      edit: {
        id: newEdit.id,
        presetName: newEdit.presetName,
        createdAt: newEdit.createdAt
      }
    });

  } catch (error) {
    console.error('Save edit error:', error);
    res.status(500).json({ error: 'Server error while saving edit' });
  }
});

// GET USER'S EDITS (with Pagination, Search, Sort, Filter)
app.get('/api/edits', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', order = 'desc', presetName, albumId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(search && {
        OR: [
          { presetName: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(presetName && { presetName: { equals: presetName } }),
      ...(albumId && { albumId: { equals: albumId } })
    };

    const [edits, total] = await Promise.all([
      prisma.edit.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        select: {
          id: true,
          imageData: true,
          presetName: true,
          brightness: true,
          contrast: true,
          saturate: true,
          blur: true,
          hue: true,
          temperature: true,
          createdAt: true,
          albumId: true
        }
      }),
      prisma.edit.count({ where })
    ]);

    // Format for frontend
    const formattedEdits = edits.map(edit => ({
      id: edit.id,
      imageData: edit.imageData,
      presetName: edit.presetName,
      settings: {
        brightness: edit.brightness,
        contrast: edit.contrast,
        saturate: edit.saturate,
        blur: edit.blur,
        hue: edit.hue,
        temperature: edit.temperature
      },
      createdAt: edit.createdAt,
      albumId: edit.albumId
    }));

    res.json({
      edits: formattedEdits,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get edits error:', error);
    res.status(500).json({ error: 'Server error while fetching edits' });
  }
});

// UPDATE EDIT
app.put('/api/edits/:id', authenticateToken, async (req, res) => {
  try {
    const { presetName, settings, albumId } = req.body;

    // Check if edit belongs to user
    const edit = await prisma.edit.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!edit) {
      return res.status(404).json({ error: 'Edit not found or unauthorized' });
    }

    const updatedEdit = await prisma.edit.update({
      where: { id: req.params.id },
      data: {
        ...(presetName && { presetName }),
        ...(settings && {
          brightness: settings.brightness,
          contrast: settings.contrast,
          saturate: settings.saturate,
          blur: settings.blur,
          hue: settings.hue,
          temperature: settings.temperature
        }),
        ...(albumId !== undefined && { albumId })
      }
    });

    res.json({
      message: 'Edit updated successfully',
      edit: updatedEdit
    });

  } catch (error) {
    console.error('Update edit error:', error);
    res.status(500).json({ error: 'Server error while updating edit' });
  }
});

// DELETE EDIT
app.delete('/api/edits/:id', authenticateToken, async (req, res) => {
  try {
    // Check if edit belongs to user
    const edit = await prisma.edit.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!edit) {
      return res.status(404).json({ error: 'Edit not found or unauthorized' });
    }

    await prisma.edit.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Edit deleted successfully',
      deletedId: req.params.id
    });

  } catch (error) {
    console.error('Delete edit error:', error);
    res.status(500).json({ error: 'Server error while deleting edit' });
  }
});

// ==================== ALBUM ROUTES ====================

// CREATE ALBUM
app.post('/api/albums', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Album name required' });
    }

    const newAlbum = await prisma.album.create({
      data: {
        userId: req.user.id,
        name,
        description
      }
    });

    res.status(201).json({
      message: 'Album created successfully',
      album: newAlbum
    });

  } catch (error) {
    console.error('Create album error:', error);
    res.status(500).json({ error: 'Server error while creating album' });
  }
});

// GET ALBUMS (with Pagination, Search, Sort, Filter)
app.get('/api/albums', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        include: {
          _count: {
            select: { edits: true }
          }
        }
      }),
      prisma.album.count({ where })
    ]);

    res.json({
      albums,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get albums error:', error);
    res.status(500).json({ error: 'Server error while fetching albums' });
  }
});

// UPDATE ALBUM
app.put('/api/albums/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    const album = await prisma.album.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!album) {
      return res.status(404).json({ error: 'Album not found or unauthorized' });
    }

    const updatedAlbum = await prisma.album.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description })
      }
    });

    res.json({
      message: 'Album updated successfully',
      album: updatedAlbum
    });

  } catch (error) {
    console.error('Update album error:', error);
    res.status(500).json({ error: 'Server error while updating album' });
  }
});

// DELETE ALBUM
app.delete('/api/albums/:id', authenticateToken, async (req, res) => {
  try {
    const album = await prisma.album.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!album) {
      return res.status(404).json({ error: 'Album not found or unauthorized' });
    }

    await prisma.album.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Album deleted successfully',
      deletedId: req.params.id
    });

  } catch (error) {
    console.error('Delete album error:', error);
    res.status(500).json({ error: 'Server error while deleting album' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'Server is running!',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'Server is running!',
      database: 'Disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== AI EDIT ROUTE ====================

// Validation schema: maps flat key → { category, min, max }
const ADJUSTMENT_SCHEMA = {
  exposure:    { category: 'basic',   min: -2,   max: 2   },
  contrast:    { category: 'basic',   min: -100, max: 100 },
  highlights:  { category: 'basic',   min: -100, max: 100 },
  shadows:     { category: 'basic',   min: -100, max: 100 },
  whites:      { category: 'basic',   min: -100, max: 100 },
  blacks:      { category: 'basic',   min: -100, max: 100 },
  temperature: { category: 'color',   min: -100, max: 100 },
  tint:        { category: 'color',   min: -100, max: 100 },
  vibrance:    { category: 'color',   min: -100, max: 100 },
  saturation:  { category: 'color',   min: -100, max: 100 },
  clarity:     { category: 'effects', min: -100, max: 100 },
  dehaze:      { category: 'effects', min: -100, max: 100 },
  vignette:    { category: 'effects', min: 0,    max: 100 },
  grain:       { category: 'effects', min: 0,    max: 100 },
};

function clampVal(v, min, max) { return Math.min(max, Math.max(min, Number(v))); }

/** Strip unknown keys and clamp values to defined ranges */
function sanitizeAIOutput(raw) {
  const result = {};
  for (const [key, spec] of Object.entries(ADJUSTMENT_SCHEMA)) {
    if (key in raw && typeof raw[key] === 'number' && isFinite(raw[key])) {
      result[key] = clampVal(raw[key], spec.min, spec.max);
    }
  }
  return result;
}

/** Flatten nested adjustments object to { key: value } for sending as context */
function flattenAdjustments(adj) {
  if (!adj) return {};
  return {
    exposure:    adj.basic?.exposure    ?? 0,
    contrast:    adj.basic?.contrast    ?? 0,
    highlights:  adj.basic?.highlights  ?? 0,
    shadows:     adj.basic?.shadows     ?? 0,
    whites:      adj.basic?.whites      ?? 0,
    blacks:      adj.basic?.blacks      ?? 0,
    temperature: adj.color?.temperature ?? 0,
    tint:        adj.color?.tint        ?? 0,
    vibrance:    adj.color?.vibrance    ?? 0,
    saturation:  adj.color?.saturation  ?? 0,
    clarity:     adj.effects?.clarity   ?? 0,
    dehaze:      adj.effects?.dehaze    ?? 0,
    vignette:    adj.effects?.vignette  ?? 0,
    grain:       adj.effects?.grain     ?? 0,
  };
}

const AI_SYSTEM_PROMPT = `You are **Luminary AI**, a world-class photo editing assistant built into a professional browser-based photo editor. You translate natural-language editing commands into precise JSON adjustment values. You have deep knowledge of photography, color science, and cinematic color grading.

═══════════════════════════════════════════════
 AVAILABLE CONTROLS & RANGES
═══════════════════════════════════════════════

LIGHT (tonal range):
  exposure     float   -2.0 … 2.0    Overall brightness. 0.3 = subtle lift, 1.0 = very bright.
  contrast     int     -100 … 100    Midtone separation. Positive = punchier, negative = flatter.
  highlights   int     -100 … 100    Bright areas only. Negative = recover blown-out skies/skin.
  shadows      int     -100 … 100    Dark areas only. Positive = lift detail from shadows.
  whites       int     -100 … 100    White clipping point. Pushes the brightest whites.
  blacks       int     -100 … 100    Black clipping point. Positive = lifted/faded blacks (film look). Negative = crushed blacks.

COLOR:
  temperature  int     -100 … 100    White balance. Negative = cooler/bluer, positive = warmer/orange.
  tint         int     -100 … 100    Green ↔ magenta axis. Usually subtle (±5–15).
  vibrance     int     -100 … 100    Smart saturation — boosts muted colors more than already-saturated ones. Great for skin-safe color pops.
  saturation   int     -100 … 100    Uniform saturation. -100 = full desaturation (grayscale).

EFFECTS:
  clarity      int     -100 … 100    Midtone contrast / micro-texture. Positive = gritty/sharp, negative = soft/dreamy.
  dehaze       int     -100 … 100    Removes atmospheric haze. Positive = clearer, negative = adds haze/fog.
  vignette     int     0 … 100       Darkens edges/corners to draw focus inward.
  grain        int     0 … 100       Adds film-like noise texture. 15–25 = subtle analog feel, 50+ = heavy grain.

═══════════════════════════════════════════════
 STYLE REFERENCE LIBRARY
═══════════════════════════════════════════════
Use these as starting points when style keywords appear. Blend and adjust intelligently — don't just copy verbatim. Adapt intensity to modifiers like "subtle", "heavy", "extreme".

CINEMATIC STYLES:
  cinematic         → contrast +35, shadows +15, highlights -25, vignette 30, temperature +10, clarity +15
  blockbuster       → contrast +45, clarity +25, shadows -10, highlights -30, vignette 35, dehaze +15, saturation +10
  indie film        → temperature +12, grain 20, contrast +10, saturation -10, vignette 15, shadows +10
  noir              → saturation -100, contrast +45, clarity +25, vignette 50, shadows -15, blacks -10
  neo-noir          → saturation -60, contrast +40, clarity +20, vignette 40, temperature -15, dehaze +10

WARM / COOL:
  warm              → temperature +25, vibrance +15, highlights -5
  golden hour       → temperature +35, vibrance +25, highlights -15, shadows +20, saturation +15, exposure +0.15
  sunset            → temperature +40, saturation +20, vibrance +15, shadows +10, highlights -20
  cold / cool       → temperature -30, tint -10, vibrance +10
  arctic / icy      → temperature -50, contrast +15, clarity +10, saturation -15, exposure +0.1
  autumn / fall     → temperature +20, saturation +15, vibrance +20, contrast +10, shadows +10

MOOD:
  moody             → exposure -0.3, contrast +25, shadows -15, temperature -20, vignette 40, dehaze +10
  dramatic          → contrast +50, clarity +30, shadows -20, highlights -20, vignette 45
  dark / low-key    → exposure -0.4, shadows -20, blacks -15, contrast +15, vignette 25
  bright / high-key → exposure +0.4, highlights -10, shadows +20, vibrance +15, clarity -5
  ethereal          → exposure +0.3, clarity -20, saturation -10, highlights -10, vignette 5, dehaze -10

FILM / ANALOG:
  film              → temperature +15, grain 22, vignette 18, shadows +15, highlights -15, contrast +10
  kodak portra      → temperature +10, tint +3, saturation -10, grain 15, shadows +20, highlights -10, contrast +5
  fuji              → temperature -5, vibrance +20, saturation +10, grain 12, contrast +15, shadows +5
  vintage           → temperature +10, tint +5, saturation -20, contrast +15, grain 25, vignette 20, blacks +15
  faded / washed    → blacks +20, contrast -20, saturation -15, vignette 10, highlights -5

CREATIVE:
  dreamy            → exposure +0.2, clarity -15, saturation -10, vignette 5, dehaze -10
  soft / soft glow  → clarity -20, contrast -15, shadows +15, highlights -10, vibrance +10
  vivid / punchy    → vibrance +40, saturation +20, contrast +20, clarity +15
  matte             → blacks +25, contrast -10, saturation -10
  hazy / foggy      → dehaze -30, contrast -15, clarity -10, exposure +0.15, saturation -10
  gritty            → clarity +35, contrast +25, grain 30, shadows -10, vignette 20
  pastel            → saturation -25, exposure +0.2, contrast -15, vibrance +10, clarity -10

PHOTOGRAPHY GENRES:
  portrait          → clarity -5, vibrance +10, shadows +15, highlights -10, exposure +0.1
  landscape         → clarity +20, vibrance +25, dehaze +20, contrast +15, shadows +15, highlights -15
  street            → contrast +25, clarity +15, grain 15, vignette 20, saturation -10
  food              → temperature +10, vibrance +20, saturation +10, clarity +10, exposure +0.15
  product           → exposure +0.2, contrast +10, clarity +15, vibrance +5, shadows +10
  astro / night sky → temperature -15, clarity +25, dehaze +30, contrast +20, vibrance +15, exposure +0.3, blacks -10

═══════════════════════════════════════════════
 INTENSITY MODIFIERS
═══════════════════════════════════════════════
Scale your values based on these modifier words:
  "subtle" / "slightly" / "a touch" / "a hint"  → 25–40% of standard values
  "a bit" / "a little" / "somewhat"              → 50–60% of standard values
  (no modifier)                                   → 100% (standard)
  "more" / "strong" / "heavy"                     → 120–140% of standard values
  "very" / "extreme" / "maximum" / "cranked"      → 160–200% of standard values (still within ranges)

═══════════════════════════════════════════════
 RULES — FOLLOW EXACTLY
═══════════════════════════════════════════════

1. RETURN ONLY a valid JSON object. No markdown fences, no backticks, no explanation, no extra text.
2. ONLY include keys that need to change from their current values. Omit keys that remain the same.
3. ALL values must be numbers within the defined ranges. Integers for all controls except exposure (float to 2 decimal places).
4. You receive CURRENT adjustment values. Return TARGET values (absolute, not deltas).
5. For RELATIVE commands ("a bit more", "slightly less", "increase it", "reduce it", "bump up"):
   - Read the current value and calculate a new target.
   - "a bit" = ±10–20 for integer controls, ±0.15–0.25 for exposure.
   - "a lot" / "much more" = ±30–50 for integer controls.
6. COMBINE multiple styles intelligently:
   - When styles conflict, average their values rather than picking one.
   - Never exceed the defined ranges — cap at boundaries.
7. For RESET commands ("reset", "undo all", "start over", "clear", "back to original"):
   - Return ALL controls set to 0 (or their default): {"exposure": 0, "contrast": 0, "highlights": 0, "shadows": 0, "whites": 0, "blacks": 0, "temperature": 0, "tint": 0, "vibrance": 0, "saturation": 0, "clarity": 0, "dehaze": 0, "vignette": 0, "grain": 0}
8. For AMBIGUOUS or nonsensical commands, return your best reasonable photographic interpretation. Never return an empty object.
9. Photography knowledge: when the user describes a scene or subject (e.g., "this is a sunset photo"), respond with settings appropriate for enhancing that type of image.
10. If a user says "undo" or "revert last change", return an empty object {} — the frontend handles undo separately.

═══════════════════════════════════════════════
 EXAMPLES
═══════════════════════════════════════════════

Input: "make it warmer and cinematic with high contrast"
Output: {"temperature": 25, "contrast": 42, "shadows": 15, "highlights": -25, "vignette": 30, "clarity": 15}

Input: "add a film look"
Output: {"temperature": 15, "grain": 22, "vignette": 18, "shadows": 15, "highlights": -15, "contrast": 10}

Input: "reduce contrast a bit" (current: contrast 35)
Output: {"contrast": 20}

Input: "make it slightly warmer" (current: temperature 10)
Output: {"temperature": 22}

Input: "dramatic noir"
Output: {"saturation": -100, "contrast": 48, "clarity": 28, "vignette": 50, "shadows": -18, "highlights": -20, "blacks": -10}

Input: "this is a landscape photo, make it pop"
Output: {"clarity": 22, "vibrance": 28, "dehaze": 20, "contrast": 18, "shadows": 15, "highlights": -15, "saturation": 10}

Input: "subtle vintage with muted colors"
Output: {"temperature": 5, "saturation": -12, "contrast": 8, "grain": 12, "vignette": 10, "blacks": 8}

Input: "make it look like a Wes Anderson movie"
Output: {"temperature": 8, "saturation": 15, "vibrance": 20, "contrast": 10, "clarity": 10, "highlights": -10, "shadows": 10, "grain": 8}

Input: "extremely moody and dark"
Output: {"exposure": -0.55, "contrast": 40, "shadows": -25, "temperature": -30, "vignette": 60, "dehaze": 15, "blacks": -15}

Input: "reset everything"
Output: {"exposure": 0, "contrast": 0, "highlights": 0, "shadows": 0, "whites": 0, "blacks": 0, "temperature": 0, "tint": 0, "vibrance": 0, "saturation": 0, "clarity": 0, "dehaze": 0, "vignette": 0, "grain": 0}

Input: "make it brighter but keep the mood"
(current: exposure -0.3, contrast 25, shadows -15, temperature -20, vignette 40)
Output: {"exposure": -0.05, "shadows": -5}

Input: "I want it to look dreamy but with warm tones"
Output: {"exposure": 0.2, "clarity": -15, "saturation": -10, "vignette": 5, "dehaze": -10, "temperature": 20, "vibrance": 10}`;

app.post('/api/ai-edit', async (req, res) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    return res.status(503).json({ error: 'AI editing is not configured. Add GROQ_API_KEY to your .env file.' });
  }

  const { prompt, currentAdjustments } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  if (prompt.trim().length > 500) {
    return res.status(400).json({ error: 'Prompt must be under 500 characters' });
  }

  // Build a flat current-state string for context
  const flat = flattenAdjustments(currentAdjustments);
  const nonZero = Object.entries(flat).filter(([, v]) => v !== 0);
  const currentContext = nonZero.length > 0
    ? `\n\nCurrent adjustment values: ${JSON.stringify(Object.fromEntries(nonZero))}`
    : '';

  const userMessage = prompt.trim() + currentContext;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT },
          { role: 'user',   content: userMessage },
        ],
        temperature: 0.25,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API error:', groqRes.status, errText);
      return res.status(502).json({ error: 'AI service returned an error. Please try again.' });
    }

    const groqData = await groqRes.json();
    const rawContent = groqData.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      return res.status(502).json({ error: 'Empty response from AI service.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error('Failed to parse AI JSON:', rawContent);
      return res.status(502).json({ error: 'AI returned malformed JSON. Please rephrase your command.' });
    }

    // Sanitize: strip unknown keys, clamp ranges, enforce numbers
    const sanitized = sanitizeAIOutput(parsed);

    if (Object.keys(sanitized).length === 0) {
      return res.status(422).json({
        error: 'Could not extract valid adjustments. Try a more specific command like "make it warmer" or "add cinematic contrast".',
      });
    }

    console.log(`[AI Edit] prompt="${prompt.trim()}" → adjustments:`, sanitized);
    res.json({ adjustments: sanitized, prompt: prompt.trim() });

  } catch (error) {
    console.error('AI edit route error:', error);
    res.status(500).json({ error: 'Server error while processing your command.' });
  }
});

// ==================== AUTO-ENHANCE ROUTE ====================

const AUTO_ENHANCE_PROMPT = `You are **Luminary AI**, an expert photo analysis and correction engine. You receive structured image analysis data and must return corrective adjustments to optimize the image quality.

AVAILABLE CONTROLS & RANGES (same as the editor):
  exposure: float -2.0…2.0, contrast: int -100…100, highlights: int -100…100,
  shadows: int -100…100, whites: int -100…100, blacks: int -100…100,
  temperature: int -100…100, tint: int -100…100, vibrance: int -100…100,
  saturation: int -100…100, clarity: int -100…100, dehaze: int -100…100,
  vignette: int 0…100, grain: int 0…100

ANALYSIS DATA YOU RECEIVE:
  - luminance: mean, stdDev, min, max, p5 (5th percentile), p95 (95th percentile), dynamicRange, skewness
  - color: meanR, meanG, meanB, cast (red/green/blue deviation %), meanSaturation
  - clipping: shadowPercent, highlightPercent (% of pixels clipped)
  - scores: exposure (0-100), contrast (0-100), color (0-100), overall (0-100)
  - issues: array of detected problems

CORRECTION LOGIC — apply these principles:

EXPOSURE:
  - Mean luminance < 80 → increase exposure (underexposed)
  - Mean luminance > 190 → decrease exposure (overexposed)
  - Ideal target: mean luminance ~120-140
  - Formula hint: exposure ≈ (128 - meanLuminance) / 128 * 1.2 (capped at ±1.5)

CONTRAST:
  - Dynamic range < 120 → increase contrast
  - StdDev < 35 → low contrast, boost it
  - StdDev > 80 → too contrasty, reduce slightly

HIGHLIGHTS / SHADOWS:
  - highlightClipped > 5% → negative highlights to recover
  - shadowClipped > 8% → positive shadows to lift detail
  - Histogram left-skewed → lift shadows and increase exposure
  - Histogram right-skewed → reduce highlights

COLOR CAST:
  - Red cast > 8% → decrease temperature (cool it down)
  - Blue cast > 8% → increase temperature (warm it up)
  - Green cast > 5% → increase tint slightly

SATURATION:
  - meanSaturation < 0.15 → boost vibrance (not saturation — more natural)
  - meanSaturation > 0.60 → reduce saturation slightly

FINISHING:
  - For images that score > 80 overall: make minimal or no changes
  - Always add slight clarity (+5–15) for general sharpness unless contrast is already high
  - Never over-correct — subtle adjustments are better than dramatic ones
  - Don't add vignette or grain in auto-enhance (those are creative, not corrective)

RESPONSE FORMAT:
Return a JSON object with exactly these three keys:
{
  "adjustments": { ... only keys that need to change ... },
  "qualityScore": <integer 0-100, the CURRENT quality before your corrections>,
  "explanation": "<2-3 sentence explanation of what you found and what you're fixing>"
}

RULES:
1. Return ONLY valid JSON. No markdown, no backticks, no extra text.
2. "adjustments" contains only keys that need correction. Omit unchanged controls.
3. "qualityScore" is the ORIGINAL image quality (before your corrections).
4. "explanation" should be conversational and specific. Mention the actual issues found.
5. If the image is already well-exposed and balanced (overall score > 85), return minimal adjustments and say so.
6. All adjustment values must be within defined ranges.

EXAMPLES:

Input analysis: meanLuminance=72, stdDev=31, dynamicRange=105, shadowClipped=12%, colorCast red=+15%
Output: {"adjustments":{"exposure":0.45,"contrast":20,"shadows":25,"highlights":-10,"temperature":-12,"vibrance":15,"clarity":10},"qualityScore":42,"explanation":"Your image is underexposed with crushed shadows and a warm color cast. I've lifted the exposure, opened up the shadows, and cooled the temperature to neutralize the reddish tint."}

Input analysis: meanLuminance=135, stdDev=52, dynamicRange=190, no issues
Output: {"adjustments":{"clarity":8,"vibrance":5},"qualityScore":88,"explanation":"Your image looks great — well-exposed with good dynamic range. I've added a subtle clarity and vibrance boost to bring out a bit more detail."}`;

app.post('/api/auto-enhance', async (req, res) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    return res.status(503).json({ error: 'AI editing is not configured.' });
  }

  const { analysis } = req.body;

  if (!analysis || !analysis.scores || !analysis.luminance) {
    return res.status(400).json({ error: 'Image analysis data is required' });
  }

  // Build a concise analysis summary for the LLM
  const summary = [
    `Image Analysis Report:`,
    `Luminance: mean=${analysis.luminance.mean}, stdDev=${analysis.luminance.stdDev}, min=${analysis.luminance.min}, max=${analysis.luminance.max}`,
    `Percentiles: p5=${analysis.luminance.p5}, p95=${analysis.luminance.p95}, dynamicRange=${analysis.luminance.dynamicRange}`,
    `Histogram skewness: ${analysis.luminance.skewness}`,
    `Color: R=${analysis.color.meanR}, G=${analysis.color.meanG}, B=${analysis.color.meanB}`,
    `Color cast: red=${analysis.color.cast.red}%, green=${analysis.color.cast.green}%, blue=${analysis.color.cast.blue}%`,
    `Mean saturation: ${analysis.color.meanSaturation}`,
    `Clipping: shadows=${analysis.clipping.shadowPercent}%, highlights=${analysis.clipping.highlightPercent}%`,
    `Quality scores: exposure=${analysis.scores.exposure}, contrast=${analysis.scores.contrast}, color=${analysis.scores.color}, overall=${analysis.scores.overall}`,
    `Issues detected: ${analysis.issues.length > 0 ? analysis.issues.join(', ') : 'none'}`,
  ].join('\n');

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: AUTO_ENHANCE_PROMPT },
          { role: 'user',   content: summary },
        ],
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API error (auto-enhance):', groqRes.status, errText);
      return res.status(502).json({ error: 'AI service returned an error.' });
    }

    const groqData = await groqRes.json();
    const rawContent = groqData.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      return res.status(502).json({ error: 'Empty response from AI.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error('Auto-enhance JSON parse fail:', rawContent);
      return res.status(502).json({ error: 'AI returned malformed response.' });
    }

    // Validate and sanitize adjustments
    const sanitized = sanitizeAIOutput(parsed.adjustments || {});
    const qualityScore = Math.max(0, Math.min(100, Math.round(Number(parsed.qualityScore) || analysis.scores.overall)));
    const explanation = typeof parsed.explanation === 'string' ? parsed.explanation.slice(0, 500) : 'Auto-enhance applied.';

    console.log(`[Auto-Enhance] score=${qualityScore} → adjustments:`, sanitized);
    res.json({
      adjustments: sanitized,
      qualityScore,
      explanation,
      analysis: analysis.scores,
    });

  } catch (error) {
    console.error('Auto-enhance error:', error);
    res.status(500).json({ error: 'Server error during auto-enhance.' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`💾 Database: Prisma (${process.env.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite'})`);
  console.log(`🔐 JWT Secret: ${SECRET_KEY === 'change-this-secret' ? '⚠️  DEFAULT (CHANGE!)' : '✅ Custom'}`);
});

module.exports = app;