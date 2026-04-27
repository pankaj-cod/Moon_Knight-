const prisma = require('../config/db');

exports.saveEdit = async (req, res) => {
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
};

exports.getEdits = async (req, res) => {
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
};

exports.updateEdit = async (req, res) => {
  try {
    const { presetName, settings, albumId } = req.body;

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
};

exports.deleteEdit = async (req, res) => {
  try {
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
};
