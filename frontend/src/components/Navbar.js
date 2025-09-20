import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import ExportModal from './ExportModal';
import ImportModal from './ImportModal';

const Navbar = ({ selectedSnippets = [], onImportSuccess }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportSuccess = (results) => {
    if (onImportSuccess) {
      onImportSuccess(results);
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Brand */}
          <div className="navbar-brand">
            <div className="brand-logo">
              <span className="brand-symbol">{'<>'}</span>
            </div>
            <h1 className="brand-text">
              My<span className="text-accent">Snippet</span><span className="text-purple">Hub</span>
            </h1>
          </div>

          {/* Navigation Items */}
          <div className="navbar-nav">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <span className="nav-text">📝 Dashboard</span>
            </NavLink>
            <NavLink 
              to="/analytics" 
              className={({ isActive }) => 
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <span className="nav-text">📊 Analytics</span>
            </NavLink>
          </div>

          {/* Export/Import Actions */}
          <div className="navbar-actions">
            <button 
              className="btn btn-outline btn-sm navbar-btn"
              onClick={() => setShowExportModal(true)}
              title="Export snippets to JSON or Markdown"
            >
              📤 Export
            </button>
            <button 
              className="btn btn-secondary btn-sm navbar-btn"
              onClick={() => setShowImportModal(true)}
              title="Import snippets from file"
            >
              📥 Import
            </button>
          </div>

          {/* Version Badge */}
          <div className="navbar-end">
            <span className="badge">v1.1.0</span>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        selectedSnippets={selectedSnippets}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </nav>
  );
};

export default Navbar;