-- MySnippetHub Database Schema
-- SQLite database schema for snippet management

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Create snippets table
CREATE TABLE IF NOT EXISTS snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'text',
    source TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#6B7280',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create snippet_tags junction table
CREATE TABLE IF NOT EXISTS snippet_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snippet_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(snippet_id, tag_id)
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snippet_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
    UNIQUE(snippet_id)
);

-- Create versions table for snippet history
CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snippet_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL,
    source TEXT,
    version_number INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON snippets(created_at);
CREATE INDEX IF NOT EXISTS idx_snippet_tags_snippet_id ON snippet_tags(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_tags_tag_id ON snippet_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_versions_snippet_id ON versions(snippet_id);

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_snippets_updated_at
    AFTER UPDATE ON snippets
    FOR EACH ROW
BEGIN
    UPDATE snippets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create trigger to save version history when snippet is updated
CREATE TRIGGER IF NOT EXISTS save_snippet_version
    AFTER UPDATE ON snippets
    FOR EACH ROW
    WHEN OLD.content != NEW.content OR OLD.title != NEW.title
BEGIN
    INSERT INTO versions (snippet_id, title, content, language, source, version_number)
    VALUES (OLD.id, OLD.title, OLD.content, OLD.language, OLD.source, OLD.version);
    
    UPDATE snippets SET version = version + 1 WHERE id = NEW.id;
END;