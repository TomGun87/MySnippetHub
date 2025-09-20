const path = require('path');
const fs = require('fs/promises');
const db = require('../db');

/**
 * Export Service for MySnippetHub
 * Handles JSON and Markdown export/import functionality
 */

class ExportImportService {
  /**
   * Export snippets to JSON format
   * @param {Array} snippetIds - Array of snippet IDs to export (empty = all)
   * @returns {Object} Export data object
   */
  async exportToJSON(snippetIds = []) {
    try {
      let query = `
        SELECT 
          s.id,
          s.title,
          s.content,
          s.language,
          s.source,
          s.version,
          s.created_at,
          s.updated_at,
          GROUP_CONCAT(t.name) as tag_names,
          GROUP_CONCAT(t.color) as tag_colors,
          CASE WHEN f.snippet_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
        FROM snippets s
        LEFT JOIN snippet_tags st ON s.id = st.snippet_id
        LEFT JOIN tags t ON st.tag_id = t.id
        LEFT JOIN favorites f ON s.id = f.snippet_id
      `;

      const params = [];
      
      if (snippetIds && snippetIds.length > 0) {
        const placeholders = snippetIds.map(() => '?').join(',');
        query += ` WHERE s.id IN (${placeholders})`;
        params.push(...snippetIds);
      }

      query += ` GROUP BY s.id ORDER BY s.created_at DESC`;

      const rows = await db.all(query, params);

      const snippets = rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        language: row.language,
        source: row.source,
        version: row.version,
        created_at: row.created_at,
        updated_at: row.updated_at,
        is_favorite: Boolean(row.is_favorite),
        tags: row.tag_names ? row.tag_names.split(',').map((name, index) => ({
          name: name.trim(),
          color: row.tag_colors ? row.tag_colors.split(',')[index]?.trim() : '#6B7280'
        })) : []
      }));

      return {
        version: '1.1.0',
        export_date: new Date().toISOString(),
        total_snippets: snippets.length,
        snippets: snippets,
        metadata: {
          exported_by: 'MySnippetHub',
          format: 'json',
          schema_version: '1.0'
        }
      };
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Failed to export snippets to JSON');
    }
  }

  /**
   * Export snippets to Markdown format
   * @param {Array} snippetIds - Array of snippet IDs to export (empty = all)
   * @returns {String} Markdown content
   */
  async exportToMarkdown(snippetIds = []) {
    try {
      const exportData = await this.exportToJSON(snippetIds);
      const { snippets } = exportData;

      let markdown = `# MySnippetHub Export\n\n`;
      markdown += `**Export Date:** ${new Date().toLocaleDateString()}\n`;
      markdown += `**Total Snippets:** ${snippets.length}\n\n`;
      markdown += `---\n\n`;

      for (const snippet of snippets) {
        markdown += `## ${snippet.title}\n\n`;
        
        // Metadata
        markdown += `**Language:** ${snippet.language}\n`;
        if (snippet.source) {
          markdown += `**Source:** ${snippet.source}\n`;
        }
        markdown += `**Created:** ${new Date(snippet.created_at).toLocaleDateString()}\n`;
        if (snippet.is_favorite) {
          markdown += `**Favorite:** ⭐\n`;
        }
        if (snippet.tags.length > 0) {
          markdown += `**Tags:** ${snippet.tags.map(tag => `\`${tag.name}\``).join(', ')}\n`;
        }
        markdown += `\n`;

        // Code block
        markdown += `\`\`\`${snippet.language}\n`;
        markdown += `${snippet.content}\n`;
        markdown += `\`\`\`\n\n`;
        markdown += `---\n\n`;
      }

      markdown += `*Exported from MySnippetHub v1.1.0*\n`;

      return markdown;
    } catch (error) {
      console.error('Error exporting to Markdown:', error);
      throw new Error('Failed to export snippets to Markdown');
    }
  }

  /**
   * Import snippets from JSON data
   * @param {Object} importData - JSON data to import
   * @param {Object} options - Import options
   * @returns {Object} Import results
   */
  async importFromJSON(importData, options = {}) {
    const { 
      overwriteExisting = false, 
      skipDuplicates = true,
      preserveIds = false 
    } = options;

    const results = {
      success: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    try {
      // Validate import data structure
      if (!importData.snippets || !Array.isArray(importData.snippets)) {
        throw new Error('Invalid import data format: missing snippets array');
      }

      await db.run('BEGIN TRANSACTION');

      for (const snippetData of importData.snippets) {
        try {
          await this.importSingleSnippet(snippetData, {
            overwriteExisting,
            skipDuplicates,
            preserveIds
          });
          results.success++;
          results.details.push({
            title: snippetData.title,
            status: 'imported',
            message: 'Successfully imported'
          });
        } catch (error) {
          results.errors++;
          results.details.push({
            title: snippetData.title,
            status: 'error',
            message: error.message
          });
          
          // Continue processing other snippets
          console.error(`Error importing snippet "${snippetData.title}":`, error);
        }
      }

      await db.run('COMMIT');

      return results;
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error importing from JSON:', error);
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Import a single snippet
   * @private
   */
  async importSingleSnippet(snippetData, options) {
    const { overwriteExisting, skipDuplicates, preserveIds } = options;

    // Validate required fields
    if (!snippetData.title || !snippetData.content) {
      throw new Error('Missing required fields: title or content');
    }

    // Check for existing snippet by title and content
    const existingSnippet = await db.get(
      'SELECT id FROM snippets WHERE title = ? AND content = ?',
      [snippetData.title, snippetData.content]
    );

    if (existingSnippet) {
      if (skipDuplicates && !overwriteExisting) {
        throw new Error('Snippet already exists (skipped)');
      }
    }

    let snippetId;

    if (existingSnippet && overwriteExisting) {
      // Update existing snippet
      await db.run(`
        UPDATE snippets SET
          title = ?,
          content = ?,
          language = ?,
          source = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        snippetData.title,
        snippetData.content,
        snippetData.language || 'plaintext',
        snippetData.source || null,
        existingSnippet.id
      ]);
      snippetId = existingSnippet.id;
    } else if (!existingSnippet) {
      // Create new snippet
      const result = await db.run(`
        INSERT INTO snippets (title, content, language, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        snippetData.title,
        snippetData.content,
        snippetData.language || 'plaintext',
        snippetData.source || null
      ]);
      snippetId = result.lastID;
    }

    // Handle tags if present
    if (snippetData.tags && Array.isArray(snippetData.tags)) {
      // Remove existing tags
      await db.run('DELETE FROM snippet_tags WHERE snippet_id = ?', [snippetId]);

      // Add new tags
      for (const tagData of snippetData.tags) {
        if (typeof tagData === 'string') {
          await this.ensureTagExists(tagData);
          const tag = await db.get('SELECT id FROM tags WHERE name = ?', [tagData]);
          await db.run(
            'INSERT OR IGNORE INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)',
            [snippetId, tag.id]
          );
        } else if (tagData.name) {
          await this.ensureTagExists(tagData.name, tagData.color);
          const tag = await db.get('SELECT id FROM tags WHERE name = ?', [tagData.name]);
          await db.run(
            'INSERT OR IGNORE INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)',
            [snippetId, tag.id]
          );
        }
      }
    }

    // Handle favorites
    if (snippetData.is_favorite) {
      await db.run(
        'INSERT OR IGNORE INTO favorites (snippet_id, created_at) VALUES (?, CURRENT_TIMESTAMP)',
        [snippetId]
      );
    } else {
      await db.run('DELETE FROM favorites WHERE snippet_id = ?', [snippetId]);
    }

    return snippetId;
  }

  /**
   * Ensure tag exists in database
   * @private
   */
  async ensureTagExists(tagName, tagColor = '#6B7280') {
    const existingTag = await db.get('SELECT id FROM tags WHERE name = ?', [tagName]);
    if (!existingTag) {
      await db.run(
        'INSERT INTO tags (name, color, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [tagName, tagColor]
      );
    }
  }

  /**
   * Validate import file
   * @param {Object} data - Data to validate
   * @returns {Object} Validation results
   */
  validateImportData(data) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {
        totalSnippets: 0,
        validSnippets: 0,
        invalidSnippets: 0
      }
    };

    try {
      // Check basic structure
      if (!data || typeof data !== 'object') {
        validation.valid = false;
        validation.errors.push('Invalid file format: not a valid JSON object');
        return validation;
      }

      if (!data.snippets || !Array.isArray(data.snippets)) {
        validation.valid = false;
        validation.errors.push('Invalid file format: missing or invalid snippets array');
        return validation;
      }

      validation.stats.totalSnippets = data.snippets.length;

      // Check version compatibility
      if (data.version && !this.isVersionCompatible(data.version)) {
        validation.warnings.push(`Export version ${data.version} may not be fully compatible`);
      }

      // Validate each snippet
      data.snippets.forEach((snippet, index) => {
        const snippetErrors = this.validateSnippet(snippet, index);
        if (snippetErrors.length > 0) {
          validation.errors.push(...snippetErrors);
          validation.stats.invalidSnippets++;
        } else {
          validation.stats.validSnippets++;
        }
      });

      validation.valid = validation.errors.length === 0;

      return validation;
    } catch (error) {
      console.error('Error validating import data:', error);
      validation.valid = false;
      validation.errors.push(`Validation error: ${error.message}`);
      return validation;
    }
  }

  /**
   * Validate a single snippet
   * @private
   */
  validateSnippet(snippet, index) {
    const errors = [];

    if (!snippet.title || typeof snippet.title !== 'string') {
      errors.push(`Snippet ${index + 1}: Missing or invalid title`);
    }

    if (!snippet.content || typeof snippet.content !== 'string') {
      errors.push(`Snippet ${index + 1}: Missing or invalid content`);
    }

    if (snippet.language && typeof snippet.language !== 'string') {
      errors.push(`Snippet ${index + 1}: Invalid language field`);
    }

    if (snippet.tags && !Array.isArray(snippet.tags)) {
      errors.push(`Snippet ${index + 1}: Invalid tags field (must be array)`);
    }

    return errors;
  }

  /**
   * Check version compatibility
   * @private
   */
  isVersionCompatible(version) {
    const compatibleVersions = ['1.0.0', '1.1.0'];
    return compatibleVersions.includes(version);
  }
}

module.exports = new ExportImportService();