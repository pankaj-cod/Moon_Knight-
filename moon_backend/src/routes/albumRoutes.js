const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/', authenticateToken, albumController.createAlbum);
router.get('/', authenticateToken, albumController.getAlbums);
router.put('/:id', authenticateToken, albumController.updateAlbum);
router.delete('/:id', authenticateToken, albumController.deleteAlbum);

module.exports = router;
