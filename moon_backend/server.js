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