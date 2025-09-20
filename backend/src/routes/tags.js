const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../db');

const router = express.Router();

// GET /api/tags - Get all tags with usage count
router.get('/', async (req, res) => {
  try {
    const tags = await database.all(`
      SELECT t.*, COUNT(st.snippet_id) as usage_count
      FROM tags t
      LEFT JOIN snippet_tags st ON t.id = st.tag_id
      GROUP BY t.id
      ORDER BY usage_count DESC, t.name ASC
    `);

    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/tags/suggestions - Get tag suggestions based on content
router.get('/suggestions', async (req, res) => {
  try {
    const { content = '', language = '' } = req.query;

    // Simple tag suggestions based on content keywords
    const suggestions = new Set();

    // Language-specific suggestions
    const languageKeywords = {
      javascript: ['async', 'await', 'promise', 'fetch', 'react', 'node', 'express'],
      python: ['def', 'class', 'import', 'pandas', 'numpy', 'django', 'flask'],
      rust: ['fn', 'struct', 'impl', 'enum', 'match', 'cargo'],
      css: ['selector', 'grid', 'flexbox', 'animation', 'responsive'],
      html: ['element', 'attribute', 'form', 'semantic'],
      sql: ['select', 'insert', 'update', 'delete', 'join', 'index'],
      typescript: ['type', 'interface', 'generic', 'decorator']
    };

    // Add language-specific suggestions
    if (language && languageKeywords[language.toLowerCase()]) {
      languageKeywords[language.toLowerCase()].forEach(keyword => {
        if (content.toLowerCase().includes(keyword)) {
          suggestions.add(keyword);
        }
      });
    }

    // General programming concepts
    const generalKeywords = {
      'api': /\b(api|endpoint|request|response|rest|graphql)\b/i,
      'database': /\b(sql|database|db|query|table|schema)\b/i,
      'algorithm': /\b(sort|search|tree|graph|algorithm|complexity)\b/i,
      'util': /\b(util|helper|function|method|tool)\b/i,
      'test': /\b(test|spec|mock|assert|jest|mocha)\b/i,
      'config': /\b(config|setup|environment|settings)\b/i,
      'security': /\b(auth|token|jwt|password|encrypt|security)\b/i,
      'performance': /\b(performance|optimize|cache|memory|speed)\b/i
    };

    Object.entries(generalKeywords).forEach(([tag, pattern]) => {
      if (pattern.test(content)) {
        suggestions.add(tag);
      }
    });

    // Get existing popular tags
    const popularTags = await database.all(`
      SELECT t.name, COUNT(st.snippet_id) as usage_count
      FROM tags t
      JOIN snippet_tags st ON t.id = st.tag_id
      GROUP BY t.id
      HAVING usage_count > 0
      ORDER BY usage_count DESC
      LIMIT 10
    `);

    // Add popular tags that might match
    popularTags.forEach(tag => {
      if (content.toLowerCase().includes(tag.name.toLowerCase())) {
        suggestions.add(tag.name);
      }
    });

    res.json(Array.from(suggestions).slice(0, 8)); // Limit to 8 suggestions
  } catch (error) {
    console.error('Error getting tag suggestions:', error);
    res.status(500).json({ error: 'Failed to get tag suggestions' });
  }
});

// POST /api/tags - Create new tag
router.post('/', [
  body('name').notEmpty().trim().withMessage('Tag name is required'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, color } = req.body;

    // Check if tag already exists
    const existing = await database.get('SELECT * FROM tags WHERE name = ?', [name]);
    if (existing) {
      return res.status(409).json({ error: 'Tag already exists' });
    }

    const result = await database.run(
      'INSERT INTO tags (name, color) VALUES (?, ?)',
      [name, color || '#6B7280']
    );

    const newTag = await database.get('SELECT * FROM tags WHERE id = ?', [result.id]);

    res.status(201).json(newTag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// PUT /api/tags/:id - Update tag
router.put('/:id', [
  body('name').notEmpty().trim().withMessage('Tag name is required'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, color } = req.body;
    const tagId = req.params.id;

    // Check if tag exists
    const existing = await database.get('SELECT * FROM tags WHERE id = ?', [tagId]);
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Check if name is already taken by another tag
    const nameConflict = await database.get(
      'SELECT * FROM tags WHERE name = ? AND id != ?', 
      [name, tagId]
    );
    if (nameConflict) {
      return res.status(409).json({ error: 'Tag name already exists' });
    }

    await database.run(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?',
      [name, color || existing.color, tagId]
    );

    const updatedTag = await database.get('SELECT * FROM tags WHERE id = ?', [tagId]);

    res.json(updatedTag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// DELETE /api/tags/:id - Delete tag
router.delete('/:id', async (req, res) => {
  try {
    const tagId = req.params.id;

    // Check if tag exists
    const existing = await database.get('SELECT * FROM tags WHERE id = ?', [tagId]);
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Check if tag is in use
    const usageCount = await database.get(
      'SELECT COUNT(*) as count FROM snippet_tags WHERE tag_id = ?',
      [tagId]
    );

    if (usageCount.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete tag that is in use',
        usage_count: usageCount.count
      });
    }

    await database.run('DELETE FROM tags WHERE id = ?', [tagId]);

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

module.exports = router;