require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/config/db');

const PORT = process.env.PORT || 5001;
const SECRET_KEY = process.env.JWT_SECRET || 'change-this-secret';

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