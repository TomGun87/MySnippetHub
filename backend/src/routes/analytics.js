const express = require('express');
const database = require('../db');

const router = express.Router();

// GET /api/analytics - Get comprehensive analytics
router.get('/', async (req, res) => {
  try {
    // Basic counts
    const totalSnippets = await database.get('SELECT COUNT(*) as count FROM snippets');
    const totalTags = await database.get('SELECT COUNT(*) as count FROM tags');
    const totalFavorites = await database.get('SELECT COUNT(*) as count FROM favorites');

    // Language distribution
    const languageStats = await database.all(`
      SELECT language, COUNT(*) as count
      FROM snippets
      GROUP BY language
      ORDER BY count DESC
    `);

    // Most popular tags
    const popularTags = await database.all(`
      SELECT t.name, t.color, COUNT(st.snippet_id) as usage_count
      FROM tags t
      LEFT JOIN snippet_tags st ON t.id = st.tag_id
      GROUP BY t.id
      ORDER BY usage_count DESC
      LIMIT 10
    `);

    // Recent activity (snippets created in last 30 days)
    const recentActivity = await database.all(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM snippets
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Top favorited snippets
    const topFavorites = await database.all(`
      SELECT s.id, s.title, s.language, COUNT(f.snippet_id) as favorite_count
      FROM snippets s
      JOIN favorites f ON s.id = f.snippet_id
      GROUP BY s.id
      ORDER BY favorite_count DESC
      LIMIT 5
    `);

    // Snippets with most versions (most edited)
    const mostEdited = await database.all(`
      SELECT s.id, s.title, s.language, s.version
      FROM snippets s
      ORDER BY s.version DESC
      LIMIT 5
    `);

    // Monthly growth
    const monthlyGrowth = await database.all(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM snippets
      WHERE created_at >= datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `);

    const analytics = {
      summary: {
        total_snippets: totalSnippets.count,
        total_tags: totalTags.count,
        total_favorites: totalFavorites.count
      },
      language_distribution: languageStats.map(stat => ({
        name: stat.language,
        value: stat.count,
        percentage: ((stat.count / totalSnippets.count) * 100).toFixed(1)
      })),
      popular_tags: popularTags.map(tag => ({
        name: tag.name,
        color: tag.color,
        count: tag.usage_count
      })),
      recent_activity: recentActivity,
      top_favorites: topFavorites,
      most_edited: mostEdited,
      monthly_growth: monthlyGrowth
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/languages - Get detailed language statistics
router.get('/languages', async (req, res) => {
  try {
    const languageStats = await database.all(`
      SELECT 
        s.language,
        COUNT(*) as snippet_count,
        COUNT(DISTINCT t.id) as unique_tags,
        COUNT(f.snippet_id) as favorite_count,
        AVG(s.version) as avg_versions,
        MAX(s.created_at) as last_used
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN favorites f ON s.id = f.snippet_id
      GROUP BY s.language
      ORDER BY snippet_count DESC
    `);

    // Get most common tags for each language
    const languageDetails = await Promise.all(
      languageStats.map(async (lang) => {
        const topTags = await database.all(`
          SELECT t.name, COUNT(*) as count
          FROM tags t
          JOIN snippet_tags st ON t.id = st.tag_id
          JOIN snippets s ON st.snippet_id = s.id
          WHERE s.language = ?
          GROUP BY t.id
          ORDER BY count DESC
          LIMIT 3
        `, [lang.language]);

        return {
          ...lang,
          top_tags: topTags
        };
      })
    );

    res.json(languageDetails);
  } catch (error) {
    console.error('Error fetching language analytics:', error);
    res.status(500).json({ error: 'Failed to fetch language analytics' });
  }
});

// GET /api/analytics/trends - Get trending data
router.get('/trends', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Daily snippet creation trend
    const creationTrend = await database.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as snippets_created
      FROM snippets
      WHERE created_at >= datetime('now', '-${period} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Favorites trend
    const favoritesTrend = await database.all(`
      SELECT 
        DATE(f.created_at) as date,
        COUNT(*) as favorites_added
      FROM favorites f
      WHERE f.created_at >= datetime('now', '-${period} days')
      GROUP BY DATE(f.created_at)
      ORDER BY date ASC
    `);

    // Language popularity trend
    const languageTrend = await database.all(`
      SELECT 
        DATE(created_at) as date,
        language,
        COUNT(*) as count
      FROM snippets
      WHERE created_at >= datetime('now', '-${period} days')
      GROUP BY DATE(created_at), language
      ORDER BY date ASC, count DESC
    `);

    res.json({
      period_days: parseInt(period),
      creation_trend: creationTrend,
      favorites_trend: favoritesTrend,
      language_trend: languageTrend
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GET /api/analytics/search-insights - Get insights for search optimization
router.get('/search-insights', async (req, res) => {
  try {
    // Most common words in snippet titles
    const titleWords = await database.all(`
      SELECT 
        LOWER(TRIM(word)) as word,
        COUNT(*) as frequency
      FROM (
        SELECT value as word 
        FROM snippets, json_each('["' || replace(replace(title, ' ', '","'), '-', '","') || '"]')
        WHERE length(value) > 2
      )
      GROUP BY LOWER(TRIM(word))
      HAVING frequency > 1
      ORDER BY frequency DESC
      LIMIT 20
    `);

    // Snippets without tags
    const untaggedCount = await database.get(`
      SELECT COUNT(*) as count
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      WHERE st.snippet_id IS NULL
    `);

    // Average tags per snippet
    const avgTags = await database.get(`
      SELECT AVG(tag_count) as avg_tags
      FROM (
        SELECT s.id, COUNT(st.tag_id) as tag_count
        FROM snippets s
        LEFT JOIN snippet_tags st ON s.id = st.snippet_id
        GROUP BY s.id
      )
    `);

    res.json({
      common_title_words: titleWords,
      untagged_snippets: untaggedCount.count,
      average_tags_per_snippet: parseFloat(avgTags.avg_tags || 0).toFixed(2)
    });
  } catch (error) {
    console.error('Error fetching search insights:', error);
    res.status(500).json({ error: 'Failed to fetch search insights' });
  }
});

module.exports = router;