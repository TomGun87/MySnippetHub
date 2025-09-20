const request = require('supertest');
const express = require('express');
const cors = require('cors');
const database = require('../db');

// Create test app
const createTestApp = () => {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // Import routes
  app.use('/api/snippets', require('../routes/snippets'));
  app.use('/api/tags', require('../routes/tags'));
  app.use('/api/favorites', require('../routes/favorites'));
  app.use('/api/analytics', require('../routes/analytics'));
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });
  
  return app;
};

let app;

beforeAll(async () => {
  // Initialize test database
  await database.connect();
  await database.initSchema();
  app = createTestApp();
});

afterAll(async () => {
  // Clean up database connection
  await database.close();
});

describe('API Health Check', () => {
  test('GET /health should return OK', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
  });
});

describe('Snippets API', () => {
  test('GET /api/snippets should return snippets array', async () => {
    const response = await request(app)
      .get('/api/snippets')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Check first snippet structure
    const snippet = response.body[0];
    expect(snippet).toHaveProperty('id');
    expect(snippet).toHaveProperty('title');
    expect(snippet).toHaveProperty('content');
    expect(snippet).toHaveProperty('language');
    expect(snippet).toHaveProperty('tags');
    expect(Array.isArray(snippet.tags)).toBe(true);
  });

  test('POST /api/snippets should create new snippet', async () => {
    const newSnippet = {
      title: 'Test Snippet',
      content: 'console.log("Hello, World!");',
      language: 'javascript',
      source: 'Test Suite',
      tags: ['test', 'javascript']
    };

    const response = await request(app)
      .post('/api/snippets')
      .send(newSnippet)
      .expect(201);
    
    expect(response.body.title).toBe(newSnippet.title);
    expect(response.body.content).toBe(newSnippet.content);
    expect(response.body.language).toBe(newSnippet.language);
    expect(response.body.id).toBeDefined();
  });

  test('POST /api/snippets should validate required fields', async () => {
    const invalidSnippet = {
      title: '', // Empty title
      content: '',
      language: ''
    };

    const response = await request(app)
      .post('/api/snippets')
      .send(invalidSnippet)
      .expect(400);
    
    expect(response.body.errors).toBeDefined();
  });

  test('GET /api/snippets/:id should return specific snippet', async () => {
    // First create a snippet
    const newSnippet = {
      title: 'Get Test Snippet',
      content: 'const test = true;',
      language: 'javascript',
      tags: ['test']
    };

    const createResponse = await request(app)
      .post('/api/snippets')
      .send(newSnippet)
      .expect(201);
    
    const snippetId = createResponse.body.id;

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/api/snippets/${snippetId}`)
      .expect(200);
    
    expect(getResponse.body.id).toBe(snippetId);
    expect(getResponse.body.title).toBe(newSnippet.title);
  });

  test('GET /api/snippets/:id should return 404 for non-existent snippet', async () => {
    await request(app)
      .get('/api/snippets/99999')
      .expect(404);
  });

  test('PUT /api/snippets/:id should update snippet', async () => {
    // First create a snippet
    const newSnippet = {
      title: 'Update Test Snippet',
      content: 'const original = true;',
      language: 'javascript',
      tags: ['test']
    };

    const createResponse = await request(app)
      .post('/api/snippets')
      .send(newSnippet)
      .expect(201);
    
    const snippetId = createResponse.body.id;

    // Update it
    const updatedData = {
      title: 'Updated Test Snippet',
      content: 'const updated = true;',
      language: 'typescript',
      tags: ['test', 'updated']
    };

    const updateResponse = await request(app)
      .put(`/api/snippets/${snippetId}`)
      .send(updatedData)
      .expect(200);
    
    expect(updateResponse.body.title).toBe(updatedData.title);
    expect(updateResponse.body.content).toBe(updatedData.content);
    expect(updateResponse.body.language).toBe(updatedData.language);
  });
});

describe('Tags API', () => {
  test('GET /api/tags should return tags array', async () => {
    const response = await request(app)
      .get('/api/tags')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    
    if (response.body.length > 0) {
      const tag = response.body[0];
      expect(tag).toHaveProperty('id');
      expect(tag).toHaveProperty('name');
      expect(tag).toHaveProperty('color');
      expect(tag).toHaveProperty('usage_count');
    }
  });

  test('POST /api/tags should create new tag', async () => {
    const newTag = {
      name: 'test-tag',
      color: '#FF5733'
    };

    const response = await request(app)
      .post('/api/tags')
      .send(newTag)
      .expect(201);
    
    expect(response.body.name).toBe(newTag.name);
    expect(response.body.color).toBe(newTag.color);
  });

  test('GET /api/tags/suggestions should return suggestions', async () => {
    const response = await request(app)
      .get('/api/tags/suggestions?content=const test = true;&language=javascript')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('Favorites API', () => {
  test('GET /api/favorites should return favorites array', async () => {
    const response = await request(app)
      .get('/api/favorites')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/favorites/toggle/:id should toggle favorite status', async () => {
    // First create a snippet
    const newSnippet = {
      title: 'Favorite Test Snippet',
      content: 'const favorite = true;',
      language: 'javascript',
      tags: ['test']
    };

    const createResponse = await request(app)
      .post('/api/snippets')
      .send(newSnippet)
      .expect(201);
    
    const snippetId = createResponse.body.id;

    // Toggle favorite
    const toggleResponse = await request(app)
      .post(`/api/favorites/toggle/${snippetId}`)
      .expect(200);
    
    expect(toggleResponse.body.is_favorite).toBeDefined();
    expect(toggleResponse.body.snippet_id).toBe(snippetId);
  });
});

describe('Analytics API', () => {
  test('GET /api/analytics should return analytics data', async () => {
    const response = await request(app)
      .get('/api/analytics')
      .expect(200);
    
    expect(response.body).toHaveProperty('summary');
    expect(response.body).toHaveProperty('language_distribution');
    expect(response.body).toHaveProperty('popular_tags');
    
    expect(response.body.summary).toHaveProperty('total_snippets');
    expect(response.body.summary).toHaveProperty('total_tags');
    expect(response.body.summary).toHaveProperty('total_favorites');
    
    expect(Array.isArray(response.body.language_distribution)).toBe(true);
    expect(Array.isArray(response.body.popular_tags)).toBe(true);
  });

  test('GET /api/analytics/languages should return language statistics', async () => {
    const response = await request(app)
      .get('/api/analytics/languages')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /api/analytics/trends should return trends data', async () => {
    const response = await request(app)
      .get('/api/analytics/trends')
      .expect(200);
    
    expect(response.body).toHaveProperty('period_days');
    expect(response.body).toHaveProperty('creation_trend');
    expect(response.body).toHaveProperty('favorites_trend');
    expect(response.body).toHaveProperty('language_trend');
  });
});