const express = require('express');
const database = require('../db');

const router = express.Router();

// GET /api/favorites - Get all favorite snippets
router.get('/', async (req, res) => {
  try {
    const favorites = await database.all(`
      SELECT s.*, f.created_at as favorited_at
      FROM snippets s
      JOIN favorites f ON s.id = f.snippet_id
      ORDER BY f.created_at DESC
    `);

    // Get tags for each favorite snippet
    const favoritesWithTags = await Promise.all(
      favorites.map(async (snippet) => {
        const tags = await database.all(`
          SELECT t.id, t.name, t.color 
          FROM tags t
          JOIN snippet_tags st ON t.id = st.tag_id
          WHERE st.snippet_id = ?
        `, [snippet.id]);

        return {
          ...snippet,
          tags,
          is_favorite: true
        };
      })
    );

    res.json(favoritesWithTags);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST /api/favorites/:id - Add snippet to favorites
router.post('/:id', async (req, res) => {
  try {
    const snippetId = req.params.id;

    // Check if snippet exists
    const snippet = await database.get('SELECT * FROM snippets WHERE id = ?', [snippetId]);
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    // Check if already favorited
    const existing = await database.get(
      'SELECT * FROM favorites WHERE snippet_id = ?',
      [snippetId]
    );

    if (existing) {
      return res.status(409).json({ error: 'Snippet is already favorited' });
    }

    // Add to favorites
    await database.run(
      'INSERT INTO favorites (snippet_id) VALUES (?)',
      [snippetId]
    );

    res.json({ message: 'Snippet added to favorites', snippet_id: snippetId });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// DELETE /api/favorites/:id - Remove snippet from favorites
router.delete('/:id', async (req, res) => {
  try {
    const snippetId = req.params.id;

    // Check if favorited
    const existing = await database.get(
      'SELECT * FROM favorites WHERE snippet_id = ?',
      [snippetId]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Snippet is not in favorites' });
    }

    // Remove from favorites
    await database.run('DELETE FROM favorites WHERE snippet_id = ?', [snippetId]);

    res.json({ message: 'Snippet removed from favorites', snippet_id: snippetId });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// POST /api/favorites/toggle/:id - Toggle favorite status
router.post('/toggle/:id', async (req, res) => {
  try {
    const snippetId = req.params.id;

    // Check if snippet exists
    const snippet = await database.get('SELECT * FROM snippets WHERE id = ?', [snippetId]);
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    // Check if already favorited
    const existing = await database.get(
      'SELECT * FROM favorites WHERE snippet_id = ?',
      [snippetId]
    );

    if (existing) {
      // Remove from favorites
      await database.run('DELETE FROM favorites WHERE snippet_id = ?', [snippetId]);
      res.json({ 
        message: 'Snippet removed from favorites', 
        snippet_id: snippetId,
        is_favorite: false
      });
    } else {
      // Add to favorites
      await database.run(
        'INSERT INTO favorites (snippet_id) VALUES (?)',
        [snippetId]
      );
      res.json({ 
        message: 'Snippet added to favorites', 
        snippet_id: snippetId,
        is_favorite: true
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

module.exports = router;