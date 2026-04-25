import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, ShieldCheck, Mail, Database, Save, Activity, Trash2, ShieldAlert, Settings
} from 'lucide-react';

const modulosAccesibles = [
  { id: 'operaciones', label: 'Operaciones (Activos)', color: '#3498DB' },
  { id: 'shopcar', label: 'ShopCar', color: '#E67E22' },
  { id: 'inventarios', label: 'Inventario', color: '#2ECC71' },
  { id: 'administracion', label: 'Administración (Finanzas, RRHH)', color: '#9B59B6' },
  { id: 'hub_documental', label: 'Hub Documental (Calidad)', color: '#16A085' },
  { id: 'sistema', label: 'Configuración de Sistema', color: '#34495E' }
];

const rolesUI = ['DEVELOPER', 'ADMINISTRADOR', 'GERENTE', 'VERIFICADOR', 'USUARIO', 'AUDITOR', 'SOLO LECTURA', 'CLIENTE'];

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localidadesCat, setLocalidadesCat] = useState([]); // Diccionario de localidades
  const [departamentosCat, setDepartamentosCat] = useState([]); // Diccionario de departamentos

  // Estados Formulario Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userProfile, session } = useAuth();
  const currentEmail = session?.user?.email || '';
  const MASTER_EMAILS = ['gustavoxone2@gmail.com', 'gustavozona2@gmail.com', 'gdelvallem@autocom.com.mx', 'gdelvallem@autocomm.com.mx'];
  const isMasterLogger = MASTER_EMAILS.includes(currentEmail);

  const initialFormState = {
    llave_sistema: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    rol_principal: 'USUARIO',
    departamento: '',
    empresa_id: ['AUTOCOM'],
    es_activo: true,
    caducidad_pwd: '',
    accesos_modulos: {
      operaciones: false,
      shopcar: false,
      inventarios: false,
      administracion: false,
      hub_documental: false,
      sistema: false
    },
    localidades_autorizadas: []
  };

  const [formConfig, setFormConfig] = useState(initialFormState);

  useEffect(() => {
    fetchDependencias();
    fetchUsuarios();
  }, []);

  const fetchDependencias = async () => {
    // Para el modal, llenamos las localidades desde los catálogos maestras
    const { data: locData } = await supabase.from('sys_catalogos').select('id, valor').eq('familia', 'LOCALIDAD').eq('es_activo', true);
    if(locData) setLocalidadesCat(locData);
    
    // Obtener departamentos
    const { data: depData } = await supabase.from('sys_catalogos').select('id, valor').eq('familia', 'DEPARTAMENTOS').eq('es_activo', true).order('valor');
    if(depData) setDepartamentosCat(depData);
  };

  const fetchUsuarios = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('sys_usuarios').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setUsuarios(data);
    }
    setIsLoading(false);
  };

  const openFormModal = (user = null) => {
    if (user && user.id) {
       // --- PROTECCIÓN MAESTRA ---
       const isTargetMaster = MASTER_EMAILS.includes(user.email);
       if (isTargetMaster && !isMasterLogger) {
          return alert("🚫 ACCESO DENEGADO: Este es un Perfil Maestro. Solo el creador original puede modificar sus datos y accesos.");
       }

       let parsedEmpresas = ['AUTOCOM'];
       try { parsedEmpresas = typeof user.empresa_id === 'string' && user.empresa_id.startsWith('[') ? JSON.parse(user.empresa_id) : (user.empresa_id ? [user.empresa_id] : ['AUTOCOM']); } catch(e){}

       setFormConfig({
         ...user,
         accesos_modulos: typeof user.accesos_modulos === 'string' ? JSON.parse(user.accesos_modulos) : (user.accesos_modulos || initialFormState.accesos_modulos),
         localidades_autorizadas: typeof user.localidades_autorizadas === 'string' ? JSON.parse(user.localidades_autorizadas) : (user.localidades_autorizadas || []),
         empresa_id: parsedEmpresas
       });
       setEditingId(user.id);
    } else {
       setFormConfig(initialFormState);
       setEditingId(null);
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAccesoToggle = (moduloId) => {
    setFormConfig(prev => ({
      ...prev,
      accesos_modulos: {
        ...prev.accesos_modulos,
        [moduloId]: !prev.accesos_modulos[moduloId]
      }
    }));
  };

  const handleLocalidadToggle = (locValor) => {
    setFormConfig(prev => {
      if (locValor === 'ALL') {
         if (prev.localidades_autorizadas.length === localidadesCat.length) return { ...prev, localidades_autorizadas: [] };
         return { ...prev, localidades_autorizadas: localidadesCat.map(l => l.valor) };
      }
      const isSelected = prev.localidades_autorizadas.includes(locValor);
      if (isSelected) {
        return { ...prev, localidades_autorizadas: prev.localidades_autorizadas.filter(l => l !== locValor) };
      } else {
        return { ...prev, localidades_autorizadas: [...prev.localidades_autorizadas, locValor] };
      }
    });
  };

  const handleEmpresaToggle = (empValor) => {
    setFormConfig(prev => {
      let current = Array.isArray(prev.empresa_id) ? prev.empresa_id : (prev.empresa_id ? [prev.empresa_id] : []);
      const isSelected = current.includes(empValor);
      if (isSelected) {
        return { ...prev, empresa_id: current.filter(e => e !== empValor) };
      } else {
        return { ...prev, empresa_id: [...current, empValor] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formConfig.nombre || !formConfig.email || !formConfig.llave_sistema) {
       return alert("Llave, Nombre y Email son obligatorios.");
    }

    setIsSubmitting(true);
    try {
       const payload = {
         llave_sistema: formConfig.llave_sistema.toUpperCase(),
         nombre: formConfig.nombre,
         apellido_paterno: formConfig.apellido_paterno,
         apellido_materno: formConfig.apellido_materno,
         email: formConfig.email.toLowerCase(),
         rol_principal: formConfig.rol_principal,
         departamento: formConfig.departamento || null,
         empresa_id: typeof formConfig.empresa_id === 'object' ? JSON.stringify(formConfig.empresa_id) : formConfig.empresa_id,
         es_activo: formConfig.es_activo,
         caducidad_pwd: formConfig.caducidad_pwd || null,
         accesos_modulos: formConfig.accesos_modulos,
         localidades_autorizadas: formConfig.localidades_autorizadas
       };

       if(editingId) {
          const { error } = await supabase.from('sys_usuarios').update(payload).eq('id', editingId);
          if (error) throw error;
       } else {
          const { error } = await supabase.from('sys_usuarios').insert([payload]);
          if (error) throw error;
       }
       setShowModal(false);
       fetchUsuarios();
    } catch(err) {
       alert("Hubo un error de guardado: " + err.message);
    }
    setIsSubmitting(false);
  };

  const toggleUsuarioStatus = async (id, currentStatus) => {
    const userTarget = usuarios.find(x => x.id === id);
    if(userTarget && (userTarget.email === MASTER_EMAIL_1 || userTarget.email === MASTER_EMAIL_2)) {
        return alert("🚫 OPERACIÓN DENEGADA: El Perfil Maestro es inmutable y no puede ser bloqueado.");
    }

    const { error } = await supabase.from('sys_usuarios').update({ es_activo: !currentStatus }).eq('id', id);
    if(!error) fetchUsuarios();
  };

  return (
    <div style={{ height: '100%', padding: '24px', overflowY: 'auto', background: '#F4F7F6' }}>
      
      {/* HEADER PAGE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1F4287', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} />
            Usuarios
          </h1>
          <p style={{ margin: '8px 0 0', color: '#6A7885', fontSize: '14px' }}>
            Gestión corporativa de usuarios, perfiles operativos y matrices de seguridad de RailHub.
          </p>
        </div>
        <button 
          onClick={() => openFormModal()}
          style={{ background: '#1F4287', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(31,66,135,0.15)' }}>
          <Users size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* DASHBOARD WRAPPER */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#334155' }}>
              <th style={{ padding: '16px 24px', fontWeight: 700, width: '250px' }}>Usuario</th>
              <th style={{ padding: '16px 24px', fontWeight: 700 }}>Rol & Empresa</th>
              <th style={{ padding: '16px 24px', fontWeight: 700 }}>Llave / Placa</th>
              <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center' }}>Estatus</th>
              <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}><Activity className="spinning" size={24} color="#94A3B8"/></td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Ningún usuario registrado.</td></tr>
            ) : (
                usuarios.map(u => (
                  <tr key={u.id} 
                      onDoubleClick={() => openFormModal(u)} 
                      style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      title="Doble clic para editar Accesos"
                  >
                    <td style={{ padding: '16px 24px' }}>
                       <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '2px' }}>{u.nombre} {u.apellido_paterno}</div>
                       <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} /> {u.email}
                       </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                       <div style={{ fontWeight: 600, color: '#0F172A' }}>{u.rol_principal}</div>
                       <div style={{ fontSize: '12px', color: '#64748B' }}>
                          {(() => {
                            try { return (typeof u.empresa_id === 'string' && u.empresa_id.startsWith('[')) ? JSON.parse(u.empresa_id).join(', ') : u.empresa_id; }
                            catch { return u.empresa_id; }
                          })()}
                       </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>
                       {u.llave_sistema}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                       {MASTER_EMAILS.includes(u.email) ? (
                          <span style={{ 
                            padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, 
                            backgroundColor: '#1E293B', color: '#F8FAFC', display: 'inline-block', border: '1px solid #0F172A'
                          }}>
                             CREADOR MASTER
                          </span>
                       ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleUsuarioStatus(u.id, u.es_activo); }}
                            style={{ 
                             border: 'none', background: 'transparent', cursor: 'pointer',
                             padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                             backgroundColor: u.es_activo ? '#DCFCE7' : '#FEE2E2',
                             color: u.es_activo ? '#16A34A' : '#EF4444'
                          }}>
                             {u.es_activo ? 'ACTIVO' : 'BLOQUEADO'}
                          </button>
                       )}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                       {(!MASTER_EMAILS.includes(u.email) || isMasterLogger) ? (
                         <button 
                           onClick={(e) => { e.stopPropagation(); openFormModal(u); }}
                           style={{
                             border: '1px solid #E2E8F0', background: 'white', borderRadius: '8px', padding: '6px 12px',
                             cursor: 'pointer', fontWeight: 600, fontSize: '12px', color: '#0F172A',
                             transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto'
                           }}
                           onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                           onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                         >
                           <Settings size={14} /> Editar
                         </button>
                       ) : (
                         <div style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 500, fontStyle: 'italic' }}>
                           Bloqueado
                         </div>
                       )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>


      {/* MODAL / PANEL DE CONFIGURACIÓN RBAC */}
      {showModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.65)', zIndex: 1000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{ 
            background: 'white', borderRadius: '16px', width: '1000px', maxWidth: '95vw', 
            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            
            {/* Header del Modal */}
            <div style={{ background: '#1F4287', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'white' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={24} /> {editingId ? 'Matriz de Accesos del Usuario' : 'Alta de Nuevo Talento'}
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#93C5FD', fontSize: '13px' }}>Define sus datos personales, su rol y su autorización cruzada dentro del Rail-Hub.</p>
              </div>
            </div>

            <form id="usuario-form" onSubmit={handleSubmit} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* LADO IZQUIERDO: PERFIL Y DATOS PERSONALES */}
              <div style={{ width: '400px', background: '#F8FAFC', borderRight: '1px solid #E2E8F0', padding: '24px', overflowY: 'auto' }}>
                 <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Identidad Corporativa</h3>
                 
                 <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Llave Operativa *</label>
                    <input required name="llave_sistema" value={formConfig.llave_sistema} onChange={handleChange} placeholder="Ej. ADMIN-001" style={{ width: '100%', height: '40px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', fontSize: '14px', outline: 'none' }} />
                 </div>
                 
                 <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Nombres *</label>
                       <input required name="nombre" value={formConfig.nombre} onChange={handleChange} style={{ width: '100%', height: '40px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', fontSize: '14px', outline: 'none' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Ap. Paterno *</label>
                       <input required name="apellido_paterno" value={formConfig.apellido_paterno} onChange={handleChange} style={{ width: '100%', height: '40px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', fontSize: '14px', outline: 'none' }} />
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Ap. Materno</label>
                       <input name="apellido_materno" value={formConfig.apellido_materno} onChange={handleChange} style={{ width: '100%', height: '40px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', fontSize: '14px', outline: 'none' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Email Corporativo *</label>
                       <input type="email" required name="email" value={formConfig.email} onChange={handleChange} placeholder="Ej. jperez@empresa.com" style={{ width: '100%', height: '40px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', fontSize: '14px', outline: 'none' }} />
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                     <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Rol Principal (Jerarquía)</label>
                        <select name="rol_principal" value={formConfig.rol_principal} onChange={handleChange} style={{ width: '100%', height: '40px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', fontSize: '14px', background: 'white', outline: 'none' }}>
                           {rolesUI.map(rol => <option key={rol} value={rol}>{rol}</option>)}
                        </select>
                     </div>
                     <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Departamento (Área)</label>
                        <select name="departamento" value={formConfig.departamento || ''} onChange={handleChange} style={{ width: '100%', height: '40px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', fontSize: '14px', background: 'white', outline: 'none' }}>
                           <option value="">Seleccione un área...</option>
                           {departamentosCat.map(depto => (
                             <option key={depto.id} value={depto.valor}>{depto.valor}</option>
                           ))}
                        </select>
                     </div>
                 </div>

                 <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Empresas Autorizadas (Multi-empresa)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                       {['AUTOCOM', 'FNTX', 'FERROMEX'].map(emp => {
                          const current = Array.isArray(formConfig.empresa_id) ? formConfig.empresa_id : (formConfig.empresa_id ? [formConfig.empresa_id] : []);
                          const isSelected = current.includes(emp);
                          const nombres = { 'AUTOCOM': 'Autocom Services', 'FNTX': 'FNTX', 'FERROMEX': 'Ferromex/Tercerizado' };
                          return (
                            <div 
                              key={emp}
                              onClick={() => handleEmpresaToggle(emp)}
                              style={{ 
                                 padding: '6px 12px', background: isSelected ? '#1E3A8A' : 'white', 
                                 color: isSelected ? 'white' : '#64748B', borderRadius: '20px', 
                                 fontSize: '11px', fontWeight: 600, cursor: 'pointer', 
                                 border: isSelected ? '1px solid #1E3A8A' : '1px solid #CBD5E1',
                                 transition: 'all 0.2s', userSelect: 'none'
                              }}
                            >
                              {nombres[emp]}
                            </div>
                          );
                       })}
                    </div>
                 </div>
                 
                 <div style={{ padding: '16px', background: '#DBEAFE', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldAlert size={28} color="#1D4ED8" />
                    <p style={{ margin: 0, fontSize: '12px', color: '#1E3A8A' }}>Las credenciales (Password) están temporalmente delegadas al módulo de autenticación para evitar exposición plana.</p>
                 </div>

              </div>

              {/* LADO DERECHO: MATRIZ RBAC & LOCALIDADES */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'white' }}>
                 
                 <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Database size={18} /> Privilegios de Interfaz (RBAC)
                 </h3>
                 <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>Concede acceso explícito a este usuario para que pueda interactuar con los siguientes módulos maestros del ERP.</p>

                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    {modulosAccesibles.map(mod => {
                       const checked = formConfig.accesos_modulos[mod.id];
                       return (
                         <div 
                           key={mod.id} 
                           onClick={() => handleAccesoToggle(mod.id)}
                           style={{ 
                             border: `2px solid ${checked ? mod.color : '#E2E8F0'}`, 
                             background: checked ? `${mod.color}10` : 'white',
                             padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                             display: 'flex', alignItems: 'center', gap: '12px'
                           }}>
                            <div style={{ 
                               width: '24px', height: '24px', borderRadius: '6px', 
                               background: checked ? mod.color : '#F1F5F9', border: `1px solid ${checked ? mod.color : '#CBD5E1'}`,
                               display: 'flex', justifyContent: 'center', alignItems: 'center'
                            }}>
                               {checked && <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '2px' }} />}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: checked ? mod.color : '#64748B' }}>{mod.label}</span>
                         </div>
                       )
                    })}
                 </div>

                 <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
                   Localidades Autorizadas (Filtro Geográfico)
                 </h3>
                 
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                   <button
                     type="button"
                     onClick={() => handleLocalidadToggle('ALL')}
                     style={{
                       padding: '8px 16px', borderRadius: '4px', fontSize: '13px', fontWeight: 600, border: '1px solid #1E293B', cursor: 'pointer',
                       background: formConfig.localidades_autorizadas.length === localidadesCat.length && localidadesCat.length > 0 ? '#1E293B' : 'white', 
                       color: formConfig.localidades_autorizadas.length === localidadesCat.length && localidadesCat.length > 0 ? 'white' : '#1E293B', transition: 'all 0.2s',
                       width: '100%'
                     }}>
                     {formConfig.localidades_autorizadas.length === localidadesCat.length && localidadesCat.length > 0 ? '✓ Deseleccionar Todas' : 'Seleccionar Todas las Localidades'}
                   </button>
                 </div>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                   {localidadesCat.length === 0 ? <span style={{ color: '#94A3B8', fontSize: '13px' }}>Aún no hay localidades en el catálogo del sistema.</span> : null}
                   {localidadesCat.map(loc => {
                     const isSel = formConfig.localidades_autorizadas.includes(loc.valor);
                     return (
                       <button
                         key={loc.id}
                         type="button"
                         onClick={() => handleLocalidadToggle(loc.valor)}
                         style={{
                           padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                           background: isSel ? '#1E293B' : '#F1F5F9', 
                           color: isSel ? 'white' : '#64748B', transition: 'all 0.2s'
                         }}>
                         {loc.valor}
                       </button>
                     )
                   })}
                 </div>
              </div>
            </form>

            {/* BARRA DE ACCIÓN INFERIOR */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setFormConfig(prev => ({...prev, es_activo: !prev.es_activo}))}>
                 <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1px solid #CBD5E1', display: 'flex', justifyContent: 'center', alignItems: 'center', background: formConfig.es_activo ? '#16A34A' : 'white' }}>
                    {formConfig.es_activo && <div style={{ width: '10px', height: '10px', background: 'white', borderRadius: '2px' }} />}
                 </div>
                 <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Perfil Activo (Tiene Acceso login)</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                 <button disabled={isSubmitting} type="button" onClick={() => setShowModal(false)} style={{ background: 'white', border: '1px solid #CBD5E1', color: '#64748B', fontWeight: 600, padding: '0 20px', height: '40px', borderRadius: '6px', cursor: 'pointer' }}>
                   Cancelar
                 </button>
                 <button disabled={isSubmitting} form="usuario-form" type="submit" style={{ background: '#1F4287', border: 'none', color: 'white', fontWeight: 600, padding: '0 24px', height: '40px', borderRadius: '6px', cursor: isSubmitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Save size={18} /> {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar Permisos' : 'Asegurar Accesos'}
                 </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
