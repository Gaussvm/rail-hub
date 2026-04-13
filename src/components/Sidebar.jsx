import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { 
  LayoutDashboard, 
  TrainFront, 
  Wrench, 
  PackageSearch, 
  FileText, 
  Users, 
  Settings 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="logo-text">RAIL</span><span className="logo-highlight">-HUB</span>
      </div>
      
      <nav className="sidebar-nav">
        {/* OPERACIONES */}
        <div className="nav-group">
          <div className="nav-group-title">Operaciones</div>
          <NavLink to="/" className={({isActive}) => isActive && location.pathname === '/' ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/activos" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <TrainFront size={18} />
            <span>Fichero de Activos</span>
          </NavLink>
        </div>

        {/* SHOP CAR / MANTENIMIENTO */}
        <div className="nav-group">
          <div className="nav-group-title">Shop Car</div>
          <NavLink to="/ordenes" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Wrench size={18} />
            <span>Órdenes de Trabajo</span>
          </NavLink>
        </div>

        {/* ALMACEN */}
        <div className="nav-group">
          <div className="nav-group-title">Inventario</div>
          <NavLink to="/inventario" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <PackageSearch size={18} />
            <span>Materiales y Kardex</span>
          </NavLink>
        </div>

        {/* GESTION & RH */}
        <div className="nav-group">
          <div className="nav-group-title">Administración</div>
          <NavLink to="/gastos" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FileText size={18} />
            <span>Gastos y Cobranza</span>
          </NavLink>
          <NavLink to="/rh" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Users size={18} />
            <span>Recursos Humanos</span>
          </NavLink>
        </div>

        {/* CONFIG */}
        <div className="nav-group">
          <div className="nav-group-title">Sistema</div>
          <NavLink to="/catalogos" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Settings size={18} />
            <span>Catálogos Maestros</span>
          </NavLink>
        </div>

      </nav>
    </aside>
  );
};

export default Sidebar;
