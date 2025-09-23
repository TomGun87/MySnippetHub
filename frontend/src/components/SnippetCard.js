import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { getLanguageColor, getCodePreview, formatDate, copyToClipboard, getContrastTextColor } from '../utils';

const SnippetCard = ({ 
  snippet, 
  isSelected = false,
  onSelect,
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

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect?.(!isSelected);
  };

  const handleCheckboxKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onSelect?.(!isSelected);
    }
  };

  return (
    <div className={`card snippet-card ${isSelected ? 'snippet-card-selected' : ''}`} onClick={onClick}>
      <div className="card-header">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {onSelect && (
              <div
                className={`custom-checkbox ${isSelected ? 'custom-checkbox-checked' : ''}`}
                onClick={handleSelect}
                onKeyDown={handleCheckboxKeyDown}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                title={isSelected ? 'Deselect snippet' : 'Select snippet'}
              >
                <div className="checkbox-inner">
                  {isSelected && (
                    <svg 
                      className="checkbox-check" 
                      viewBox="0 0 16 16" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        d="M13.5 4.5L6 12L2.5 8.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
            )}
            <h3 className="card-title">{snippet.title}</h3>
          </div>
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
            style={{ 
              backgroundColor: getLanguageColor(snippet.language),
              color: getContrastTextColor(getLanguageColor(snippet.language))
            }}
          >
            {snippet.language}
          </span>
          <span className="text-sm text-muted">
            {formatDate(snippet.created_at)}
          </span>
        </div>
      </div>
      
      <div className="code-preview mb-4">
        <Highlight
          theme={themes.vsDark}
          code={getCodePreview(snippet.content, 4)}
          language={snippet.language || 'text'}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre 
              className={`${className} card-code-preview`}
              style={{
                ...style,
                margin: 0,
                padding: 'var(--space-sm)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: '1.5',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                position: 'relative'
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

      <div className="card-footer">
        <div className="flex justify-between items-center">
          <div className="tags flex gap-1 flex-wrap">
            {snippet.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag.id} 
                className="badge text-xs"
                style={{ 
                  backgroundColor: tag.color,
                  color: getContrastTextColor(tag.color)
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