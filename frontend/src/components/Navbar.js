import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
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

          {/* Version Badge */}
          <div className="navbar-end">
            <span className="badge">v1.0.0</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;