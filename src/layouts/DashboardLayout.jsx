import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const location = useLocation();
  const { userProfile, session } = useAuth();
  
  const isMaster = session?.user?.email === 'gustavoxone2@gmail.com';
  const userInitials = userProfile?.nombre ? userProfile.nombre.charAt(0) : (isMaster ? 'G' : 'U');
  const userName = userProfile?.nombre ? `${userProfile.nombre} ${userProfile.apellido_paterno || ''}` : (isMaster ? 'Gustavo (Maestro)' : 'Usuario');
  const userRole = userProfile?.rol_principal || (isMaster ? 'Creador de Sistema' : 'Corporativo');

  // Format pathname for breadcrumbs (simple version)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 0 
    ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() + pathParts[pathParts.length - 1].slice(1)
    : 'Dashboard';

  return (
    <div className="dashboard-layout">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-content">
        
        {/* Top Header/Toolbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="breadcrumbs">
              Autocom Rail <span>&gt;</span> <span className="active">{currentPage}</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="text" placeholder="Buscar Órdenes, Activos..." style={{ width: '250px' }} />
              <button className="btn-secondary" style={{ padding: '6px' }}>
                <Search size={16} />
              </button>
            </div>
            
            <button className="btn-secondary" style={{ padding: '6px', borderRadius: '50%' }}>
              <Bell size={18} />
            </button>
            
            {/* User Details showing Role/Department abstraction */}
            <div className="user-profile-widget" style={{ marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid var(--border-color)' }}>
              <div className="user-avatar">{userInitials}</div>
              <div className="user-info">
                <span className="user-name">{userName}</span>
                <span className="user-role">{userRole}</span>
              </div>
            </div>
          </div>
        </header>

        {/* View Port for nested routes */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
