import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Utensils, User } from 'lucide-react';

const BottomNav = () => {
  return (
    <div className="glass-panel" style={{ 
      position: 'fixed', 
      bottom: '16px', 
      left: '16px', 
      right: '16px', 
      height: '64px', 
      display: 'flex', 
      justifyContent: 'space-around', 
      alignItems: 'center',
      padding: '0 20px',
      zIndex: 100,
      borderRadius: '20px'
    }}>
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center', padding: '8px' }}>
        <LayoutDashboard size={24} />
      </NavLink>
      <NavLink to="/diet-plan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center', padding: '8px' }}>
        <Utensils size={24} />
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center', padding: '8px' }}>
        <User size={24} />
      </NavLink>
    </div>
  );
};

export default BottomNav;
