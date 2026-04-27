const prisma = require('../config/db');

exports.createAlbum = async (req, res) => {
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
};

exports.getAlbums = async (req, res) => {
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
};

exports.updateAlbum = async (req, res) => {
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
};

exports.deleteAlbum = async (req, res) => {
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
};
