const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/ai-edit', aiController.aiEdit);
router.post('/auto-enhance', aiController.autoEnhance);

module.exports = router;
