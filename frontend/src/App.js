import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './theme.css';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Navbar from './components/Navbar';

function App() {
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
          onImportSuccess={(results) => {
            // Handle import success - you can add global state updates here if needed
            console.log('Import completed:', results);
          }}
        />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
