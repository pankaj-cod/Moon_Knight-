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
        temperature: settings?.temperature || 0
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

// GET USER'S EDITS
app.get('/api/edits', authenticateToken, async (req, res) => {
  try {
    const edits = await prisma.edit.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
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
        createdAt: true
      }
    });

    // Format for frontend (match old structure)
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
      createdAt: edit.createdAt
    }));

    res.json({ edits: formattedEdits, count: edits.length });

  } catch (error) {
    console.error('Get edits error:', error);
    res.status(500).json({ error: 'Server error while fetching edits' });
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