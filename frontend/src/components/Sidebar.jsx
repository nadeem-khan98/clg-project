import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Utensils, User, ScanBarcode, LogOut } from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  return (
    <div className="glass-panel" style={{ 
      width: '280px', 
      height: 'calc(100vh - 40px)', 
      margin: '20px', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'sticky',
      top: '20px'
    }}>
      <div style={{ padding: '32px 24px' }}>
        <h2 className="gradient-text" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Utensils className="text-accent-neon" /> DietCoach
        </h2>
      </div>

      <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/diet-plan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Utensils size={20} /> Diet Plan
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={20} /> Profile
        </NavLink>
        
        <div style={{ margin: '20px 0', height: '1px', background: 'var(--glass-border)' }} />
        
        <NavLink to="/scan" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`} style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', textDecoration: 'none' }}>
          <ScanBarcode size={20} /> Scan Product
        </NavLink>
      </nav>

      <div style={{ padding: '24px' }}>
        <button onClick={onLogout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
