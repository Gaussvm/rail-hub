import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FolderLock, 
  Search, 
  UploadCloud,
  FileBadge2,
  Users,
  HardHat,
  X,
  Plus,
  Settings,
  DownloadCloud
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function BovedaCalidad() {
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, CALIDAD, SIC, RRHH
  const [documentos, setDocumentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { userProfile } = useAuth();
  const isEditor = ['DEVELOPER', 'ADMINISTRADOR', 'GERENTE'].includes(userProfile?.rol_principal);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [dummyFile, setDummyFile] = useState(null);

  const [isAddingArea, setIsAddingArea] = useState(false);
  const [isAddingCategoria, setIsAddingCategoria] = useState(false);
  const [areasList, setAreasList] = useState(['CALIDAD', 'SIC', 'RRHH']);
  const [categoriasList, setCategoriasList] = useState(['AAR', 'MANUAL_INTERNO', 'PROCEDIMIENTO', 'POLITICA', 'NOM_STPS', 'AMBIENTAL', 'PROTECCION_CIVIL', 'BRIGADAS', 'DC-3', 'EXAMEN_MEDICO']);

  const INIT_FORM = {
    folio_referencia: '',
    titulo_documento: '',
    categoria: 'AAR',
    area: 'CALIDAD',
    url_archivo: '',
    requiere_renovacion: false,
    fecha_emision: '',
    fecha_vencimiento: ''
  };

  const [form, setForm] = useState(INIT_FORM);

  useEffect(() => {
    fetchDocumentos();
  }, []);

  const fetchDocumentos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('calidad_documentos')
      .select('*')
      .order('creado_en', { ascending: false });
    
    if (!error && data) {
      setDocumentos(data);
      const uniqueAreas = [...new Set(data.map(d => d.area))].filter(Boolean);
      const uniqueCats = [...new Set(data.map(d => d.categoria))].filter(Boolean);
      // Actualizamos catálogos con los valores históricos existentes y los default
      setAreasList(prev => [...new Set([...prev, ...uniqueAreas])]);
      setCategoriasList(prev => [...new Set([...prev, ...uniqueCats])]);
    }
    setIsLoading(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setDummyFile(e.dataTransfer.files[0]);
    }
  };

  const handleEdit = (doc) => {
    setEditingId(doc.id);
    setForm({
      folio_referencia: doc.folio_referencia || '',
      titulo_documento: doc.titulo_documento || '',
      categoria: doc.categoria || 'AAR',
      area: doc.area || 'CALIDAD',
      url_archivo: doc.url_archivo || '',
      requiere_renovacion: doc.requiere_renovacion,
      fecha_emision: doc.fecha_emision || '',
      fecha_vencimiento: doc.fecha_vencimiento || ''
    });
    setDummyFile(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titulo_documento || !form.categoria) {
      alert("Título del documento y Categoría son obligatorios.");
      return;
    }
    
    setIsProcessing(true);
    
    // Auto-calculate estatus en base a fechas (Dummy simplificado para base de datos local)
    let calcEstatus = 'ESTATICO';
    if(form.requiere_renovacion && form.fecha_vencimiento) {
        const today = new Date();
        const vDate = new Date(form.fecha_vencimiento);
        const timeDiff = vDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff < 0) calcEstatus = 'VENCIDO';
        else if (daysDiff <= 30) calcEstatus = 'POR_VENCER';
        else calcEstatus = 'VIGENTE';
    } else {
        calcEstatus = 'VIGENTE';
    }

    try {
      let finalUrl = form.url_archivo;
      if (dummyFile) {
        const fileExt = dummyFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${form.area || 'GENERAL'}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documentos_boveda')
          .upload(filePath, dummyFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl: url } } = supabase.storage
          .from('documentos_boveda')
          .getPublicUrl(filePath);
          
        finalUrl = url;
      }

      const payload = { 
          ...form,
          fecha_emision: form.fecha_emision || null,
          fecha_vencimiento: form.fecha_vencimiento || null,
          estatus: calcEstatus,
          url_archivo: finalUrl
      };

      if (editingId) {
        const { error } = await supabase.from('calidad_documentos').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('calidad_documentos').insert([payload]);
        if (error) throw error;
      }
      
      await fetchDocumentos();
      setShowModal(false);
      setEditingId(null);
      setIsAddingArea(false);
      setIsAddingCategoria(false);
      setForm(INIT_FORM);
      setDummyFile(null);
    } catch (e) {
      alert(`Error al guardar: ${e.message}`);
    }
    setIsProcessing(false);
  };

  // Helper para mostrar color de estado
  const getStatusBadge = (estatus) => {
    switch(estatus) {
      case 'VIGENTE': return <span style={{ padding: '4px 8px', background: '#E8F5E9', color: '#27AE60', borderRadius: '12px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12}/> VIGENTE</span>;
      case 'POR_VENCER': return <span style={{ padding: '4px 8px', background: '#FFF8E1', color: '#F59D00', borderRadius: '12px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> POR VENCER</span>;
      case 'VENCIDO': return <span style={{ padding: '4px 8px', background: '#FEE2E2', color: '#EF4444', borderRadius: '12px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12}/> VENCIDO</span>;
      case 'ESTATICO': return <span style={{ padding: '4px 8px', background: '#F8FAFC', color: '#64748B', borderRadius: '12px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #E2E8F0' }}><FolderLock size={12}/> PERPETUO</span>;
      default: return <span style={{ padding: '4px 8px', background: '#F1F5F9', color: '#64748B', borderRadius: '12px', fontSize: '10px', fontWeight: 700 }}>{estatus}</span>;
    }
  };

  // Para mantener compatibilidad con históricos
  const getCategorias = () => categoriasList;

  // Estadísticas para Dashboard
  const stats = {
      total: documentos.length,
      vencidos: documentos.filter(d => d.estatus === 'VENCIDO').length,
      alerta: documentos.filter(d => d.estatus === 'POR_VENCER').length,
      calidad: documentos.filter(d => d.area === 'CALIDAD').length,
      sic: documentos.filter(d => d.area === 'SIC').length,
      rrhh: documentos.filter(d => d.area === 'RRHH').length,
  };

  const filteredDocs = documentos.filter(d => {
      const matchSearch = (d.titulo_documento || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.folio_referencia || '').toLowerCase().includes(searchTerm.toLowerCase());
      if(activeTab === 'DASHBOARD') return matchSearch; // En dashboard mostramos todos (o top recentes)
      if(activeTab === 'CALIDAD') return matchSearch && d.area === 'CALIDAD';
      if(activeTab === 'SIC') return matchSearch && d.area === 'SIC';
      if(activeTab === 'RRHH') return matchSearch && d.area === 'RRHH';
      return matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E0E4E8', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F4287', margin: 0, display: 'flex', alignItems: 'center' }}>
            <ShieldCheck size={28} style={{ marginRight: '8px', color: '#27AE60' }} />
            Bóveda de Calidad y Cumplimiento
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>
            Centro de control corporativo para AAR, STPS, normativas y expedientes.
          </p>
        </div>
        
        {activeTab !== 'DASHBOARD' && (
          <button 
            onClick={() => {
              setEditingId(null);
              setForm({...INIT_FORM, area: activeTab});
              setShowModal(true);
            }}
            style={{ background: '#1F4287', color: 'white', border: 'none', height: '36px', padding: '0 16px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(31, 66, 135, 0.2)' }}
          >
            <UploadCloud size={16} style={{ marginRight: '8px' }} /> Nuevo Documento
          </button>
        )}
      </div>

      {/* TABS NAVEGACIÓN */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
         <button onClick={() => setActiveTab('DASHBOARD')} style={{ background: 'transparent', border: 'none', padding: '8px 16px', color: activeTab === 'DASHBOARD' ? '#1F4287' : '#7F8C8D', borderBottom: activeTab === 'DASHBOARD' ? '3px solid #1F4287' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
               <AlertTriangle size={16}/> Resumen y Alertas
            </div>
            <div style={{ fontSize: '11px', color: '#95A5A6', fontWeight: 400 }}>Indicadores y semáforos de vigencia</div>
         </button>

         <button onClick={() => setActiveTab('CALIDAD')} style={{ background: 'transparent', border: 'none', padding: '8px 16px', color: activeTab === 'CALIDAD' ? '#1F4287' : '#7F8C8D', borderBottom: activeTab === 'CALIDAD' ? '3px solid #1F4287' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
               <FileBadge2 size={16}/> Corporativo / AAR
            </div>
            <div style={{ fontSize: '11px', color: '#95A5A6', fontWeight: 400 }}>Manuales, procedimientos e instructivos</div>
         </button>

         <button onClick={() => setActiveTab('SIC')} style={{ background: 'transparent', border: 'none', padding: '8px 16px', color: activeTab === 'SIC' ? '#1F4287' : '#7F8C8D', borderBottom: activeTab === 'SIC' ? '3px solid #1F4287' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
               <HardHat size={16}/> S.I.C. (STPS / NOM)
            </div>
            <div style={{ fontSize: '11px', color: '#95A5A6', fontWeight: 400 }}>Seguridad STPS, ecología y protección civil</div>
         </button>

         <button onClick={() => setActiveTab('RRHH')} style={{ background: 'transparent', border: 'none', padding: '8px 16px', color: activeTab === 'RRHH' ? '#1F4287' : '#7F8C8D', borderBottom: activeTab === 'RRHH' ? '3px solid #1F4287' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
               <Users size={16}/> Evidencias Personal
            </div>
            <div style={{ fontSize: '11px', color: '#95A5A6', fontWeight: 400 }}>Certificaciones, DC-3 y expedientes</div>
         </button>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'DASHBOARD' && (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', background: '#fff', borderLeft: '4px solid #1F4287' }}>
               <div style={{ fontSize: '12px', color: '#7F8C8D', fontWeight: 600 }}>Total Documentos</div>
               <div style={{ fontSize: '28px', fontWeight: 800, color: '#2C3E50', marginTop: '8px' }}>{stats.total}</div>
            </div>
            <div className="card" style={{ padding: '20px', background: '#fff', borderLeft: '4px solid #E74C3C' }}>
               <div style={{ fontSize: '12px', color: '#7F8C8D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={14} color="#E74C3C"/> Documentos Vencidos</div>
               <div style={{ fontSize: '28px', fontWeight: 800, color: '#E74C3C', marginTop: '8px' }}>{stats.vencidos}</div>
            </div>
            <div className="card" style={{ padding: '20px', background: '#fff', borderLeft: '4px solid #F59D00' }}>
               <div style={{ fontSize: '12px', color: '#7F8C8D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} color="#F59D00"/> Vencen en 30 Días</div>
               <div style={{ fontSize: '28px', fontWeight: 800, color: '#F59D00', marginTop: '8px' }}>{stats.alerta}</div>
            </div>
            <div className="card" style={{ padding: '20px', background: '#fff', borderLeft: '4px solid #27AE60' }}>
               <div style={{ fontSize: '12px', color: '#7F8C8D', fontWeight: 600 }}>Archivos Válidos / Estáticos</div>
               <div style={{ fontSize: '28px', fontWeight: 800, color: '#27AE60', marginTop: '8px' }}>{stats.total - stats.vencidos - stats.alerta}</div>
            </div>
         </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative', width: '350px' }}>
            <Search size={16} color="#95A5A6" style={{ position: 'absolute', top: '10px', left: '12px' }} />
            <input 
              type="text" 
              placeholder="Buscar folio, título o norma..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: '36px', paddingLeft: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ width: '120px' }}>Folio / Norma</th>
                <th style={{ width: '300px' }}>Título del Documento</th>
                <th style={{ width: '120px' }}>Clasificación</th>
                <th style={{ width: '120px' }}>Subida o Emisión</th>
                <th style={{ width: '120px' }}>Vencimiento</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Indicador</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Cargando bóveda...</td></tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                   <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: '#7F8C8D' }}>
                      <FolderLock size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
                      <div>No se encontraron documentos en esta vista.</div>
                   </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600, color: '#34495E' }}>{doc.folio_referencia || 'N/A'}</td>
                    <td style={{ fontWeight: 600, color: '#1F4287' }}>{doc.titulo_documento}</td>
                    <td>
                       <span style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: '#64748B' }}>
                         {doc.categoria}
                       </span>
                    </td>
                    <td>{doc.fecha_emision ? new Date(doc.fecha_emision).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ fontWeight: doc.fecha_vencimiento ? 600 : 400 }}>{doc.fecha_vencimiento ? new Date(doc.fecha_vencimiento).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ textAlign: 'center' }}>
                       <div style={{ display: 'inline-flex' }}>{getStatusBadge(doc.estatus)}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => doc.url_archivo ? window.open(doc.url_archivo, '_blank') : alert('Este registro normativo no tiene un archivo físico adjunto.')}
                          title={doc.url_archivo ? "Ver Documento Original" : "Sin Archivo Adjunto"}
                          style={{ background: doc.url_archivo ? '#E3F2FD' : '#F8FAFC', border: doc.url_archivo ? '1px solid #90CAF9' : '1px solid #CBD5E1', color: doc.url_archivo ? '#1976D2' : '#95A5A6', padding: '6px', borderRadius: '4px', cursor: doc.url_archivo ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <ExternalLink size={14} />
                        </button>
                        {/* Descarga Forzada (HTML5 download) */}
                        <a 
                          href={doc.url_archivo ? `${doc.url_archivo}?download=1` : '#'} 
                          download
                          target="_blank"
                          rel="noreferrer"
                          title={doc.url_archivo ? "Descargar Archivo" : "Sin Archivo Adjunto"}
                          style={{ background: doc.url_archivo ? '#DEF7EC' : '#F8FAFC', border: doc.url_archivo ? '1px solid #84E1BC' : '1px solid #CBD5E1', color: doc.url_archivo ? '#059669' : '#95A5A6', padding: '6px', borderRadius: '4px', cursor: doc.url_archivo ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', pointerEvents: doc.url_archivo ? 'auto' : 'none' }}
                        >
                          <DownloadCloud size={14} />
                        </a>
                        {isEditor && (
                          <button 
                            onClick={() => handleEdit(doc)}
                            title="Editar Documentación"
                            style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#4B5563', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Settings size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INGRESO DE DOCUMENTO */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)', overflowY: 'auto', padding: '40px 0' }}>
           <div className="card" style={{ width: '650px', background: 'white', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1F4287', color: 'white', borderRadius: '8px 8px 0 0' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color="white" />
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'white' }}>{editingId ? 'Editar Documento de Bóveda' : 'Clasificar Documento en Bóveda'}</h2>
                 </div>
                 <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}><X size={24}/></button>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 
                 <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Área Responsable</label>
                       <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                         {isAddingArea ? (
                            <>
                              <input 
                                autoFocus 
                                type="text"
                                style={{ flex: 1, height: '36px', border: '1px solid #3498DB', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none' }}
                                value={form.area}
                                onChange={e => setForm({...form, area: e.target.value.toUpperCase()})}
                                placeholder="Ej. FINANZAS" 
                              />
                              <button onClick={() => setIsAddingArea(false)} style={{ background: '#FEE2E2', border: 'none', color: '#EF4444', width: '36px', height: '36px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={16} />
                              </button>
                            </>
                         ) : (
                            <div className="select-container" style={{ flex: 1 }}>
                               <select 
                                 value={form.area} 
                                 onChange={e => {
                                   if(e.target.value === 'NEW') {
                                     setIsAddingArea(true);
                                     setForm({...form, area: ''});
                                   } else {
                                     setForm({...form, area: e.target.value});
                                   }
                                 }}
                                 style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none', appearance: 'none' }}
                               >
                                  <option value="">-- Seleccionar --</option>
                                  {areasList.map(a => <option key={a} value={a}>{a}</option>)}
                                  <option value="NEW" style={{ fontWeight: 'bold', color: '#1F4287' }}>+ Agregar nuevo departamento...</option>
                               </select>
                            </div>
                         )}
                       </div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Tipo de Normativa</label>
                       <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                         {isAddingCategoria ? (
                            <>
                              <input 
                                autoFocus 
                                type="text"
                                style={{ flex: 1, height: '36px', border: '1px solid #3498DB', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none' }}
                                value={form.categoria}
                                onChange={e => setForm({...form, categoria: e.target.value.toUpperCase()})}
                                placeholder="Ej. AUDITORIA" 
                              />
                              <button onClick={() => setIsAddingCategoria(false)} style={{ background: '#FEE2E2', border: 'none', color: '#EF4444', width: '36px', height: '36px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={16} />
                              </button>
                            </>
                         ) : (
                            <div className="select-container" style={{ flex: 1 }}>
                               <select 
                                 value={form.categoria} 
                                 onChange={e => {
                                   if(e.target.value === 'NEW') {
                                     setIsAddingCategoria(true);
                                     setForm({...form, categoria: ''});
                                   } else {
                                     setForm({...form, categoria: e.target.value});
                                   }
                                 }} 
                                 style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none', appearance: 'none' }}
                               >
                                  <option value="">-- Seleccionar --</option>
                                  {getCategorias().map(c => <option key={c} value={c}>{c}</option>)}
                                  <option value="NEW" style={{ fontWeight: 'bold', color: '#1F4287' }}>+ Agregar nueva normativa...</option>
                               </select>
                            </div>
                         )}
                       </div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Folio o Referencia</label>
                       <input type="text" value={form.folio_referencia} onChange={e => setForm({...form, folio_referencia: e.target.value.toUpperCase()})} placeholder="Ej. AAR-M-214" style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                    </div>
                    <div style={{ flex: 2 }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Título del Documento <span style={{color: 'red'}}>*</span></label>
                       <input type="text" value={form.titulo_documento} onChange={e => setForm({...form, titulo_documento: e.target.value.toUpperCase()})} placeholder="Nombre completo del manual o certificación..." style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                    </div>
                 </div>

                 {/* Archivo D&D */}
                 <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Anexar Archivo PDF / Word</label>
                     <div 
                         onDragEnter={handleDrag}
                         onDragLeave={handleDrag}
                         onDragOver={handleDrag}
                         onDrop={handleDrop}
                         style={{ 
                            border: dragActive ? '2px dashed #2980b9' : '2px dashed #CBD5E1', 
                            borderRadius: '8px', 
                            padding: '24px', 
                            textAlign: 'center', 
                            background: dragActive ? '#ebf5fb' : '#F8FAFC',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                         }}>
                         <input 
                           type="file" 
                           accept=".pdf,.doc,.docx"
                           onChange={e => e.target.files && setDummyFile(e.target.files[0])}
                           style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                         />
                         
                         {dummyFile ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                               <FileText size={28} color="#27AE60" style={{ marginBottom: '8px' }} />
                               <div style={{ fontSize: '13px', color: '#27AE60', fontWeight: 700 }}>{dummyFile.name}</div>
                            </div>
                         ) : (
                            <>
                              <UploadCloud size={28} color={dragActive ? '#2980b9' : '#95A5A6'} style={{ marginBottom: '8px' }} />
                              <div style={{ fontSize: '13px', color: '#34495E', fontWeight: 600 }}>{editingId ? 'Arrastra un PDF nuevo **solo si** deseas sobrescribir el actual' : 'Arrastra tu documento normativo PDF aquí'}</div>
                            </>
                         )}
                     </div>
                 </div>

                 {/* Fechas */}
                 <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                       <input 
                         type="checkbox" 
                         checked={form.requiere_renovacion} 
                         onChange={e => setForm({...form, requiere_renovacion: e.target.checked})} 
                         id="req-renovacion" 
                         style={{ transform: 'scale(1.2)' }}
                       />
                       <label htmlFor="req-renovacion" style={{ fontSize: '14px', fontWeight: 700, color: '#1F4287', cursor: 'pointer' }}>
                          Este documento es una Cédula/Certificación y Requiere Vigencia
                       </label>
                    </div>

                    {form.requiere_renovacion ? (
                        <div style={{ display: 'flex', gap: '16px', background: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                           <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#7F8C8D', marginBottom: '4px' }}>Fecha de Emisión</label>
                              <input type="date" value={form.fecha_emision} onChange={e => setForm({...form, fecha_emision: e.target.value})} style={{ width: '100%', height: '32px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 8px', outline: 'none' }} />
                           </div>
                           <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E74C3C', marginBottom: '4px' }}>Fecha de Vencimiento (Genera Alertas)</label>
                              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({...form, fecha_vencimiento: e.target.value})} style={{ width: '100%', height: '32px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 8px', outline: 'none' }} />
                           </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '12px', color: '#7F8C8D', paddingLeft: '24px' }}>
                           El sistema mapeará este documento como estático y permanente (No expirará).
                        </div>
                    )}
                 </div>

              </div>
              <div style={{ padding: '20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderRadius: '0 0 8px 8px' }}>
                 <button disabled={isProcessing} onClick={() => setShowModal(false)} style={{ background: 'white', border: '1px solid #CBD5E1', color: '#34495E', height: '40px', padding: '0 20px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                 <button disabled={isProcessing} onClick={handleSave} style={{ background: '#27AE60', border: 'none', color: 'white', height: '40px', padding: '0 20px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   {isProcessing ? 'Guardando en Bóveda...' : 'Cifrar Documento'}
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
