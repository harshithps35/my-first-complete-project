import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar glass-card">
      <div className="navbar-brand">
        <div className="navbar-logo">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path d="M16 2C16 2 6 10 6 18a10 10 0 0020 0C26 10 16 2 16 2z" fill="url(#nav-water-grad)" />
            <defs>
              <linearGradient id="nav-water-grad" x1="16" y1="2" x2="16" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <div className="navbar-title">AquaSense</div>
          <div className="navbar-subtitle">North Bangalore Groundwater Monitor</div>
        </div>
      </div>

      <div className="navbar-center">
        <div className="live-badge">
          <span className="live-dot"></span>
          LIVE MONITORING
        </div>
      </div>

      <div className="navbar-right">
        {user?.area && (
          <div className="navbar-area">
            <span className="area-icon">📍</span>
            <span>{user.area}</span>
          </div>
        )}
        <div className="navbar-user">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
        <button id="nav-logout-btn" className="btn btn-ghost nav-logout" onClick={handleLogout}>
          ↩ Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
