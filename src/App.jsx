import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';

// Módulo de ShopCar
import ShopcarLayout from './pages/ShopCar/ShopcarLayout';
import ControlReparaciones from './pages/ShopCar/ControlReparaciones';
import OrdenesCompra from './pages/ShopCar/OrdenesCompra';
import Requisiciones from './pages/ShopCar/Requisiciones';
import Reportes from './pages/ShopCar/Reportes';

// Módulo de Inventarios
import InventariosLayout from './pages/Inventarios/InventariosLayout';
import AnalisisExistencias from './pages/Inventarios/Analisis';
import EntradaMateriales from './pages/Inventarios/Entradas';
import SalidaMateriales from './pages/Inventarios/Salidas';
import Traspasos from './pages/Inventarios/Traspasos';
import Kardex from './pages/Inventarios/Kardex';
import ActivosFijos from './pages/Inventarios/Activos';
import CatalogoMaestro from './pages/Inventarios/Catalogo';

// Módulo de Gestión de Calidad (Compliance Hub)
import BovedaCalidad from './pages/Calidad/Boveda';

// Módulo Financiero
import ControlFinanciero from './pages/Finanzas/ControlFinanciero';

// Módulo RRHH
import DirectorioRRHH from './pages/RRHH/Directorio';

// Módulo Sistema (Catálogos)
import CatalogosLayout from './pages/Sistema/CatalogosLayout';
import CatalogosMaestros from './pages/Sistema/Catalogos';
import GestionUsuarios from './pages/Sistema/Usuarios';

// Componente para proteger rutas que requieren Login
const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#38bdf8', fontFamily: 'sans-serif' }}>
         Verificando credenciales operativas...
      </div>
    );
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta Pública (Portal de Entrada) */}
          <Route path="/login" element={<Login />} />

          {/* Hub Privado (Requiere Sesión Activa) */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            
            {/* Módulo ShopCar */}
            <Route path="/shopcar" element={<ShopcarLayout />}>
              <Route index element={<ControlReparaciones />} />
              <Route path="control-reparaciones" element={<ControlReparaciones />} />
              <Route path="ordenes-compra" element={<OrdenesCompra />} />
              <Route path="requisiciones" element={<Requisiciones />} />
              <Route path="reportes" element={<Reportes />} />
            </Route>
            
            <Route path="/inventario" element={<InventariosLayout />}>
              <Route index element={<AnalisisExistencias />} />
              <Route path="catalogo" element={<CatalogoMaestro />} />
              <Route path="entradas" element={<EntradaMateriales />} />
              <Route path="salidas" element={<SalidaMateriales />} />
              <Route path="traspasos" element={<Traspasos />} />
              <Route path="kardex" element={<Kardex />} />
              <Route path="activos" element={<ActivosFijos />} />
            </Route>
            
            <Route path="/calidad" element={<BovedaCalidad />} />
            <Route path="/finanzas" element={<ControlFinanciero />} />
            <Route path="/rh" element={<DirectorioRRHH />} />
            
            <Route path="/catalogos" element={<CatalogosLayout />}>
               <Route index element={<CatalogosMaestros />} />
               <Route path="usuarios" element={<GestionUsuarios />} />
            </Route>

            {/* Error Ruteo */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
