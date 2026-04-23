import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Download, Search, Image as ImageIcon, CheckCircle2, AlertCircle, FileText, ArrowLeft, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Catálogos Maestros (Futuras Tablas en Base de Datos)
const CAT_TIPOS_ACTIVO = [
  'AIRE', 'AIRLESS', 'ANDAMIOS', 'AUTOS Y CAMIONETAS', 'COMPRESORES', 
  'ESCANTILLONES', 'GATOS', 'GENERADORES', 'MAQUINARIA PESADA', 'MAQUINAS DE SOLDAR', 
  'PISTOLA HUCK', 'PISTOLA NEUMATICAS', 'POLIPASTOS', 'PULIDORAS', 'RACK DE PRUEBAS', 
  'TALADROS', 'TANQUE ACETILENO', 'TANQUE GAS BUTANO', 'TANQUES DE OXIGENO', 'TORQUIMETROS'
];

const CAT_LOCALIDADES = [
  'ALZADA, COLIMA', 'APAZAPAN, VERACRUZ', 'APIZACO, TLAXCALA', 'CDMX', 'CIUDAD FRONTERA, COAH', 
  'COATZACOALCOS, VER', 'FELIPE PESCADOR, ZACATECAS', 'GUADALAJARA, JAL', 'HERMOSILLO, SONORA', 
  'IRAPUATO, GUANAJUATO', 'SILAO GM, GTO', 'TIERRA BLANCA, VER', 'TM CHIHUAHUA'
];

export default function ActivosFijos() {
  const [activos, setActivos] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'
  const [isLoading, setIsLoading] = useState(true);
  const [evidenciasNuevas, setEvidenciasNuevas] = useState([]);
  const [evidenciasGuardadas, setEvidenciasGuardadas] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showNewClasificacion, setShowNewClasificacion] = useState(false);
  const fileInputRef = React.useRef(null);

  // Filtros de Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterLocalidad, setFilterLocalidad] = useState('');

  const activosFiltrados = activos.filter(a => {
    if (searchTerm && !a.nombre_equipo.toLowerCase().includes(searchTerm.toLowerCase()) && !a.numero_serie_vin?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterTipo && a.clasificacion !== filterTipo) return false;
    if (filterLocalidad && a.localidad_asignada !== filterLocalidad) return false;
    return true;
  });

  // ESTADOS DEL FORMULARIO
  const [form, setForm] = useState({
    nombre_equipo: '', clasificacion: '', localidad_asignada: '',
    numero_serie_vin: '', estado_certificacion: '', periodo_renovacion: '',
    fecha_compra: '', certificacion_inicio: '', certificacion_vencimiento: '',
    condiciones_fisicas: ''
  });

  const fetchActivos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('activos_fijos').select(`
      *,
      activos_evidencias (*)
    `).eq('archivado', false).order('creado_en', { ascending: false });
    if (!error && data) {
      setActivos(data);
    }
    setIsLoading(false);
  };

  // Cargar categorías dinámicas uniendo catálogo predefinido con lo existente en DB
  const dynamicTiposActivo = [...new Set([...CAT_TIPOS_ACTIVO, ...activos.map(a => a.clasificacion)])].filter(Boolean).sort();
  const dynamicLocalidades = [...new Set([...CAT_LOCALIDADES, ...activos.map(a => a.localidad_asignada)])].filter(Boolean).sort();

  useEffect(() => {
    fetchActivos();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === activos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activos.map(a => a.id));
    }
  };
  const handleSave = async () => {
    try {
      if(!form.nombre_equipo || !form.clasificacion) {
        alert('ERROR: Favor de completar al menos el "Nombre del Activo Fijo" y "Clasificación / Tipo".');
        return;
      }
      
      setIsUploading(true);
      setUploadProgress('Guardando datos principales...');
      
      const payload = { ...form };
      if(!payload.fecha_compra) payload.fecha_compra = null;
      if(!payload.certificacion_inicio) payload.certificacion_inicio = null;
      if(!payload.certificacion_vencimiento) payload.certificacion_vencimiento = null;

      let actualActivoId = editingId;

      if (editingId) {
        const { error } = await supabase.from('activos_fijos').update(payload).eq('id', editingId);
        if(error) throw error;
      } else {
        const { data, error } = await supabase.from('activos_fijos').insert([payload]).select();
        if(error) throw error;
        actualActivoId = data[0].id;
      }

      // SUBIDA DE EVIDENCIAS A SUPABASE STORAGE
      if (evidenciasNuevas.length > 0) {
        for (let i = 0; i < evidenciasNuevas.length; i++) {
          const file = evidenciasNuevas[i];
          setUploadProgress(`Subiendo archivo adjunto ${i + 1} de ${evidenciasNuevas.length} a la Nube... (Por favor espere)`);
          
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${actualActivoId}/${fileName}`;
          
          // Subida al Bucket
          const { error: storageError } = await supabase.storage.from('evidencias').upload(filePath, file);
          if (storageError) {
             console.error('Error subiendo al bucket:', storageError);
             continue; // Si falla uno, pasamos al siguiente
          }
          
          // Recuperar URL Pública
          const { data: publicUrlData } = supabase.storage.from('evidencias').getPublicUrl(filePath);
          
          // Insertar Metadato Relacional a la BD
          const evidenciaPayload = {
            activo_id: actualActivoId,
            file_path: filePath,
            file_url: publicUrlData.publicUrl,
            file_name: file.name,
            file_type: file.type || 'application/octet-stream'
          };
          
          await supabase.from('activos_evidencias').insert([evidenciaPayload]);
        }
      }
      
      setIsUploading(false);
      setUploadProgress('');
      alert(editingId ? '¡Activo y archivos actualizados exitosamente!' : '¡Activo Fijo registrado con todos sus adjuntos en la Nube!');
      
      // Reset form variables
      setForm({
        nombre_equipo: '', clasificacion: '', localidad_asignada: '',
        numero_serie_vin: '', estado_certificacion: '',
        fecha_compra: '', certificacion_inicio: '', certificacion_vencimiento: '',
        condiciones_fisicas: ''
      });
      setEvidenciasNuevas([]);
      setEvidenciasGuardadas([]);
      setEditingId(null);
      setViewMode('list');
      fetchActivos();
    } catch (err) {
      setIsUploading(false);
      setUploadProgress('');
      console.error('Excepción Crítica en handleSave o Update:', err);
      alert('Error en Base de Datos: ' + err.message);
    }
  };

  const handleEdit = async (activo) => {
    setForm({
      nombre_equipo: activo.nombre_equipo || '', 
      clasificacion: activo.clasificacion || '', 
      localidad_asignada: activo.localidad_asignada || '',
      numero_serie_vin: activo.numero_serie_vin || '', 
      estado_certificacion: activo.estado_certificacion || '', 
      fecha_compra: activo.fecha_compra || '', 
      certificacion_inicio: activo.certificacion_inicio || '', 
      certificacion_vencimiento: activo.certificacion_vencimiento || '',
      condiciones_fisicas: activo.condiciones_fisicas || ''
    });
    setEditingId(activo.id);
    setEvidenciasNuevas([]);
    setEvidenciasGuardadas([]);
    setViewMode('create');
    
    // Buscar evidencias guardadas en Supabase
    setIsUploading(true);
    setUploadProgress('Recuperando historial de archivos desde la nube...');
    const { data: evData, error: evError } = await supabase.from('activos_evidencias').select('*').eq('activo_id', activo.id);
    setIsUploading(false);
    setUploadProgress('');
    if (!evError && evData) {
      setEvidenciasGuardadas(evData);
    }
  };

  const handleDeleteEvidenciaGuardada = async (e, evidencia) => {
    e.stopPropagation();
    const confirmacion = window.prompt('ATENCIÓN\nEstás a punto de borrar definitivamente este archivo del almacenamiento.\n\nEscriba "eliminar" para confirmar:');
    if (confirmacion !== 'eliminar') {
       alert('Operación cancelada. Debes escribir "eliminar" exactamente para confirmar el proceso destructivo.');
       return;
    }
    
    setIsUploading(true);
    setUploadProgress('Borrando archivo permanentemente del Servidor...');
    
    // Delete Physical File from Storage Bucket
    const { error: storageError } = await supabase.storage.from('evidencias').remove([evidencia.file_path]);
    
    // Delete Reference from Database
    const { error: dbError } = await supabase.from('activos_evidencias').delete().eq('id', evidencia.id);
    
    setIsUploading(false);
    setUploadProgress('');
    
    if (dbError) {
      alert('Error al borrar de BD: ' + dbError.message);
    } else {
      setEvidenciasGuardadas(prev => prev.filter(item => item.id !== evidencia.id));
      // No lanzamos alerta molesta, es mas suave la UX
    }
  };

  const handleAddNew = () => {
    setForm({
      nombre_equipo: '', clasificacion: '', localidad_asignada: '',
      numero_serie_vin: '', estado_certificacion: '', 
      fecha_compra: '', certificacion_inicio: '', certificacion_vencimiento: '',
      condiciones_fisicas: ''
    });
    setEditingId(null);
    setEvidenciasNuevas([]);
    setEvidenciasGuardadas([]);
    setViewMode('create');
  };

  const handleDelete = async () => {
    const confirm = window.confirm(`ATENCIÓN: ¿Estás totalmente seguro de dar de BAJA / ELIMINAR los ${selectedIds.length} activos seleccionados? Esta acción es irreversible.`);
    if (confirm) {
      // Usamos Update archivar en vez de delete fisico
      await supabase.from('activos_fijos').update({ archivado: true }).in('id', selectedIds);
      setSelectedIds([]);
      fetchActivos();
    }
  };

  if (viewMode === 'create') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', overflowY: 'auto', paddingRight: '12px' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E0E4E8', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F4287', margin: 0, display: 'flex', alignItems: 'center' }}>
              <Plus size={24} style={{ marginRight: '8px' }} /> {editingId ? 'Visualizar / Editar Activo Fijo' : 'Alta de Nuevo Activo'}
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>
              {editingId ? 'Actualiza los datos del archivo, ajusta fechas de caducidad o agrega nueva evidencia.' : 'Registra la identidad, certificación y fotografías del nuevo equipo/vehículo.'}
            </p>
          </div>
          <button 
            className="btn-secondary" 
            onClick={() => setViewMode('list')} 
            style={{ display: 'flex', alignItems: 'center', height: '36px', padding: '0 16px', background: '#F8FAFC', border: '1px solid #BDC3C7', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, color: '#34495E' }}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Regresar al Listado
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Panel 1 */}
            <div className="card" style={{ padding: '20px', borderTop: '4px solid #1F4287' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1F4287', paddingBottom: '12px', borderBottom: '1px solid #E0E4E8', marginBottom: '16px', textTransform: 'uppercase' }}>
                1. Identidad Física del Equipo
              </h3>
              <div className="grid-form" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Nombre del Activo Fijo *</label>
                  <input type="text" className="form-input" placeholder="Ej. PLANTA DE LUZ HONDA 5000W" value={form.nombre_equipo} onChange={e => setForm({...form, nombre_equipo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Clasificación / Tipo</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {showNewClasificacion ? (
                      <>
                        <input 
                          type="text" 
                          autoFocus
                          className="form-input" 
                          style={{ flex: 1, border: '2px solid #2980B9' }} 
                          placeholder="Escribe el nombre de la nueva clasificación..." 
                          value={form.clasificacion} 
                          onChange={e => setForm({...form, clasificacion: e.target.value.toUpperCase()})}
                        />
                        <button 
                          type="button"
                          onClick={() => { setShowNewClasificacion(false); setForm({...form, clasificacion: ''}); }}
                          style={{ width: '36px', height: '36px', background: '#FADBD8', color: '#E74C3C', border: '1px solid #E74C3C', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          ✖
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="select-container" style={{ flex: 1 }}>
                          <select 
                            className="form-input" 
                            style={{ width: '100%' }} 
                            value={form.clasificacion} 
                            onChange={e => setForm({...form, clasificacion: e.target.value})}
                          >
                            <option value="">[ Selecciona tipo de activo ]</option>
                            {dynamicTiposActivo.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                          </select>
                        </div>
                        <button 
                          type="button"
                          className="btn-secondary"
                          onClick={() => { setShowNewClasificacion(true); setForm({...form, clasificacion: ''}); }}
                          style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eaf2f8', color: '#1F4287', border: '1px solid #2980B9' }}
                          title="Alta de Nueva Clasificación"
                        >
                          <Plus size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Localidad / Ubicación</label>
                  <div className="select-container">
                    <select className="form-input" style={{ width: '100%' }} value={form.localidad_asignada} onChange={e => setForm({...form, localidad_asignada: e.target.value})}>
                      <option value="">[ Selecciona destino opertivo ]</option>
                      {dynamicLocalidades.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Número de Serie (S/N) o VIN</label>
                  <input type="text" className="form-input" placeholder="S/N..." value={form.numero_serie_vin} onChange={e => setForm({...form, numero_serie_vin: e.target.value})} />
                </div>
                <div className="form-group"></div>
              </div>
            </div>

            {/* Panel 2 */}
            <div className="card" style={{ padding: '20px', borderTop: '4px solid #27ae60', background: '#F8FAFC' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#27ae60', paddingBottom: '12px', borderBottom: '1px solid #E0E4E8', marginBottom: '16px', textTransform: 'uppercase' }}>
                2. Control de Certificación y Vida Útil
              </h3>
              <div className="grid-form" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">Estado de Certificación</label>
                  <input type="text" className="form-input" placeholder="Ej. SI NUEVA" value={form.estado_certificacion} onChange={e => setForm({...form, estado_certificacion: e.target.value})} />
                </div>
                <div className="form-group">
                    <label className="form-label">Doc. Respaldo</label>
                    <input type="file" className="form-input" style={{ background: 'white', padding: '6px' }} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Fecha de Compra</label>
                  <input type="date" className="form-input" value={form.fecha_compra} onChange={e => setForm({...form, fecha_compra: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 1' }}></div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#27ae60', fontWeight: 600 }}>Inicio Certificación</label>
                  <input type="date" className="form-input" value={form.certificacion_inicio} onChange={e => setForm({...form, certificacion_inicio: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#D32F2F', fontWeight: 600 }}>Vencimiento Límite</label>
                  <input type="date" className="form-input" style={{ borderColor: '#F5B7B1', background: '#FDEDEC', color: '#D32F2F', fontWeight: 700 }} value={form.certificacion_vencimiento} onChange={e => setForm({...form, certificacion_vencimiento: e.target.value})} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Condiciones Actuales / Extras</label>
                  <input type="text" className="form-input" placeholder="Detalles operativos..." value={form.condiciones_fisicas} onChange={e => setForm({...form, condiciones_fisicas: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#34495E', marginBottom: '16px', textTransform: 'uppercase' }}>
                3. Evidencia y Documentación
              </h3>
              
              <div 
                style={{ 
                  flex: 1, minHeight: '220px', border: '2px dashed #CBD5E1', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: (evidenciasNuevas.length > 0 || evidenciasGuardadas.length > 0) ? '#E8F6F3' : '#F8FAFC', cursor: (evidenciasNuevas.length === 0 && evidenciasGuardadas.length === 0) ? 'pointer' : 'default', marginBottom: '24px', padding: '16px', position: 'relative'
                }}
                onClick={() => {
                  if (evidenciasNuevas.length === 0 && evidenciasGuardadas.length === 0) fileInputRef.current?.click();
                }}
              >
                {/* Overlay de Carga */}
                {isUploading && (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.8)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <div style={{ padding: '24px', background: 'white', borderRadius: '8px', border: '1px solid #3498DB', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#2980B9', fontWeight: 600, fontSize: '14px' }}>
                      ⏳ {uploadProgress}
                    </div>
                  </div>
                )}

                <input 
                  type="file" 
                  multiple
                  accept="image/png, image/jpeg, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      const newFiles = Array.from(e.target.files);
                      setEvidenciasNuevas(prev => [...prev, ...newFiles]);
                    }
                    e.target.value = ''; // Reset to allow re-selecting same file if needed
                  }} 
                />
                <ImageIcon size={48} color={(evidenciasNuevas.length > 0 || evidenciasGuardadas.length > 0) ? "#1ABC9C" : "#95A5A6"} style={{ marginBottom: '12px' }} />
                
                {(evidenciasNuevas.length > 0 || evidenciasGuardadas.length > 0) ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p style={{ fontWeight: 600, color: '#16A085', margin: 0, textAlign: 'center' }}>
                      Registrada Galería de {evidenciasNuevas.length + evidenciasGuardadas.length} Archivos Adjuntos
                    </p>
                    <ul style={{ margin: '12px 0', padding: 0, listStyle: 'none', width: '100%', maxHeight: '140px', overflowY: 'auto' }}>
                      {/* Archivos Cargados desde Servidor */}
                      {evidenciasGuardadas.map((file) => (
                        <li key={file.id} style={{ fontSize: '11px', color: '#1F4287', padding: '6px 8px', background: '#E3F2FD', borderRadius: '4px', marginBottom: '6px', border: '1px solid #90CAF9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, paddingRight: '8px', fontWeight: 600 }}>
                            ☁️ {file.file_name} <a href={file.file_url} target="_blank" rel="noreferrer" style={{marginLeft: '8px', color: '#3498db', fontWeight: 'normal', textDecoration: 'none'}} onClick={e => e.stopPropagation()}>(Abrir)</a>
                          </span>
                          <button 
                            type="button"
                            onClick={(e) => handleDeleteEvidenciaGuardada(e, file)}
                            style={{ background: 'none', border: 'none', color: '#E74C3C', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px', display: 'flex', alignItems: 'center' }}
                            title="Eliminar de la Nube"
                          >
                            <Trash2 size={12} />
                          </button>
                        </li>
                      ))}
                      {/* Archivos Pendientes de Subir en Frontend Local */}
                      {evidenciasNuevas.map((file, i) => (
                        <li key={`new-${i}`} style={{ fontSize: '11px', color: '#34495E', padding: '6px 8px', background: 'white', borderRadius: '4px', marginBottom: '6px', border: '1px solid #BDC3C7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, paddingRight: '8px', color: '#7F8C8D' }}>
                            <span style={{background:'#F1C40F', color:'white', padding:'2px 4px', borderRadius:'2px', fontSize:'9px', marginRight:'6px'}}>PENDIENTE</span>
                            {file.name}
                          </span>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEvidenciasNuevas(prev => prev.filter((_, index) => index !== i));
                            }}
                            style={{ background: 'none', border: 'none', color: '#E74C3C', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}
                          >
                            X
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button 
                      type="button"
                      disabled={isUploading}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      style={{ background: '#fff', border: '1px dashed #1ABC9C', color: '#16A085', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', marginTop: '4px', opacity: isUploading ? 0.5 : 1 }}
                    >
                      <Plus size={14} style={{ marginRight: '4px' }} /> Agregar más archivos
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={{ fontWeight: 600, color: '#34495E', margin: 0 }}>Clic para Subir Documentación</p>
                    <p style={{ fontSize: '12px', color: '#7F8C8D', marginTop: '4px', textAlign: 'center' }}>
                      PDF, Manuales, JPG o PNG. Max 10MB.<br/>Acepta archivos múltiples o de jalon.
                    </p>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                <button disabled={isUploading} onClick={handleSave} style={{ background: isUploading ? '#BDC3C7' : '#1F4287', color: 'white', border: 'none', height: '44px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                  <CheckCircle2 size={18} style={{ marginRight: '8px' }} /> Guardar {editingId ? 'Cambios del Activo' : 'Activo y Evidencia'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* HEADER DE MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E0E4E8', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#34495E', margin: 0, display: 'flex', alignItems: 'center' }}>
            <Truck size={24} style={{ marginRight: '8px' }} />
            Control de Activos Fijos
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>
            Registro independiente de equipamiento mayor, vehículos y gestión de certificaciones.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {selectedIds.length > 0 && (
            <button style={{ background: '#E74C3C', color: 'white', border: 'none', height: '36px', padding: '0 16px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(231, 76, 60, 0.2)' }} onClick={handleDelete}>
              <Trash2 size={16} style={{ marginRight: '8px' }} /> Dar de Baja ({selectedIds.length})
            </button>
          )}
          <button style={{ background: '#27ae60', color: 'white', border: 'none', height: '36px', padding: '0 16px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(39, 174, 96, 0.2)' }} onClick={handleAddNew}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Alta de Activo
          </button>
          <button className="btn-secondary" style={{ height: '36px', padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: '13px' }}>
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* FILTROS DE BÚSQUEDA */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={16} color="#95A5A6" style={{ position: 'absolute', top: '10px', left: '12px' }} />
            <input 
              type="text" 
              placeholder="Buscar por equipo, VIN o serie..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: '36px', paddingLeft: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <select 
            value={filterTipo} 
            onChange={e => setFilterTipo(e.target.value)}
            style={{ flex: '1 1 200px', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', padding: '0 10px', background: 'white', color: '#34495E', outline: 'none' }}
          >
            <option value="">🎯 Todos los Tipos</option>
            {dynamicTiposActivo.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select 
            value={filterLocalidad} 
            onChange={e => setFilterLocalidad(e.target.value)}
            style={{ flex: '1 1 200px', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', padding: '0 10px', background: 'white', color: '#34495E', outline: 'none' }}
          >
            <option value="">📍 Todas las Localidades</option>
            {dynamicLocalidades.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                    checked={selectedIds.length > 0 && selectedIds.length === activos.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ width: '50px' }}>Ref</th>
                <th style={{ width: '250px' }}>Identidad (Nombre / Tipo)</th>
                <th>Serie / VIN</th>
                <th>Localidad Asignada</th>
                <th style={{ width: '220px' }}>Archivos / Evidencias</th>
                <th style={{ textAlign: 'center' }}>Certificación</th>
                <th style={{ textAlign: 'center' }}>F. Caduco</th>
                <th>Condiciones Físicas</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: '32px', color: '#95A5A6' }}>Sincronizando con Servidor Central (Supabase)...</td></tr>
              ) : activosFiltrados.map((activo) => {
                const isSelected = selectedIds.includes(activo.id);
                return (
                  <tr 
                    key={activo.id} 
                    style={{ backgroundColor: isSelected ? '#FDEDEC' : 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={(e) => {
                      if(e.target.tagName !== 'INPUT') handleEdit(activo);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#FDEDEC' : '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#FDEDEC' : 'transparent'}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(activo.id)}
                        style={{ width: '14px', height: '14px', cursor: 'pointer' }} 
                      />
                    </td>
                    <td style={{ fontWeight: 700, color: '#7F8C8D', textAlign: 'center', fontSize: '10px' }}>{activo.id.substring(0,5).toUpperCase()}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#34495E', fontSize: '13px' }}>{activo.nombre_equipo}</div>
                      <div style={{ fontSize: '11px', color: '#95A5A6', marginTop: '2px' }}>{activo.clasificacion.toUpperCase()}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#34495E', fontFamily: 'monospace' }}>{activo.numero_serie_vin || <span style={{color: '#BDC3C7'}}>N/A</span>}</td>
                    <td style={{ fontSize: '12px', color: '#34495E' }}>{activo.localidad_asignada || '-'}</td>
                    
                    {/* COLUMNA EVIDENCIAS MINIATURAS */}
                    <td>
                      {activo.activos_evidencias && activo.activos_evidencias.length > 0 ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {activo.activos_evidencias.map((file, idx) => (
                            file.file_type && file.file_type.startsWith('image/') ? (
                              <a key={idx} href={file.file_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title={file.file_name}>
                                <img src={file.file_url} alt="Ev" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC' }} />
                              </a>
                            ) : (
                              <a key={idx} href={file.file_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title={file.file_name} style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', background: '#E2E8F0', width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #CBD5E1', color: '#34495E', textDecoration: 'none', fontSize: '16px' }}>
                                <FileText size={16} style={{margin: 'auto'}} />
                              </a>
                            )
                          ))}
                        </div>
                      ) : (
                         <span style={{ fontSize: '10px', color: '#95A5A6', fontStyle: 'italic' }}>Sin adjuntos</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ background: activo.estado_certificacion ? '#D5F5E3' : '#F2F4F4', color: activo.estado_certificacion ? '#27AE60' : '#7F8C8D', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                        {activo.estado_certificacion || 'SIN DATOS'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', color: '#E67E22', fontWeight: activo.certificacion_vencimiento ? 600 : 400 }}>
                      {activo.certificacion_vencimiento ? new Date(activo.certificacion_vencimiento).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ fontSize: '11px', color: '#7F8C8D' }}>{activo.condiciones_fisicas || '-'}</td>
                  </tr>
                );
              })}
              
              {activos.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '32px', color: '#95A5A6', fontStyle: 'italic', background: '#F8FAFC' }}>
                    No hay activos registrados en la base de datos corporativa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
