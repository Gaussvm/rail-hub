import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { 
  LayoutDashboard, 
  TrainFront, 
  Wrench, 
  PackageSearch, 
  FileText, 
  Users, 
  Settings,
  ChevronDown,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  ClipboardList,
  MonitorPlay,
  Package,
  BarChart2,
  BookOpen,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { userProfile, session, logout } = useAuth();
  
  const currentEmail = session?.user?.email || '';
  const isMaster = currentEmail === 'gustavoxone2@gmail.com' || currentEmail === 'gustavozona2@gmail.com';

  const accesos = isMaster ? {
     operaciones: true,
     shopcar: true,
     inventarios: true,
     administracion: true,
     hub_documental: true,
     sistema: true
  } : (userProfile?.accesos_modulos || {
     operaciones: false,
     shopcar: false,
     inventarios: false,
     administracion: false,
     hub_documental: false,
     sistema: false
  });

  const [expanded, setExpanded] = useState({
    operaciones: location.pathname === '/' || location.pathname.startsWith('/activos'),
    shopcar: location.pathname.startsWith('/shopcar'),
    inventario: location.pathname.startsWith('/inventario'),
    admin: location.pathname.startsWith('/gastos') || location.pathname.startsWith('/rh'),
    normativa: location.pathname.startsWith('/calidad'),
    sistema: location.pathname.startsWith('/catalogos')
  });

  const toggleExpand = (menu) => {
    setExpanded(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="logo-text">RAIL</span><span className="logo-highlight">-HUB</span>
      </div>
      
      <nav className="sidebar-nav">
        
        {/* OPERACIONES */}
        {accesos.operaciones && (
          <div className="nav-group">
            <button 
              className={`nav-item master-item ${(location.pathname === '/' || location.pathname.startsWith('/activos')) ? 'active-master' : ''}`}
              onClick={() => toggleExpand('operaciones')}
            >
              <LayoutDashboard size={18} />
              <span>OPERACIONES</span>
              <span className="expand-icon">
                {expanded.operaciones ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            
            {expanded.operaciones && (
              <div className="sidebar-submenu">
                <NavLink to="/" className={({isActive}) => isActive && location.pathname === '/' ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <LayoutDashboard size={16} />
                  <span>Dashboard Principal</span>
                </NavLink>
                <NavLink to="/activos" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <TrainFront size={16} />
                  <span>Fichero de Activos</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* SHOP CAR */}
        {accesos.shopcar && (
          <div className="nav-group">
            <button 
              className={`nav-item master-item ${location.pathname.startsWith('/shopcar') ? 'active-master' : ''}`}
              onClick={() => toggleExpand('shopcar')}
            >
              <Wrench size={18} />
              <span>SHOP CAR</span>
              <span className="expand-icon">
                {expanded.shopcar ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            
            {expanded.shopcar && (
              <div className="sidebar-submenu">
                <NavLink to="/shopcar/control-reparaciones" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <Wrench size={16} />
                  <span>Control Reparaciones</span>
                </NavLink>
                <NavLink to="/shopcar/ordenes-compra" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <ClipboardList size={16} />
                  <span>Órdenes de Compra</span>
                </NavLink>
                <NavLink to="/shopcar/requisiciones" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <FileText size={16} />
                  <span>Requisiciones</span>
                </NavLink>
                <NavLink to="/shopcar/reportes" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <BarChart2 size={16} />
                  <span>Hub de Reportes</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* INVENTARIO */}
        {accesos.inventarios && (
          <div className="nav-group">
            <button 
              className={`nav-item master-item ${location.pathname.startsWith('/inventario') ? 'active-master' : ''}`}
              onClick={() => toggleExpand('inventario')}
            >
              <PackageSearch size={18} />
              <span>INVENTARIO</span>
              <span className="expand-icon">
                {expanded.inventario ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            
            {expanded.inventario && (
              <div className="sidebar-submenu">
                <NavLink to="/inventario" end className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <Package size={16} />
                  <span>Análisis y Existencias</span>
                </NavLink>
                <NavLink to="/inventario/catalogo" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <BookOpen size={16} />
                  <span>Catálogo Maestro</span>
                </NavLink>
                <NavLink to="/inventario/entradas" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <ArrowDownToLine size={16} />
                  <span>Entradas</span>
                </NavLink>
                <NavLink to="/inventario/salidas" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <ArrowUpFromLine size={16} />
                  <span>Salidas</span>
                </NavLink>
                <NavLink to="/inventario/traspasos" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <ArrowRightLeft size={16} />
                  <span>Traspasos</span>
                </NavLink>
                <NavLink to="/inventario/kardex" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <ClipboardList size={16} />
                  <span>Kardex</span>
                </NavLink>
                <NavLink to="/inventario/activos" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <MonitorPlay size={16} />
                  <span>Activos Fijos</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* ADMINISTRACIÓN */}
        {accesos.administracion && (
          <div className="nav-group">
            <button 
              className={`nav-item master-item ${(location.pathname.startsWith('/gastos') || location.pathname.startsWith('/rh')) ? 'active-master' : ''}`}
              onClick={() => toggleExpand('admin')}
            >
              <FileText size={18} />
              <span>ADMINISTRACIÓN</span>
              <span className="expand-icon">
                {expanded.admin ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            
            {expanded.admin && (
              <div className="sidebar-submenu">
                <NavLink to="/finanzas" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <FileText size={16} />
                  <span>Control Financiero</span>
                </NavLink>
                <NavLink to="/rh" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <Users size={16} />
                  <span>Recursos Humanos</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* GESTIÓN NORMATIVA (CALIDAD Y SIC) */}
        {accesos.hub_documental && (
          <div className="nav-group">
            <button 
              className={`nav-item master-item ${location.pathname.startsWith('/calidad') ? 'active-master' : ''}`}
              onClick={() => toggleExpand('normativa')}
            >
              <ShieldCheck size={18} />
              <span>HUB DOCUMENTAL</span>
              <span className="expand-icon">
                {expanded.normativa ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            
            {expanded.normativa && (
              <div className="sidebar-submenu">
                <NavLink to="/calidad" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <ShieldCheck size={16} />
                  <span>Bóveda y Cumplimiento</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* CLAVES & SISTEMA */}
        {accesos.sistema && (
          <div className="nav-group">
            <button 
              className={`nav-item master-item ${location.pathname.startsWith('/catalogos') ? 'active-master' : ''}`}
              onClick={() => toggleExpand('sistema')}
            >
              <Settings size={18} />
              <span>SISTEMA</span>
              <span className="expand-icon">
                {expanded.sistema ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            
            {expanded.sistema && (
              <div className="sidebar-submenu">
                <NavLink to="/catalogos" end className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <Settings size={16} />
                  <span>Catálogos Maestros</span>
                </NavLink>
                <NavLink to="/catalogos/usuarios" className={({isActive}) => isActive ? "nav-item sub-item active" : "nav-item sub-item"}>
                  <Users size={16} />
                  <span>Control de Accesos (RBAC)</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

      </nav>

      {/* FOOTER USER / LOGOUT */}
      <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#38bdf8', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#0f172a' }}>
               {userProfile?.nombre ? userProfile.nombre.charAt(0) : (isMaster ? 'G' : 'U')}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
               <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                 {userProfile?.nombre ? `${userProfile.nombre} ${userProfile.apellido_paterno || ''}` : (isMaster ? 'Gustavo (Maestro)' : 'Usuario')}
               </div>
               <div style={{ fontSize: '11px', color: '#64748b' }}>
                 {userProfile?.rol_principal || (isMaster ? 'Administrador Sistema' : 'Corporativo')}
               </div>
            </div>
         </div>
         <button 
           onClick={logout}
           style={{ 
             width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
             color: '#fca5a5', padding: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'center', 
             alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
             transition: 'background 0.2s'
           }}
           onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
           onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
         >
           <LogOut size={16} />
           Cerrar Sesión
         </button>
      </div>

    </aside>
  );
};

export default Sidebar;
