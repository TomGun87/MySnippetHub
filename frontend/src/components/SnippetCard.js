import React from 'react';
import { getLanguageColor, getCodePreview, formatDate, copyToClipboard } from '../utils';

const SnippetCard = ({ 
  snippet, 
  onClick, 
  onEdit, 
  onDelete, 
  onToggleFavorite 
}) => {
  const handleCopy = (e) => {
    e.stopPropagation();
    copyToClipboard(snippet.content, `Copied "${snippet.title}" to clipboard!`);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${snippet.title}"?`)) {
      onDelete();
    }
  };

  return (
    <div className="card snippet-card" onClick={onClick}>
      <div className="card-header">
        <div className="flex justify-between items-start mb-2">
          <h3 className="card-title">{snippet.title}</h3>
          <div className="snippet-actions flex gap-1">
            <button
              className={`btn btn-sm btn-ghost ${snippet.is_favorite ? 'text-accent' : ''}`}
              onClick={handleFavorite}
              title={snippet.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {snippet.is_favorite ? '⭐' : '🤍'}
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <span 
            className="badge badge-primary"
            style={{ backgroundColor: getLanguageColor(snippet.language) }}
          >
            {snippet.language}
          </span>
          <span className="text-sm text-muted">
            {formatDate(snippet.created_at)}
          </span>
        </div>
      </div>
      
      <div className="code-preview mb-4">
        <pre className="text-sm">
          <code>{getCodePreview(snippet.content, 4)}</code>
        </pre>
      </div>

      <div className="card-footer">
        <div className="flex justify-between items-center">
          <div className="tags flex gap-1 flex-wrap">
            {snippet.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag.id} 
                className="badge text-xs"
                style={{ 
                  backgroundColor: tag.color,
                  color: '#ffffff'
                }}
              >
                {tag.name}
              </span>
            ))}
            {snippet.tags.length > 3 && (
              <span className="badge text-xs">
                +{snippet.tags.length - 3}
              </span>
            )}
          </div>
          
          <div className="card-actions flex gap-1">
            <button 
              className="btn btn-sm btn-outline"
              onClick={handleEdit}
              title="Edit snippet"
            >
              ✏️
            </button>
            <button 
              className="btn btn-sm btn-ghost text-error"
              onClick={handleDelete}
              title="Delete snippet"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnippetCard;