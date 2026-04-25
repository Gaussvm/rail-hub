import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  MapPin, 
  CreditCard, 
  Activity, 
  Briefcase, 
  Users, 
  Truck,
  Plus,
  Trash2,
  Save,
  Search,
  CheckCircle2,
  XCircle,
  Database,
  Box,
  CheckSquare,
  ShieldCheck,
  Wallet,
  MonitorPlay,
  GitBranch,
  Handshake,
  UserCheck,
  Building,
  ChevronRight,
  ArrowLeft,
  X,
  UploadCloud,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DICCIONARIOS = [
  { id: 'DEPARTAMENTOS', label: 'Departamentos', icon: <Building size={18} /> },
  { id: 'LOCALIDAD', label: 'Localidades', icon: <MapPin size={18} /> },
  { id: 'TIPO_GASTO', label: 'Tipo de Gasto', icon: <CreditCard size={18} /> },
  { id: 'MODALIDAD_CONTRATACION', label: 'Modalidades de Contratación', icon: <Briefcase size={18} /> },
  { id: 'TIPO', label: 'Tipo de Unidad', icon: <Box size={18} /> },
  { id: 'AREAS_FUNCIONALES', label: 'Áreas Funcionales', icon: <CheckSquare size={18} /> },
  { id: 'CONCEPTOS_NOMINA', label: 'Conceptos Nómina', icon: <Wallet size={18} /> },
  { id: 'TIPOS_ACTIVO', label: 'Tipos de Activo', icon: <MonitorPlay size={18} /> },
  { id: 'VIAS', label: 'Vías', icon: <GitBranch size={18} /> },
  { id: 'CLIENTES', label: 'Clientes', icon: <Handshake size={18} /> }
];

export default function CatalogosMaestros() {
  const [activeMenu, setActiveMenu] = useState('LOCALIDAD'); // o 'PROVEEDORES'
  const [diccionariosData, setDiccionariosData] = useState([]);
  const [proveedoresData, setProveedoresData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Jerarquía (Sub-Catálogos)
  const [expandedPadre, setExpandedPadre] = useState(null); // Objeto del registro padre
  
  // Estado para nuevo registro rápido de Diccionarios
  const [nuevoValor, setNuevoValor] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');

  // -------------------------------------------------------------
  // ESTADOS PARA ALTA DE PROVEEDORES
  // -------------------------------------------------------------
  const [showProvModal, setShowProvModal] = useState(false);
  const [editingProvId, setEditingProvId] = useState(null);
  const [isSubmittingProv, setIsSubmittingProv] = useState(false);
  
  const initialProvForm = {
    nombre_comercial: '',
    razon_social: '',
    rfc: '',
    direccion: '',
    ciudad: '',
    contacto_nombre: '',
    contacto_telefono: '',
    contacto_email: '',
    forma_pago: '',
    servicios_ofrecidos: '', // Bienes o Servicios
    estatus: 'APROBADO',
    origen: 'NACIONAL'
  };
  const [provForm, setProvForm] = useState(initialProvForm);
  const [encuestaFile, setEncuestaFile] = useState(null);
  const [evaluacionFile, setEvaluacionFile] = useState(null);

  // Limpiar jerarquía si cambiamos de menú
  useEffect(() => {
    setExpandedPadre(null);
  }, [activeMenu]);

  useEffect(() => {
    fetchData();
  }, [activeMenu, expandedPadre]);

  const fetchData = async () => {
    setIsLoading(true);
    if (activeMenu === 'PROVEEDORES') {
      const { data } = await supabase.from('sys_proveedores').select('*').order('nombre_comercial');
      setProveedoresData(data || []);
    } else {
      let query = supabase
        .from('sys_catalogos')
        .select('*')
        .eq('familia', activeMenu)
        .order('creado_en', { ascending: true });

      // Si estamos dentro de un sub-catálogo, trae solo a los hijos.
      if (expandedPadre) {
        query = query.eq('padre_id', expandedPadre.id);
      } else {
        // En vista maestra, trae solo a los padres (huérfanos de padre_id)
        query = query.is('padre_id', null);
      }

      const { data } = await query;
      setDiccionariosData(data || []);
    }
    setIsLoading(false);
  };

  // -------------------------------------------------------------
  // FUNCIONES DE DICCIONARIOS
  // -------------------------------------------------------------
  const handleCreateDiccionario = async () => {
    if (!nuevoValor) return;
    try {
      const { error } = await supabase.from('sys_catalogos').insert([{
        familia: activeMenu,
        valor: nuevoValor.toUpperCase(),
        clave: nuevaClave.toUpperCase() || null,
        padre_id: expandedPadre ? expandedPadre.id : null,
        es_activo: true
      }]);
      if (error) throw error;
      setNuevoValor('');
      setNuevaClave('');
      await fetchData();
    } catch (e) {
      alert("Error al guardar: " + e.message);
    }
  };

  const handleToggleActivo = async (id, currentStatus) => {
    const { error } = await supabase.from('sys_catalogos').update({ es_activo: !currentStatus }).eq('id', id);
    if (!error) fetchData();
  };

  const handleDeleteDiccionario = async (id) => {
    if (!window.confirm("¿Seguro de eliminar este registro? Puede romper enlaces antiguos. (Si tiene sub-categorías, también se eliminarán).")) return;
    const { error } = await supabase.from('sys_catalogos').delete().eq('id', id);
    if (!error) fetchData();
  };

  const getPlaceholders = () => {
    if (expandedPadre) {
      return { clave: 'Ej. 01', valor: `Ej. Agua (Subgasto de ${expandedPadre.valor})` };
    }
    switch(activeMenu) {
      case 'LOCALIDAD': return { clave: 'Ej. 600001', valor: 'Ej. MONTERREY, NL' };
      case 'TIPO_GASTO': return { clave: 'Ej. 03', valor: 'Ej. VIÁTICOS' };
      case 'AREAS_TRABAJO': return { clave: 'Ej. MANT', valor: 'Ej. MANTENIMIENTO' };
      case 'CLIENTES': return { clave: 'Ej. FRMX', valor: 'Ej. FERROMEX' };
      default: return { clave: 'Ej. 01...', valor: 'Ej. Escriba el valor...' };
    }
  };

  const placeholders = getPlaceholders();

  // -------------------------------------------------------------
  // FUNCIONES DE PROVEEDORES (STORAGE Y SUBMIT)
  // -------------------------------------------------------------
  const handleProvInputChange = (e) => {
    const { name, value } = e.target;
    setProvForm(prev => ({ ...prev, [name]: value }));
  };

  const openProvModal = (provToEdit = null) => {
    if (provToEdit && provToEdit.id) {
       setProvForm({
         nombre_comercial: provToEdit.nombre_comercial || '',
         razon_social: provToEdit.razon_social || '',
         rfc: provToEdit.rfc || '',
         direccion: provToEdit.direccion || '',
         ciudad: provToEdit.ciudad || '',
         contacto_nombre: provToEdit.contacto_nombre || '',
         contacto_telefono: provToEdit.contacto_telefono || '',
         contacto_email: provToEdit.contacto_email || '',
         forma_pago: provToEdit.forma_pago || '',
         servicios_ofrecidos: provToEdit.servicios_ofrecidos || '',
         estatus: provToEdit.estatus || 'APROBADO',
         origen: provToEdit.origen || 'NACIONAL'
       });
       setEditingProvId(provToEdit.id);
    } else {
       setProvForm(initialProvForm);
       setEditingProvId(null);
    }
    setEncuestaFile(null);
    setEvaluacionFile(null);
    setShowProvModal(true);
  };

  const uploadFileToSupabase = async (file, folder) => {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
    const filePath = `${folder}/${Date.now()}_${cleanName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('proveedores_docs')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error subiendo archivo:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from('proveedores_docs').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmitProvider = async (e) => {
    e.preventDefault();
    if (!provForm.nombre_comercial) return alert("El Nombre del Proveedor es obligatorio.");
    
    setIsSubmittingProv(true);
    try {
      let urlEncuesta = null;
      let urlEvaluacion = null;

      if (encuestaFile) urlEncuesta = await uploadFileToSupabase(encuestaFile, 'encuestas');
      if (evaluacionFile) urlEvaluacion = await uploadFileToSupabase(evaluacionFile, 'evaluaciones');

      let updatePayload = { ...provForm };
      if (urlEncuesta) updatePayload.doc_encuesta_url = urlEncuesta;
      if (urlEvaluacion) updatePayload.doc_evaluacion_url = urlEvaluacion;

      if (editingProvId) {
        const { error } = await supabase.from('sys_proveedores').update(updatePayload).eq('id', editingProvId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sys_proveedores').insert([updatePayload]);
        if (error) throw error;
      }

      setShowProvModal(false);
      fetchData(); // Recarga la tabla
    } catch (err) {
      alert("Error al guardar proveedor: " + err.message);
    }
    setIsSubmittingProv(false);
  };


  return (
    <div style={{ display: 'flex', height: '100%', gap: '20px', position: 'relative' }}>
      
      {/* SIDEBAR DE CATÁLOGOS */}
      <div style={{ width: '280px', background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1F4287', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Settings size={20} color="#3498DB" />
          Configuración
        </h2>

        <div style={{ fontSize: '11px', fontWeight: 700, color: '#95A5A6', marginBottom: '12px', letterSpacing: '0.05em' }}>
          ENTIDADES MAESTRAS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
           <button 
             onClick={() => setActiveMenu('PROVEEDORES')}
             style={{ 
               display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', border: 'none',
               background: activeMenu === 'PROVEEDORES' ? '#EBF5FB' : 'transparent',
               color: activeMenu === 'PROVEEDORES' ? '#1F4287' : '#34495E',
               fontWeight: activeMenu === 'PROVEEDORES' ? 700 : 500,
               cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
             }}
           >
             <Truck size={18} />
             Padron de Proveedores
           </button>
        </div>

        <div style={{ fontSize: '11px', fontWeight: 700, color: '#95A5A6', marginBottom: '12px', letterSpacing: '0.05em' }}>
          DICCIONARIOS DE SISTEMA
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          {DICCIONARIOS.map(dic => (
            <button 
              key={dic.id}
              onClick={() => setActiveMenu(dic.id)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', border: 'none',
                background: activeMenu === dic.id ? '#EBF5FB' : 'transparent',
                color: activeMenu === dic.id ? '#1F4287' : '#34495E',
                fontWeight: activeMenu === dic.id ? 700 : 500,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
              }}
            >
              <div style={{ color: activeMenu === dic.id ? '#3498DB' : '#95A5A6' }}>{dic.icon}</div>
              {dic.label}
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA PRINCIPAL (RIGHT PANEL) */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
        
        {/* HEADER AREA PRINCIPAL */}
        <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedPadre ? '#F4F6F8' : 'white', borderRadius: '12px 12px 0 0' }}>
          <div>
            {expandedPadre ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <button onClick={() => setExpandedPadre(null)} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                    <ArrowLeft size={16} color="#34495E" />
                 </button>
                 <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1F4287', margin: 0 }}>
                      Subcategorías de: {expandedPadre.valor}
                    </h1>
                    <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>
                      Configurando los hijos de esta categoría matriz.
                    </p>
                 </div>
               </div>
            ) : (
               <>
                  <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1F4287', margin: 0 }}>
                    {activeMenu === 'PROVEEDORES' ? 'Padrón Maestro de Proveedores' : DICCIONARIOS.find(d => d.id === activeMenu)?.label}
                  </h1>
                  <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>
                    {activeMenu === 'PROVEEDORES' 
                      ? 'Gestión centralizada de proveedores autorizados para compras y servicios.' 
                      : 'Manejo de matriz de datos para uso en selecciones a lo largo del sistema.'}
                  </p>
               </>
            )}
          </div>
          
          {activeMenu === 'PROVEEDORES' && (
             <button onClick={openProvModal} style={{ background: '#1F4287', color: 'white', border: 'none', height: '36px', padding: '0 16px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
               <Plus size={16} style={{ marginRight: '8px' }} /> Alta Proveedor
             </button>
          )}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          
          {/* VISTA DE DICCIONARIO GENÉRICO */}
          {activeMenu !== 'PROVEEDORES' && (
            <div style={{ maxWidth: '800px' }}>
               {/* FAST INPUT RECORD */}
               <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: expandedPadre ? 'white' : '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: expandedPadre ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '6px' }}>Clave (Opcional)</label>
                     <input type="text" value={nuevaClave} onChange={e => setNuevaClave(e.target.value)} placeholder={placeholders.clave} style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 3 }}>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '6px' }}>Valor a mostrar en listas *</label>
                     <input type="text" value={nuevoValor} onChange={e => setNuevoValor(e.target.value)} placeholder={placeholders.valor} style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                     <button onClick={handleCreateDiccionario} disabled={!nuevoValor} style={{ background: '#27AE60', color: 'white', border: 'none', height: '36px', padding: '0 20px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: nuevoValor ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center' }}>
                       <Save size={16} style={{ marginRight: '8px' }} /> Agregar
                     </button>
                  </div>
               </div>

               {/* TABLA DE VALORES */}
               <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
                 <thead>
                   <tr style={{ background: '#F8FAFC' }}>
                     <th style={{ width: '80px' }}>ID Int.</th>
                     <th style={{ width: '100px' }}>Clave</th>
                     <th>{expandedPadre ? 'Nombre de Subcategoría' : 'Valor en Sistema'}</th>
                     <th style={{ width: '100px', textAlign: 'center' }}>Estatus</th>
                     <th style={{ width: '140px', textAlign: 'center' }}>Acciones</th>
                   </tr>
                 </thead>
                 <tbody>
                   {isLoading ? (
                     <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Cargando datos...</td></tr>
                   ) : diccionariosData.length === 0 ? (
                     <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#7F8C8D' }}>No hay registros en este nivel.</td></tr>
                   ) : (
                     diccionariosData.map((row, index) => (
                       <tr key={row.id}>
                         <td style={{ color: '#95A5A6' }}>#{index + 1}</td>
                         <td style={{ fontWeight: 600 }}>{row.clave || '-'}</td>
                         <td style={{ fontWeight: 600, color: '#1F4287' }}>
                           {row.valor}
                           {/* Indicador visual si estamos en vista de jerarquía */}
                           {expandedPadre && <div style={{ fontSize: '10px', color: '#95A5A6', marginTop: '2px' }}>Subcategoría de: {expandedPadre.valor}</div>}
                         </td>
                         <td style={{ textAlign: 'center' }}>
                            <button 
                              onClick={() => handleToggleActivo(row.id, row.es_activo)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', color: row.es_activo ? '#27AE60' : '#E74C3C', fontWeight: 600, fontSize: '11px', padding: '4px 8px', borderRadius: '12px', backgroundColor: row.es_activo ? '#E8F5E9' : '#FEE2E2' }}
                            >
                              {row.es_activo ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                              {row.es_activo ? 'ACTIVO' : 'INACTIVO'}
                            </button>
                         </td>
                         <td style={{ textAlign: 'center' }}>
                           <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                             {!expandedPadre && ( // Solo los padres pueden tener hijos (1 nivel de profundidad para no volvernos locos)
                               <button 
                                 onClick={() => setExpandedPadre(row)} 
                                 style={{ background: '#EBF5FB', border: '1px solid #D6EAF8', color: '#3498DB', cursor: 'pointer', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                               >
                                 Detalle <ChevronRight size={14} />
                               </button>
                             )}
                             <button onClick={() => handleDeleteDiccionario(row.id)} title="Eliminar definitivamente" style={{ background: 'transparent', border: 'none', color: '#E74C3C', cursor: 'pointer', padding: '4px' }}>
                               <Trash2 size={16} />
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
            </div>
          )}


          {/* VISTA DE PROVEEDORES (COMPLEJO) */}
          {activeMenu === 'PROVEEDORES' && (
             <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  <thead>
                     <tr style={{ background: '#1F4287', color: 'white' }}>
                        <th>Proveedor</th>
                        <th>RFC</th>
                        <th>Ciudad</th>
                        <th>Contacto</th>
                        <th>Teléfono</th>
                        <th style={{ textAlign: 'center' }}>Estatus</th>
                        <th style={{ textAlign: 'center' }}>Docs</th>
                     </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Cargando proveedores...</td></tr>
                    ) : proveedoresData.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#7F8C8D' }}>Aún no hay proveedores registrados. Haz clic en 'Alta Proveedor'.</td></tr>
                    ) : (
                      proveedoresData.map(prov => (
                        <tr key={prov.id} onDoubleClick={() => openProvModal(prov)} style={{ cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'white'} title="Doble clic para editar">
                           <td style={{ fontWeight: 700, color: '#1F4287' }}>{prov.nombre_comercial}</td>
                           <td style={{ fontFamily: 'monospace' }}>{prov.rfc || '-'}</td>
                           <td>{prov.ciudad || '-'}</td>
                           <td>{prov.contacto_nombre || '-'}</td>
                           <td>{prov.contacto_telefono || '-'}</td>
                           <td style={{ textAlign: 'center' }}>
                              <span style={{ 
                                padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, 
                                background: prov.estatus === 'APROBADO' ? '#E8F5E9' : prov.estatus === 'PENDIENTE' ? '#FFF8E1' : '#FEE2E2',
                                color: prov.estatus === 'APROBADO' ? '#27AE60' : prov.estatus === 'PENDIENTE' ? '#F59D00' : '#E74C3C'
                              }}>
                                {prov.estatus}
                              </span>
                           </td>
                           <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                {prov.doc_encuesta_url ? <a href={prov.doc_encuesta_url} target="_blank" rel="noreferrer" title="Ver Encuesta" style={{ color: '#3498DB' }}><FileText size={16} /></a> : '-'}
                              </div>
                           </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          )}

        </div>
      </div>
    
      {/* ------------------------------------------------------------- */}
      {/* MODAL / PANEL DE ALTA DE PROVEEDORES                          */}
      {/* ------------------------------------------------------------- */}
      {showProvModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ 
            background: 'white', borderRadius: '12px', width: '900px', maxWidth: '95vw', 
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            
            {/* Header del Modal */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1F4287', margin: 0 }}>Alta de Proveedor</h2>
                <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>Complete la ficha técnica y adjunte evaluaciones para el nuevo padrón.</p>
              </div>
              <button disabled={isSubmittingProv} onClick={() => setShowProvModal(false)} style={{ background: '#F1F5F9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {/* Body del Modal */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <form id="prov-form" onSubmit={handleSubmitProvider} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* GRID 1: Datos Principales */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '6px' }}>Proveedor (Nombre Comercial) *</label>
                     <input required name="nombre_comercial" value={provForm.nombre_comercial} onChange={handleProvInputChange} type="text" placeholder="Ej. Aceros de Monterrey S.A. de C.V." style={{ width: '100%', height: '38px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 12px', fontSize: '13px' }} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '6px' }}>RFC *</label>
                     <input required name="rfc" value={provForm.rfc} onChange={handleProvInputChange} type="text" placeholder="TME840315" style={{ width: '100%', height: '38px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 12px', fontSize: '13px' }} />
                   </div>
                </div>

                {/* GRID 2: Ubicación */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '6px' }}>Dirección Completa</label>
                     <input name="direccion" value={provForm.direccion} onChange={handleProvInputChange} type="text" placeholder="Calle, Número, Colonia, C.P." style={{ width: '100%', height: '38px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 12px', fontSize: '13px' }} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '6px' }}>Ciudad / Estado</label>
                     <input name="ciudad" value={provForm.ciudad} onChange={handleProvInputChange} type="text" placeholder="Guadalupe, NL" style={{ width: '100%', height: '38px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 12px', fontSize: '13px' }} />
                   </div>
                </div>

                {/* GRID 3: Contacto */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '6px' }}>Nombre Contacto</label>
                     <input name="contacto_nombre" value={provForm.contacto_nombre} onChange={handleProvInputChange} type="text" placeholder="Juan Pérez" style={{ width: '100%', height: '38px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 12px', fontSize: '13px' }} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '6px' }}>Teléfonos</label>
                     <input name="contacto_telefono" value={provForm.contacto_telefono} onChange={handleProvInputChange} type="text" placeholder="811 234 5678" style={{ width: '100%', height: '38px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 12px', fontSize: '13px' }} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '6px' }}>E-mail</label>
                     <input name="contacto_email" value={provForm.contacto_email} onChange={handleProvInputChange} type="email" placeholder="ventas@proveedor.com" style={{ width: '100%', height: '38px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 12px', fontSize: '13px' }} />
                   </div>
                </div>

                {/* GRID 4: Operativos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '6px' }}>Forma de Pago</label>
                     <input name="forma_pago" value={provForm.forma_pago} onChange={handleProvInputChange} type="text" placeholder="Contado / Crédito 30 días" style={{ width: '100%', height: '38px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 12px', fontSize: '13px' }} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '6px' }}>Bienes o Servicios Ofrecidos</label>
                     <input name="servicios_ofrecidos" value={provForm.servicios_ofrecidos} onChange={handleProvInputChange} type="text" placeholder="Venta de refacciones, soldadura..." style={{ width: '100%', height: '38px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 12px', fontSize: '13px' }} />
                   </div>
                </div>

                {/* GRID 5: Control Interno */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', background: '#FFFDF0', padding: '16px', borderRadius: '8px', border: '1px solid #FDE047' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#854D0E', marginBottom: '6px' }}>Estatus</label>
                     <select name="estatus" value={provForm.estatus} onChange={handleProvInputChange} style={{ width: '100%', height: '38px', border: '1px solid #FDE047', borderRadius: '6px', padding: '0 12px', fontSize: '13px', background: 'white' }}>
                        <option value="APROBADO">🟢 APROBADO</option>
                        <option value="PENDIENTE">🟠 PENDIENTE</option>
                        <option value="RECHAZADO">🔴 RECHAZADO</option>
                     </select>
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#854D0E', marginBottom: '6px' }}>Origen</label>
                     <select name="origen" value={provForm.origen} onChange={handleProvInputChange} style={{ width: '100%', height: '38px', border: '1px solid #FDE047', borderRadius: '6px', padding: '0 12px', fontSize: '13px', background: 'white' }}>
                        <option value="NACIONAL">🇲🇽 NACIONAL</option>
                        <option value="EXTRANJERO">🌐 EXTRANJERO</option>
                     </select>
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#854D0E', marginBottom: '6px' }}>Doc. Encuesta (PDF)</label>
                     <div style={{ display: 'flex', alignItems: 'center', height: '38px', border: '1px dashed #EAB308', borderRadius: '6px', background: 'white', padding: '0 12px', cursor: 'pointer', overflow: 'hidden' }} onClick={() => document.getElementById('encuesta-upload').click()}>
                        <UploadCloud size={16} color="#CA8A04" style={{ minWidth: '16px', marginRight: '8px' }} />
                        <span style={{ fontSize: '11px', color: encuestaFile ? '#15803D' : '#CA8A04', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                           {encuestaFile ? encuestaFile.name : 'Subir archivo...'}
                        </span>
                     </div>
                     <input id="encuesta-upload" type="file" accept=".pdf,.png,.jpg" style={{ display: 'none' }} onChange={(e) => setEncuestaFile(e.target.files[0])} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#854D0E', marginBottom: '6px' }}>Doc. Evaluación (PDF)</label>
                     <div style={{ display: 'flex', alignItems: 'center', height: '38px', border: '1px dashed #EAB308', borderRadius: '6px', background: 'white', padding: '0 12px', cursor: 'pointer', overflow: 'hidden' }} onClick={() => document.getElementById('eval-upload').click()}>
                        <UploadCloud size={16} color="#CA8A04" style={{ minWidth: '16px', marginRight: '8px' }} />
                        <span style={{ fontSize: '11px', color: evaluacionFile ? '#15803D' : '#CA8A04', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                           {evaluacionFile ? evaluacionFile.name : 'Subir archivo...'}
                        </span>
                     </div>
                     <input id="eval-upload" type="file" accept=".pdf,.png,.jpg" style={{ display: 'none' }} onChange={(e) => setEvaluacionFile(e.target.files[0])} />
                   </div>
                </div>
              </form>
            </div>

            {/* Footer del Modal */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#F8FAFC', borderRadius: '0 0 12px 12px' }}>
              <button disabled={isSubmittingProv} onClick={() => setShowProvModal(false)} type="button" style={{ background: 'white', border: '1px solid #CBD5E1', color: '#64748B', fontWeight: 600, padding: '0 20px', height: '40px', borderRadius: '6px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button disabled={isSubmittingProv} form="prov-form" type="submit" style={{ background: '#1F4287', border: 'none', color: 'white', fontWeight: 600, padding: '0 24px', height: '40px', borderRadius: '6px', cursor: isSubmittingProv ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSubmittingProv ? 0.7 : 1 }}>
                {isSubmittingProv ? 'Subiendo datos y archivos...' : <><Save size={18} /> {editingProvId ? 'Actualizar Proveedor' : 'Confirmar Alta'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
