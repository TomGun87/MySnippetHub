import React, { useState } from 'react';
import api from '../api';
import { saveAs } from 'file-saver';

const ExportModal = ({ isOpen, onClose, selectedSnippets = [] }) => {
  const [format, setFormat] = useState('json');
  const [exportType, setExportType] = useState('all'); // 'all' or 'selected'
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setLoading(true);
      
      const snippetIds = exportType === 'selected' ? selectedSnippets.map(s => s.id) : [];
      const response = await api.snippets.export(format, snippetIds);
      
      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `mysnippethub-export-${new Date().toISOString().slice(0, 10)}.${format === 'json' ? 'json' : 'md'}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Get blob data and save file
      const blob = await response.blob();
      saveAs(blob, filename);

      // Show success message based on export type
      const count = exportType === 'selected' ? selectedSnippets.length : 'all';
      const message = `Successfully exported ${count} snippet${count !== 1 && count !== 'all' ? 's' : ''} as ${format.toUpperCase()}`;
      
      // Use toast through api service or directly
      if (window.toast) {
        window.toast.success(message);
      } else {
        console.log(message);
      }

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      if (window.toast) {
        window.toast.error(`Export failed: ${error.message}`);
      } else {
        alert(`Export failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    }}>
      <div className="modal export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Snippets</h2>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={handleClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Export Type Selection */}
          <div className="form-group mb-4">
            <label className="form-label">What to Export</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportType === 'all'}
                  onChange={(e) => setExportType(e.target.value)}
                  disabled={loading}
                />
                <span>All snippets</span>
              </label>
              <label className={`radio-option ${selectedSnippets.length === 0 ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="exportType"
                  value="selected"
                  checked={exportType === 'selected'}
                  onChange={(e) => setExportType(e.target.value)}
                  disabled={loading || selectedSnippets.length === 0}
                />
                <span>Selected snippets ({selectedSnippets.length})</span>
              </label>
            </div>
            {selectedSnippets.length === 0 && (
              <p className="text-muted text-sm mt-2">
                Select snippets in the dashboard to enable selective export
              </p>
            )}
          </div>

          {/* Format Selection */}
          <div className="form-group mb-4">
            <label className="form-label">Export Format</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value)}
                  disabled={loading}
                />
                <div className="format-option">
                  <span className="format-title">JSON</span>
                  <span className="format-description">
                    Complete data with metadata - can be re-imported
                  </span>
                </div>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="format"
                  value="md"
                  checked={format === 'md'}
                  onChange={(e) => setFormat(e.target.value)}
                  disabled={loading}
                />
                <div className="format-option">
                  <span className="format-title">Markdown</span>
                  <span className="format-description">
                    Human-readable format for documentation
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Export Preview */}
          <div className="export-preview">
            <h4 className="text-sm font-medium mb-2">Export Summary</h4>
            <div className="preview-details">
              <div className="detail-item">
                <span className="label">Snippets:</span>
                <span className="value">
                  {exportType === 'all' ? 'All snippets' : `${selectedSnippets.length} selected`}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Format:</span>
                <span className="value">{format.toUpperCase()}</span>
              </div>
              <div className="detail-item">
                <span className="label">File name:</span>
                <span className="value">
                  mysnippethub-export-{new Date().toISOString().slice(0, 10)}.{format === 'json' ? 'json' : 'md'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            type="button"
            className="btn btn-ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="button"
            className={`btn btn-primary ${loading ? 'loading' : ''}`}
            onClick={handleExport}
            disabled={loading || (exportType === 'selected' && selectedSnippets.length === 0)}
          >
            {loading && <div className="spinner mr-2"></div>}
            {loading ? 'Exporting...' : `Export ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;