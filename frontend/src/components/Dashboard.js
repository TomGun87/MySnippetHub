import React, { useState, useEffect, useCallback } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import api from '../api';
import { debounce, searchSnippets, filterSnippets, sortSnippets } from '../utils';
import SnippetCard from './SnippetCard';
import AddSnippetModal from './AddSnippetModal';

const Dashboard = ({ selectedSnippets = [], onSnippetSelection, refreshKey }) => {
  // State
  const [snippets, setSnippets] = useState([]);
  const [filteredSnippets, setFilteredSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    language: 'all',
    tag: 'all',
    favorites: false,
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder] = useState('desc');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [editingSnippet, setEditingSnippet] = useState(null);

  // Fetch data
  const fetchSnippets = useCallback(async () => {
    try {
      setLoading(true);
      const snippetsData = await api.snippets.getAll();
      
      setSnippets(snippetsData);
      setError(null);
    } catch (err) {
      setError('Failed to load snippets. Make sure the backend server is running.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply all filters and search
  const applyFilters = useCallback((query, filterState, sort, order) => {
    let result = [...snippets];

    // Search
    if (query) {
      result = searchSnippets(result, query);
    }

    // Filters
    result = filterSnippets(result, filterState);

    // Sort
    result = sortSnippets(result, sort, order);

    setFilteredSnippets(result);
  }, [snippets]);

  // Debounced search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query) => {
      applyFilters(query, filters, sortBy, sortOrder);
    }, 300),
    [applyFilters, filters, sortBy, sortOrder]
  );

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle snippet actions
  const handleSnippetClick = (snippet) => {
    setSelectedSnippet(snippet);
  };

  const handleEditSnippet = (snippet) => {
    setEditingSnippet(snippet);
    setShowAddModal(true);
  };

  const handleDeleteSnippet = async (snippetId) => {
    if (actionLoading) return;
    
    if (!window.confirm('Are you sure you want to delete this snippet?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await api.snippets.delete(snippetId);
      await fetchSnippets();
    } catch (err) {
      console.error('Error deleting snippet:', err);
      alert('Failed to delete snippet. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFavorite = async (snippetId) => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      await api.favorites.toggle(snippetId);
      await fetchSnippets();
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSnippetSaved = async () => {
    setShowAddModal(false);
    setEditingSnippet(null);
    await fetchSnippets();
  };

  // Selection handlers
  const handleSnippetSelect = (snippet, isSelected) => {
    let newSelection;
    if (isSelected) {
      newSelection = [...selectedSnippets, snippet];
    } else {
      newSelection = selectedSnippets.filter(s => s.id !== snippet.id);
    }
    onSnippetSelection?.(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedSnippets.length === filteredSnippets.length) {
      onSnippetSelection?.([]);
    } else {
      onSnippetSelection?.(filteredSnippets);
    }
  };

  const handleClearSelection = () => {
    onSnippetSelection?.([]);
  };

  const isSnippetSelected = (snippet) => {
    return selectedSnippets.some(s => s.id === snippet.id);
  };

  // Effects
  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets, refreshKey]);

  useEffect(() => {
    applyFilters(searchQuery, filters, sortBy, sortOrder);
  }, [snippets, searchQuery, filters, sortBy, sortOrder, applyFilters]);

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <div className="loading-container text-center p-6">
          <div className="spinner mb-4"></div>
          <p className="text-muted">Loading snippets...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container">
        <div className="error-container text-center p-6">
          <h3 className="text-error mb-4">Connection Error</h3>
          <p className="text-muted mb-4">{error}</p>
          <p className="text-sm text-muted mb-4">
            Expected API at: {process.env.REACT_APP_API_URL || 'http://localhost:5000'}
          </p>
          <button className="btn btn-primary" onClick={fetchSnippets}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="dashboard-header mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold mb-2">My Snippets</h2>
            <p className="text-muted">
              {filteredSnippets.length} of {snippets.length} snippets
              {selectedSnippets.length > 0 && (
                <span className="text-accent ml-2">
                  • {selectedSnippets.length} selected
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAddModal(true)}
              disabled={actionLoading}
            >
              ✨ Add AI Response
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              disabled={actionLoading}
            >
              + Add Snippet
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar mb-6">
        <div className="search-container">
          <input
            type="text"
            className="input search-input"
            placeholder="Search snippets by title, content, language, or tags..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <div className="search-icon">
            🔍
          </div>
        </div>
      </div>

      {/* Filter and Selection Controls */}
      <div className="controls-bar flex justify-between items-center mb-6">
        <div className="filter-buttons flex gap-2">
          <button
            className={`btn btn-sm ${filters.favorites ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => {
              const newFilters = { ...filters, favorites: !filters.favorites };
              setFilters(newFilters);
              applyFilters(searchQuery, newFilters, sortBy, sortOrder);
            }}
          >
            ⭐ Favorites Only
          </button>
          <select
            className="input"
            style={{ width: 'auto', padding: '0.25rem 0.5rem' }}
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              applyFilters(searchQuery, filters, e.target.value, sortOrder);
            }}
          >
            <option value="created_at">Recently Added</option>
            <option value="updated_at">Recently Modified</option>
            <option value="title">Title A-Z</option>
            <option value="language">Language</option>
          </select>
        </div>
        
        {/* Selection Controls */}
        {filteredSnippets.length > 0 && (
          <div className="selection-controls flex gap-2">
            <button
              className="btn btn-sm btn-ghost"
              onClick={handleSelectAll}
              title={selectedSnippets.length === filteredSnippets.length ? 'Clear Selection' : 'Select All Visible'}
            >
              {selectedSnippets.length === filteredSnippets.length ? '☐' : '☑'} 
              {selectedSnippets.length === filteredSnippets.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedSnippets.length > 0 && (
              <button
                className="btn btn-sm btn-ghost text-muted"
                onClick={handleClearSelection}
                title="Clear Selection"
              >
                ✕ Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Snippets Grid or Empty State */}
      {filteredSnippets.length === 0 ? (
        <div className="empty-state text-center p-6">
          <div className="empty-icon mb-4">
            <span style={{ fontSize: '4rem', opacity: 0.5 }}>📝</span>
          </div>
          {snippets.length === 0 ? (
            <>
              <h3 className="mb-2">Welcome to MySnippetHub!</h3>
              <p className="text-muted mb-4">Create your first snippet to get started</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                Add Your First Snippet
              </button>
            </>
          ) : (
            <>
              <h3 className="mb-2">No snippets found</h3>
              <p className="text-muted mb-4">Try adjusting your search or filters</p>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ language: 'all', tag: 'all', favorites: false });
                }}
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="snippets-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSnippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              isSelected={isSnippetSelected(snippet)}
              onSelect={(isSelected) => handleSnippetSelect(snippet, isSelected)}
              onClick={() => handleSnippetClick(snippet)}
              onEdit={() => handleEditSnippet(snippet)}
              onDelete={() => handleDeleteSnippet(snippet.id)}
              onToggleFavorite={() => handleToggleFavorite(snippet.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Snippet Modal */}
      {showAddModal && (
        <AddSnippetModal
          snippet={editingSnippet}
          onClose={() => {
            setShowAddModal(false);
            setEditingSnippet(null);
          }}
          onSave={handleSnippetSaved}
        />
      )}

      {/* Simple Detail Modal Placeholder */}
      {selectedSnippet && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedSnippet(null);
          }
        }}>
          <div className="modal p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3>{selectedSnippet.title}</h3>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedSnippet(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <span className="badge badge-primary mr-2">{selectedSnippet.language}</span>
              {selectedSnippet.tags.map((tag) => (
                <span key={tag.id} className="badge mr-1">
                  {tag.name}
                </span>
              ))}
            </div>
            
            <div className="mb-4">
              <Highlight
                theme={themes.vsDark}
                code={selectedSnippet.content}
                language={selectedSnippet.language || 'text'}
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre 
                    className={`${className} modal-code-preview`}
                    style={{
                      ...style,
                      margin: 0,
                      padding: 'var(--space-md)',
                      fontSize: 'var(--font-size-sm)',
                      lineHeight: '1.6',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'auto',
                      maxHeight: '24rem',
                      border: '1px solid var(--border-primary)'
                    }}
                  >
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line, key: i })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token, key })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>

            <div className="flex gap-2">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  navigator.clipboard.writeText(selectedSnippet.content);
                  // Would show toast here
                }}
              >
                📋 Copy
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  handleEditSnippet(selectedSnippet);
                  setSelectedSnippet(null);
                }}
                disabled={actionLoading}
              >
                ✏️ Edit
              </button>
              <button 
                className={`btn btn-ghost ${actionLoading ? 'loading' : ''}`}
                onClick={() => {
                  handleToggleFavorite(selectedSnippet.id);
                  setSelectedSnippet(null);
                }}
                disabled={actionLoading}
              >
                {actionLoading && <div className="spinner mr-2"></div>}
                {selectedSnippet.is_favorite ? '💙' : '🤍'} Favorite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;