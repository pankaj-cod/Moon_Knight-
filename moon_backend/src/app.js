const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const editRoutes = require('./routes/editRoutes');
const albumRoutes = require('./routes/albumRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://moon-knight-git-main-pankaj-cods-projects.vercel.app',
    'https://moon-knight-jet.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/health', async (req, res) => {
  const prisma = require('./config/db');
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/edits', editRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
