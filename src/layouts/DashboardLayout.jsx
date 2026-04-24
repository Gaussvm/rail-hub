import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

const DashboardLayout = () => {

  return (
    <div className="dashboard-layout">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-content">
        
        {/* View Port for nested routes */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
