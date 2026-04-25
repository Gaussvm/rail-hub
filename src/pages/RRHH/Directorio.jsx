import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Plus, UserPlus, Briefcase, Mail, Building, Phone, Search } from 'lucide-react';

const DirectorioRRHH = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado UI
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Formulario Empleado
  const [form, setForm] = useState({
    nombre_completo: '',
    departamento: 'OPERACIONES',
    puesto: '',
    rfc: '',
    nss: '',
    fecha_nacimiento: '',
    telefono: '',
    correo_electronico: '',
    fecha_ingreso: ''
  });

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fin_empleados')
        .select('*')
        .order('nombre_completo', { ascending: true });
        
      if (error) throw error;
      setEmpleados(data || []);
    } catch (error) {
      console.error('Error fetching empleados:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (emp) => {
    setEditingId(emp.id);
    setForm({
      nombre_completo: emp.nombre_completo || '',
      departamento: emp.departamento || 'OPERACIONES',
      puesto: emp.puesto || '',
      rfc: emp.rfc || '',
      nss: emp.nss || '',
      fecha_nacimiento: emp.fecha_nacimiento || '',
      telefono: emp.telefono || '',
      correo_electronico: emp.correo_electronico || '',
      fecha_ingreso: emp.fecha_ingreso || ''
    });
    setShowModal(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    setForm({ 
      nombre_completo: '', departamento: 'OPERACIONES', puesto: '',
      rfc: '', nss: '', fecha_nacimiento: '', telefono: '', correo_electronico: '', fecha_ingreso: '' 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Limpiar fechas vacias a nulo para postgres
      const payload = { ...form };
      if (!payload.fecha_nacimiento) payload.fecha_nacimiento = null;
      if (!payload.fecha_ingreso) payload.fecha_ingreso = null;

      if (editingId) {
        // ACTUALIZAR
        const { error } = await supabase
          .from('fin_empleados')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // INSERTAR
        const { error } = await supabase
          .from('fin_empleados')
          .insert([payload]);
        if (error) throw error;
      }
      
      setShowModal(false);
      setEditingId(null);
      setForm({ 
        nombre_completo: '', 
        departamento: 'OPERACIONES', 
        puesto: '',
        rfc: '', nss: '', fecha_nacimiento: '', telefono: '', correo_electronico: '', fecha_ingreso: '' 
      });
      fetchEmpleados();
      
    } catch (error) {
      console.error('Error saving empleado:', error);
      alert(`Hubo un error al guardar al empleado.\nDetalle del servidor: ${error.message}\n\nNota: Si dice "column does not exist", recuerda correr el script SQL de la base de datos.`);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1F2937', display: 'flex', alignItems: 'center' }}>
            <Users size={28} style={{ marginRight: '8px', color: '#1F4287' }} />
            Directorio del Personal (RRHH)
          </h1>
          <p style={{ margin: '0', color: '#6B7280', fontSize: '14px' }}>
            Base de datos corporativa. Estos perfiles se ligan al módulo financiero para otorgar saldos y anticipos.
          </p>
        </div>
        
        <button 
          onClick={openNewModal}
          style={{ background: '#1F4287', color: 'white', border: 'none', height: '36px', padding: '0 16px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(31, 66, 135, 0.2)' }}
        >
          <UserPlus size={16} style={{ marginRight: '8px' }} /> Alta de Personal
        </button>
      </div>

      {/* CONTROLES (Buscador) */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, departamento o puesto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none' }}
          />
        </div>
      </div>

      {/* TABLA DE EMPLEADOS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Cargando personal...</div>
      ) : empleados.filter(emp => 
        (emp.nombre_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (emp.departamento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.puesto || '').toLowerCase().includes(searchTerm.toLowerCase())
      ).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
          <Users size={48} style={{ color: '#9CA3AF', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px', color: '#374151' }}>No hay resultados</h3>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>No se encontraron empleados que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px', color: '#4B5563', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Nombre Completo</th>
                <th style={{ padding: '12px 16px', color: '#4B5563', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Depto / Puesto</th>
                <th style={{ padding: '12px 16px', color: '#4B5563', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Contacto</th>
                <th style={{ padding: '12px 16px', color: '#4B5563', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Estatus</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#4B5563', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados
                .filter(emp => 
                  (emp.nombre_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (emp.departamento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (emp.puesto || '').toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #E5E7EB', '&:last-child': { borderBottom: 'none' } }}>
                  <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E40AF', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                      {emp.nombre_completo.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{emp.nombre_completo}</div>
                      {emp.rfc && <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>RFC: {emp.rfc}</div>}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: '#374151', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={14} color="#9CA3AF" /> {emp.departamento || 'N/A'}</div>
                    <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={14} color="#9CA3AF" /> {emp.puesto || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: '#374151', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} color="#9CA3AF" /> {emp.correo_electronico || 'Sin correo'}</div>
                    <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} color="#9CA3AF" /> {emp.telefono || 'Sin teléfono'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', background: emp.estatus === 'ACTIVO' ? '#DEF7EC' : '#FDE8E8', color: emp.estatus === 'ACTIVO' ? '#03543F' : '#9B1C1C', fontSize: '12px', fontWeight: 600, borderRadius: '12px' }}>
                      {emp.estatus}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleEditClick(emp)}
                      style={{ background: 'transparent', border: '1px solid #D1D5DB', padding: '6px 12px', borderRadius: '6px', color: '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Briefcase size={14} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL EMPLEADO */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 24, 39, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', padding: '0', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ background: '#1F4287', padding: '20px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', color: '#FFFFFF' }}>
                <UserPlus size={18} style={{ marginRight: '8px' }} /> {editingId ? 'Editar Personal' : 'Alta de Personal'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Nombre Completo *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Sixto Barradas"
                  value={form.nombre_completo}
                  onChange={(e) => setForm({...form, nombre_completo: e.target.value.toUpperCase()})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Área / Depto.
                  </label>
                  <select 
                    value={form.departamento}
                    onChange={(e) => setForm({...form, departamento: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none', background: 'white' }}
                  >
                    <option value="DIRECCIÓN">Dirección</option>
                    <option value="OPERACIONES">Operaciones</option>
                    <option value="TRÁFICO">Tráfico</option>
                    <option value="CALIDAD">Calidad y S.I.C</option>
                    <option value="ADMINISTRACIÓN">Administración</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Puesto
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej. Mecánico / Auxiliar"
                    value={form.puesto}
                    onChange={(e) => setForm({...form, puesto: e.target.value.toUpperCase()})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Datos Complementarios (Opcional)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>RFC</label>
                    <input type="text" placeholder="ABCD123456XYZ" value={form.rfc} onChange={(e) => setForm({...form, rfc: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Núm. Seguro Social (NSS)</label>
                    <input type="text" placeholder="1122334455" value={form.nss} onChange={(e) => setForm({...form, nss: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Fecha de Nacimiento</label>
                    <input type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({...form, fecha_nacimiento: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', color: form.fecha_nacimiento ? '#1E293B' : '#94A3B8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Fecha de Ingreso</label>
                    <input type="date" value={form.fecha_ingreso} onChange={(e) => setForm({...form, fecha_ingreso: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', color: form.fecha_ingreso ? '#1E293B' : '#94A3B8' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Teléfono Móvil</label>
                    <input type="tel" placeholder="452 123 4567" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Correo Electrónico</label>
                    <input type="email" placeholder="usuario@correo.com" value={form.correo_electronico} onChange={(e) => setForm({...form, correo_electronico: e.target.value.toLowerCase()})} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #D1D5DB', color: '#374151', borderRadius: '6px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '10px 20px', background: '#1F4287', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Plus size={16} style={{ marginRight: '6px' }} /> {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorioRRHH;
