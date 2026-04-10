import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ScanBarcode } from 'lucide-react';

const Layout = ({ children }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {!isMobile && <Sidebar onLogout={handleLogout} />}
      
      <main className="main-content">
        {children}
      </main>

      {isMobile && (
        <>
          <BottomNav />
          <button className="fab" onClick={() => navigate('/scan')}>
            <ScanBarcode size={28} />
          </button>
        </>
      )}
    </div>
  );
};

export default Layout;
