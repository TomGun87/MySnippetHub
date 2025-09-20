import React from 'react';
import { Toaster } from 'react-hot-toast';
import './theme.css';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';

function App() {
  return (
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
      
      <Navbar />
      
      <main className="main-content">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
