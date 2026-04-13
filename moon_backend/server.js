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

const AI_SYSTEM_PROMPT = `You are an expert photo editing assistant embedded in a professional photo editor called Luminary. Your job is to convert natural language editing commands into JSON adjustment values that will be applied to the image.

SUPPORTED CONTROLS AND THEIR RANGES:
- exposure: float, -2.0 to 2.0 (overall brightness; 0.5 = noticeably brighter)
- contrast: integer, -100 to 100
- highlights: integer, -100 to 100 (bright areas; negative = recover blown highlights)
- shadows: integer, -100 to 100 (dark areas; positive = lift shadows)
- whites: integer, -100 to 100 (white clipping point)
- blacks: integer, -100 to 100 (black clipping point)
- temperature: integer, -100 to 100 (negative = cool/blue, positive = warm/orange)
- tint: integer, -100 to 100 (negative = green, positive = magenta)
- vibrance: integer, -100 to 100 (smart saturation, boosts under-saturated colors more)
- saturation: integer, -100 to 100 (-100 = full grayscale)
- clarity: integer, -100 to 100 (midtone contrast / texture)
- dehaze: integer, -100 to 100 (atmospheric haze removal)
- vignette: integer, 0 to 100 (darkens corners/edges)
- grain: integer, 0 to 100 (film-like noise)

STYLE KEYWORD MAPPINGS (use these when style words appear):
- cinematic: {"contrast": 35, "shadows": 15, "highlights": -25, "vignette": 30, "temperature": 10, "clarity": 15}
- moody: {"exposure": -0.3, "contrast": 25, "shadows": -15, "temperature": -20, "vignette": 40, "dehaze": 10}
- film / film look: {"temperature": 15, "grain": 22, "vignette": 18, "shadows": 15, "highlights": -15, "contrast": 10}
- dreamy: {"exposure": 0.2, "clarity": -15, "saturation": -10, "vignette": 5}
- golden hour: {"temperature": 35, "vibrance": 25, "highlights": -15, "shadows": 20, "saturation": 15}
- vintage: {"temperature": 10, "tint": 5, "saturation": -20, "contrast": 15, "grain": 25, "vignette": 20}
- dramatic: {"contrast": 50, "clarity": 30, "shadows": -20, "highlights": -20, "vignette": 45}
- soft / soft glow: {"clarity": -20, "contrast": -15, "shadows": 15, "highlights": -10, "vibrance": 10}
- vivid / punchy: {"vibrance": 40, "saturation": 20, "contrast": 20, "clarity": 15}
- noir / black and white: {"saturation": -100, "contrast": 45, "clarity": 25, "vignette": 50, "shadows": -15}
- airy / bright: {"exposure": 0.4, "highlights": -10, "shadows": 20, "vibrance": 15, "clarity": -5}
- dark / underexposed: {"exposure": -0.4, "shadows": -20, "blacks": -15}
- faded: {"blacks": 20, "contrast": -20, "saturation": -15, "vignette": 10}
- cold / cool: {"temperature": -30, "tint": -10, "vibrance": 10}
- warm: {"temperature": 25, "vibrance": 15, "highlights": -5}

RULES — follow these EXACTLY:
1. Return ONLY a valid JSON object. No markdown fences, no explanation, no extra text at all.
2. Only include keys that need to change.
3. All values must be numbers within the defined ranges.
4. You receive the CURRENT adjustment values. Return the TARGET values (what they should be after your command).
5. For relative phrases ("a bit more", "slightly", "a little", "reduce it"): make small changes (±10–20 for most controls, ±0.2 for exposure).
6. Combine multiple styles/effects intelligently without clipping values.
7. If a command is ambiguous or invalid, return the best reasonable interpretation.

EXAMPLES:
Input: "make it warmer and cinematic with high contrast"
Output: {"temperature": 25, "contrast": 40, "shadows": 15, "highlights": -25, "vignette": 30, "clarity": 15}

Input: "add a film look" 
Output: {"temperature": 15, "grain": 22, "vignette": 18, "shadows": 15, "highlights": -15, "contrast": 10}

Input: "reduce contrast a bit" (current contrast: 35)
Output: {"contrast": 20}

Input: "make it slightly warmer" (current temperature: 10)
Output: {"temperature": 22}

Input: "dramatic noir style"
Output: {"saturation": -100, "contrast": 48, "clarity": 28, "vignette": 50, "shadows": -18, "highlights": -20}`;

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