const express = require('express');
const router = express.Router();
const editController = require('../controllers/editController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/save', authenticateToken, editController.saveEdit);
router.get('/', authenticateToken, editController.getEdits);
router.put('/:id', authenticateToken, editController.updateEdit);
router.delete('/:id', authenticateToken, editController.deleteEdit);

module.exports = router;
