const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../db');
const { createTwoFilesPatch } = require('diff');
const multer = require('multer');
const exportImportService = require('../services/exportImport');

const router = express.Router();

// Validation middleware
const validateSnippet = [
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('language').notEmpty().trim().withMessage('Language is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('source').optional().trim()
];

// Helper function to get snippet with tags
async function getSnippetWithTags(snippetId) {
  const snippet = await database.get(
    'SELECT * FROM snippets WHERE id = ?', 
    [snippetId]
  );
  
  if (!snippet) return null;

  const tags = await database.all(`
    SELECT t.id, t.name, t.color 
    FROM tags t
    JOIN snippet_tags st ON t.id = st.tag_id
    WHERE st.snippet_id = ?
  `, [snippetId]);

  const isFavorite = await database.get(
    'SELECT 1 FROM favorites WHERE snippet_id = ?',
    [snippetId]
  );

  return {
    ...snippet,
    tags,
    is_favorite: !!isFavorite
  };
}

// Helper function to manage tags
async function manageTags(snippetId, tagNames) {
  if (!tagNames || !Array.isArray(tagNames)) return;

  // Remove existing tags for this snippet
  await database.run(
    'DELETE FROM snippet_tags WHERE snippet_id = ?',
    [snippetId]
  );

  // Add new tags
  for (const tagName of tagNames) {
    // Create tag if it doesn't exist
    let tag = await database.get('SELECT id FROM tags WHERE name = ?', [tagName]);
    if (!tag) {
      const result = await database.run(
        'INSERT INTO tags (name) VALUES (?)',
        [tagName]
      );
      tag = { id: result.id };
    }

    // Link tag to snippet
    await database.run(
      'INSERT OR IGNORE INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)',
      [snippetId, tag.id]
    );
  }
}

// GET /api/snippets - Get all snippets with filtering and search
router.get('/', async (req, res) => {
  try {
    const { 
      search = '', 
      language = '', 
      tag = '', 
      favorites = false,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    let query = `
      SELECT DISTINCT s.*, 
             GROUP_CONCAT(t.name) as tag_names,
             (SELECT COUNT(*) FROM favorites f WHERE f.snippet_id = s.id) as is_favorite
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
    `;

    let conditions = [];
    let params = [];

    if (search) {
      conditions.push('(s.title LIKE ? OR s.content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (language) {
      conditions.push('s.language = ?');
      params.push(language);
    }

    if (tag) {
      conditions.push('t.name = ?');
      params.push(tag);
    }

    if (favorites === 'true') {
      query += ' LEFT JOIN favorites f ON s.id = f.snippet_id';
      conditions.push('f.snippet_id IS NOT NULL');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY s.id';
    query += ` ORDER BY s.${sort} ${order}`;

    const snippets = await database.all(query, params);

    // Get tags for each snippet
    const snippetsWithTags = await Promise.all(
      snippets.map(async (snippet) => {
        const tags = await database.all(`
          SELECT t.id, t.name, t.color 
          FROM tags t
          JOIN snippet_tags st ON t.id = st.tag_id
          WHERE st.snippet_id = ?
        `, [snippet.id]);

        return {
          ...snippet,
          tags,
          is_favorite: snippet.is_favorite > 0,
          tag_names: undefined // Remove the concatenated field
        };
      })
    );

    res.json(snippetsWithTags);
  } catch (error) {
    console.error('Error fetching snippets:', error);
    res.status(500).json({ error: 'Failed to fetch snippets' });
  }
});

// GET /api/snippets/:id - Get single snippet
router.get('/:id', async (req, res) => {
  try {
    const snippet = await getSnippetWithTags(req.params.id);
    
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    res.json(snippet);
  } catch (error) {
    console.error('Error fetching snippet:', error);
    res.status(500).json({ error: 'Failed to fetch snippet' });
  }
});

// POST /api/snippets - Create new snippet
router.post('/', validateSnippet, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, language, source, tags } = req.body;

    const result = await database.run(
      'INSERT INTO snippets (title, content, language, source) VALUES (?, ?, ?, ?)',
      [title, content, language, source || null]
    );

    const snippetId = result.id;

    // Manage tags
    await manageTags(snippetId, tags);

    // Get the created snippet with tags
    const newSnippet = await getSnippetWithTags(snippetId);

    res.status(201).json(newSnippet);
  } catch (error) {
    console.error('Error creating snippet:', error);
    res.status(500).json({ error: 'Failed to create snippet' });
  }
});

// PUT /api/snippets/:id - Update snippet
router.put('/:id', validateSnippet, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, language, source, tags } = req.body;
    const snippetId = req.params.id;

    // Check if snippet exists
    const existing = await database.get('SELECT * FROM snippets WHERE id = ?', [snippetId]);
    if (!existing) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    // Update snippet
    await database.run(
      'UPDATE snippets SET title = ?, content = ?, language = ?, source = ? WHERE id = ?',
      [title, content, language, source || null, snippetId]
    );

    // Manage tags
    await manageTags(snippetId, tags);

    // Get updated snippet
    const updatedSnippet = await getSnippetWithTags(snippetId);

    res.json(updatedSnippet);
  } catch (error) {
    console.error('Error updating snippet:', error);
    res.status(500).json({ error: 'Failed to update snippet' });
  }
});

// DELETE /api/snippets/:id - Delete snippet
router.delete('/:id', async (req, res) => {
  try {
    const snippetId = req.params.id;

    // Check if snippet exists
    const existing = await database.get('SELECT * FROM snippets WHERE id = ?', [snippetId]);
    if (!existing) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    await database.run('DELETE FROM snippets WHERE id = ?', [snippetId]);

    res.json({ message: 'Snippet deleted successfully' });
  } catch (error) {
    console.error('Error deleting snippet:', error);
    res.status(500).json({ error: 'Failed to delete snippet' });
  }
});

// GET /api/snippets/:id/versions - Get version history
router.get('/:id/versions', async (req, res) => {
  try {
    const versions = await database.all(
      'SELECT * FROM versions WHERE snippet_id = ? ORDER BY version_number DESC',
      [req.params.id]
    );

    res.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// POST /api/snippets/:id/rollback - Rollback to specific version
router.post('/:id/rollback', async (req, res) => {
  try {
    const { version_number } = req.body;
    const snippetId = req.params.id;

    // Get the version to rollback to
    const version = await database.get(
      'SELECT * FROM versions WHERE snippet_id = ? AND version_number = ?',
      [snippetId, version_number]
    );

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Update current snippet with version data
    await database.run(
      'UPDATE snippets SET title = ?, content = ?, language = ?, source = ? WHERE id = ?',
      [version.title, version.content, version.language, version.source, snippetId]
    );

    // Get updated snippet
    const updatedSnippet = await getSnippetWithTags(snippetId);

    res.json(updatedSnippet);
  } catch (error) {
    console.error('Error rolling back snippet:', error);
    res.status(500).json({ error: 'Failed to rollback snippet' });
  }
});

// GET /api/snippets/:id/diff/:version - Get diff between current and specific version
router.get('/:id/diff/:version', async (req, res) => {
  try {
    const snippetId = req.params.id;
    const versionNumber = req.params.version;

    // Get current snippet
    const current = await database.get('SELECT * FROM snippets WHERE id = ?', [snippetId]);
    if (!current) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    // Get specific version
    const version = await database.get(
      'SELECT * FROM versions WHERE snippet_id = ? AND version_number = ?',
      [snippetId, versionNumber]
    );
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Create diff
    const diff = createTwoFilesPatch(
      `${current.title} (current)`,
      `${version.title} (v${version.version_number})`,
      current.content,
      version.content,
      undefined,
      undefined,
      { context: 3 }
    );

    res.json({
      current: {
        title: current.title,
        content: current.content,
        version: current.version
      },
      version: {
        title: version.title,
        content: version.content,
        version: version.version_number
      },
      diff
    });
  } catch (error) {
    console.error('Error generating diff:', error);
    res.status(500).json({ error: 'Failed to generate diff' });
  }
});

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  }
});

// GET /api/snippets/export - Export snippets
router.get('/export', async (req, res) => {
  try {
    const { type = 'json', ids } = req.query;
    
    let snippetIds = [];
    if (ids) {
      snippetIds = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    }

    if (type === 'json') {
      const exportData = await exportImportService.exportToJSON(snippetIds);
      
      const filename = `mysnippethub-export-${new Date().toISOString().slice(0, 10)}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(exportData);
      
    } else if (type === 'md' || type === 'markdown') {
      const markdownContent = await exportImportService.exportToMarkdown(snippetIds);
      
      const filename = `mysnippethub-export-${new Date().toISOString().slice(0, 10)}.md`;
      
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(markdownContent);
      
    } else {
      return res.status(400).json({ error: 'Invalid export type. Use "json" or "md".' });
    }
    
  } catch (error) {
    console.error('Error exporting snippets:', error);
    res.status(500).json({ error: 'Failed to export snippets' });
  }
});

// POST /api/snippets/import - Import snippets
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let importData;
    try {
      importData = JSON.parse(req.file.buffer.toString('utf8'));
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON file format' });
    }

    // Validate import data
    const validation = exportImportService.validateImportData(importData);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Import validation failed',
        details: validation.errors,
        warnings: validation.warnings
      });
    }

    // Parse import options from request body
    const options = {
      overwriteExisting: req.body.overwriteExisting === 'true',
      skipDuplicates: req.body.skipDuplicates !== 'false', // default true
      preserveIds: req.body.preserveIds === 'true'
    };

    // Perform import
    const results = await exportImportService.importFromJSON(importData, options);

    res.json({
      message: 'Import completed',
      results: results,
      validation: {
        warnings: validation.warnings,
        stats: validation.stats
      }
    });

  } catch (error) {
    console.error('Error importing snippets:', error);
    res.status(500).json({ error: `Import failed: ${error.message}` });
  }
});

// POST /api/snippets/validate-import - Validate import file without importing
router.post('/validate-import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let importData;
    try {
      importData = JSON.parse(req.file.buffer.toString('utf8'));
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON file format' });
    }

    const validation = exportImportService.validateImportData(importData);
    
    res.json(validation);

  } catch (error) {
    console.error('Error validating import file:', error);
    res.status(500).json({ error: 'Failed to validate import file' });
  }
});

module.exports = router;
