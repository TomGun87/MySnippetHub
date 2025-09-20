import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { debounce, searchSnippets, filterSnippets, sortSnippets } from '../utils';
import SnippetCard from './SnippetCard';
import AddSnippetModal from './AddSnippetModal';

const Dashboard = () => {
  // State
  const [snippets, setSnippets] = useState([]);
  const [filteredSnippets, setFilteredSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    try {
      await api.snippets.delete(snippetId);
      await fetchSnippets();
    } catch (err) {
      console.error('Error deleting snippet:', err);
    }
  };

  const handleToggleFavorite = async (snippetId) => {
    try {
      await api.favorites.toggle(snippetId);
      await fetchSnippets();
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleSnippetSaved = async () => {
    setShowAddModal(false);
    setEditingSnippet(null);
    await fetchSnippets();
  };

  // Effects
  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

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
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAddModal(true)}
            >
              ✨ Add AI Response
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
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

      {/* Basic Filter Buttons */}
      <div className="filter-buttons flex gap-2 mb-6">
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
        <div className="modal-overlay" onClick={() => setSelectedSnippet(null)}>
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
            
            <pre className="bg-tertiary p-4 rounded mb-4 overflow-auto max-h-96">
              <code>{selectedSnippet.content}</code>
            </pre>

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
              <button className="btn btn-secondary">
                ✏️ Edit
              </button>
              <button className="btn btn-ghost">
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