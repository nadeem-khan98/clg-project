import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Only render navbar if user is logged in
  if (!user || location.pathname === '/login' || location.pathname === '/signup') {
    return null; 
  }

  return (
    <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: 'var(--accent-color)', minWidth: 'max-content' }}>AI Diet Coach</h2>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Link 
            to="/dashboard" 
            style={{ 
              color: location.pathname === '/dashboard' ? 'var(--accent-color)' : 'var(--text-color)', 
              textDecoration: 'none',
              fontWeight: location.pathname === '/dashboard' ? 'bold' : 'normal'
            }}
          >
            Dashboard
          </Link>
          <Link 
            to="/profile" 
            style={{ 
              color: location.pathname === '/profile' ? 'var(--accent-color)' : 'var(--text-color)', 
              textDecoration: 'none',
              fontWeight: location.pathname === '/profile' ? 'bold' : 'normal'
            }}
          >
            Profile Settings
          </Link>
        </div>
      </div>
      <button className="btn btn-danger" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LogOut size={16} /> Logout
      </button>
    </nav>
  );
};

export default Navbar;
