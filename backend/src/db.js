const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || './database.sqlite';
  }

  // Initialize database connection
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.db.run('PRAGMA foreign_keys = ON');
          resolve();
        }
      });
    });
  }

  // Initialize database schema
  async initSchema() {
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const seedPath = path.join(__dirname, '../../db/seed.sql');

    try {
      // Read and execute schema
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await this.exec(schema);
      console.log('Database schema initialized');

      // Check if we need to seed the database
      const snippetCount = await this.get('SELECT COUNT(*) as count FROM snippets');
      if (snippetCount.count === 0) {
        const seedData = fs.readFileSync(seedPath, 'utf8');
        await this.exec(seedData);
        console.log('Database seeded with sample data');
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // Execute SQL statement
  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Run SQL with parameters (INSERT, UPDATE, DELETE)
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  // Get single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Get all rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Begin transaction
  async beginTransaction() {
    await this.run('BEGIN TRANSACTION');
  }

  // Commit transaction
  async commit() {
    await this.run('COMMIT');
  }

  // Rollback transaction
  async rollback() {
    await this.run('ROLLBACK');
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;