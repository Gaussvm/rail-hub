import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ShopcarLayout() {
  return (
    <div className="flex-1 w-full h-full flex flex-col pt-2 pb-6 px-4 xl:px-6">
      {/* 
        Este contenedor envuelve a todos los submódulos de ShopCar
        (Control Reparaciones, Órdenes de Compra, Requisiciones, Reportes)
        Mantiene el padding global y deja que cada página dicte su layout interno.
      */}
      <div className="flex-1 w-full h-full max-h-full">
        <Outlet />
      </div>
    </div>
  );
}
