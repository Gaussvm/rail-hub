import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Dashboard Layout that controls the App Shell */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ordenes" element={<WorkOrders />} />
          
          {/* Missing routes for demo purposes default to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
