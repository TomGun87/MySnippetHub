import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './theme.css';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Navbar from './components/Navbar';

function App() {
  const [selectedSnippets, setSelectedSnippets] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSnippetSelection = (snippets) => {
    setSelectedSnippets(snippets);
  };

  const handleImportSuccess = (results) => {
    // Clear selections and refresh data
    setSelectedSnippets([]);
    setRefreshKey(prev => prev + 1);
    console.log('Import completed:', results);
  };

  return (
    <Router>
      <div className="app">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            },
            success: {
              iconTheme: {
                primary: 'var(--accent-primary)',
                secondary: 'var(--text-inverse)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--error)',
                secondary: 'var(--text-inverse)',
              },
            },
          }}
        />
        
        <Navbar 
          selectedSnippets={selectedSnippets}
          onImportSuccess={handleImportSuccess}
        />
        
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  selectedSnippets={selectedSnippets}
                  onSnippetSelection={handleSnippetSelection}
                  refreshKey={refreshKey}
                />
              } 
            />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
