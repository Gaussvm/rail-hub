import React from 'react';
import { Outlet } from 'react-router-dom';

export default function CatalogosLayout() {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Outlet />
    </div>
  );
}
