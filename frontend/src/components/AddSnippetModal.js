import React, { useState, useEffect } from 'react';
import api from '../api';
import { validateSnippet, generateTagColor } from '../utils';

const AddSnippetModal = ({ snippet, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    language: 'javascript',
    source: '',
    tags: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');

  const isEditing = Boolean(snippet);

  // Languages list
  const languages = [
    'javascript', 'typescript', 'python', 'rust', 'go', 'java',
    'c++', 'c#', 'php', 'ruby', 'css', 'html', 'sql', 'json',
    'yaml', 'markdown', 'bash', 'powershell', 'dockerfile', 'text'
  ];

  // Initialize form with snippet data if editing
  useEffect(() => {
    if (snippet) {
      setFormData({
        title: snippet.title || '',
        content: snippet.content || '',
        language: snippet.language || 'javascript',
        source: snippet.source || '',
        tags: snippet.tags || []
      });
    }
  }, [snippet]);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await api.tags.getAll();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Get tag suggestions based on content
  useEffect(() => {
    const getSuggestions = async () => {
      if (formData.content.length > 10) {
        try {
          const suggestions = await api.tags.getSuggestions(formData.content, formData.language);
          setTagSuggestions(suggestions.filter(s => !formData.tags.some(t => t.name === s)));
        } catch (error) {
          console.error('Error getting tag suggestions:', error);
        }
      }
    };
    
    const timeoutId = setTimeout(getSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.content, formData.language, formData.tags]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleAddTag = (tagName, color = null) => {
    if (!tagName.trim()) return;
    
    const tagExists = formData.tags.some(tag => 
      tag.name.toLowerCase() === tagName.toLowerCase()
    );
    
    if (!tagExists) {
      const newTag = {
        id: `temp-${Date.now()}`,
        name: tagName.trim(),
        color: color || generateTagColor()
      };
      
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
    }
    
    setNewTagInput('');
  };

  const handleRemoveTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.id !== tagId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateSnippet(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        tags: formData.tags.map(tag => tag.name)
      };

      if (isEditing) {
        await api.snippets.update(snippet.id, submitData);
      } else {
        await api.snippets.create(submitData);
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving snippet:', error);
      setErrors({ submit: 'Failed to save snippet. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-snippet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Snippet' : 'Add New Snippet'}</h2>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errors.submit && (
            <div className="error-message mb-4 p-3 bg-error text-white rounded">
              {errors.submit}
            </div>
          )}

          {/* Title */}
          <div className="form-group mb-4">
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              className={`input ${errors.title ? 'error' : ''}`}
              placeholder="Enter snippet title..."
              value={formData.title}
              onChange={handleInputChange}
              required
            />
            {errors.title && (
              <div className="error-text text-error text-sm mt-1">{errors.title}</div>
            )}
          </div>

          {/* Language */}
          <div className="form-group mb-4">
            <label className="form-label">Language *</label>
            <select
              name="language"
              className={`input ${errors.language ? 'error' : ''}`}
              value={formData.language}
              onChange={handleInputChange}
              required
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
            {errors.language && (
              <div className="error-text text-error text-sm mt-1">{errors.language}</div>
            )}
          </div>

          {/* Content */}
          <div className="form-group mb-4">
            <label className="form-label">Content *</label>
            <textarea
              name="content"
              className={`input textarea ${errors.content ? 'error' : ''}`}
              placeholder="Paste your code or AI response here..."
              value={formData.content}
              onChange={handleInputChange}
              rows="12"
              required
            />
            {errors.content && (
              <div className="error-text text-error text-sm mt-1">{errors.content}</div>
            )}
          </div>

          {/* Source */}
          <div className="form-group mb-4">
            <label className="form-label">Source</label>
            <input
              type="text"
              name="source"
              className="input"
              placeholder="e.g., Stack Overflow, Documentation, etc."
              value={formData.source}
              onChange={handleInputChange}
            />
          </div>

          {/* Tags */}
          <div className="form-group mb-4">
            <label className="form-label">Tags</label>
            
            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div className="selected-tags flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span 
                    key={tag.id}
                    className="badge badge-primary flex items-center gap-1"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleRemoveTag(tag.id)}
                      style={{ padding: '0 2px', minWidth: 'auto' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add New Tag */}
            <div className="add-tag-input flex gap-2 mb-3">
              <input
                type="text"
                className="input"
                placeholder="Add a tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(newTagInput);
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleAddTag(newTagInput)}
              >
                Add
              </button>
            </div>

            {/* Tag Suggestions */}
            {tagSuggestions.length > 0 && (
              <div className="tag-suggestions">
                <div className="text-sm text-muted mb-2">Suggestions:</div>
                <div className="flex flex-wrap gap-2">
                  {tagSuggestions.slice(0, 6).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleAddTag(suggestion)}
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Tags */}
            {availableTags.length > 0 && (
              <div className="popular-tags mt-3">
                <div className="text-sm text-muted mb-2">Popular tags:</div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.slice(0, 8).map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleAddTag(tag.name, tag.color)}
                    >
                      + {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions flex justify-end gap-3 pt-4">
            <button 
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading && <div className="spinner mr-2"></div>}
              {isEditing ? 'Update Snippet' : 'Create Snippet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSnippetModal;