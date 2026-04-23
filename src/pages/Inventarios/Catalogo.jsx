import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, CheckCircle2, X, PackageOpen, Image as ImageIcon, CheckSquare, Square, UploadCloud, XCircle, FileImage } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function CatalogoMaestro() {
  const [articulos, setArticulos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isAddingCategoria, setIsAddingCategoria] = useState(false);
  
  // Drag and Drop State
  const [dragActive, setDragActive] = useState(false);
  const [dummyFiles, setDummyFiles] = useState([]);

  const INIT_FORM = {
    codigo_erp: '',
    sku_alterno: '',
    descripcion: '',
    descripcion_ingles: '',
    categoria: 'CONSUMIBLES',
    unidad_medida: 'PIEZA',
    proveedor: '',
    imagen_url: '',
    stock_minimo: 5,
    es_activo: true,
    localidad_actual: 'GLOBAL' // Legacy integration fallback
  };

  const [form, setForm] = useState(INIT_FORM);

  // Cats Dummies (Pueden volverse dinámicos más tarde)
  const UOM_LIST = ['PIEZA', 'LITRO', 'KILOGRAMO', 'METRO', 'CAJA', 'GALÓN', 'KIT'];
  const CATEGORIA_LIST = ['CONSUMIBLES', 'LUBRICANTES', 'HERRAMIENTAS', 'REFACCIONES ELÉCTRICAS', 'REFACCIONES MECÁNICAS'];
  
  const dynamicCategorias = Array.from(new Set([...CATEGORIA_LIST, ...articulos.map(a => a.categoria).filter(Boolean)])).sort();

  useEffect(() => {
    fetchCatalogo();
  }, []);

  const fetchCatalogo = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('inv_articulos').select('*').order('creado_en', { ascending: false });
    if (!error && data) {
      setArticulos(data);
    }
    setIsLoading(false);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setIsAddingCategoria(false);
    const preSKU = `ASE-${Math.floor(100000 + Math.random() * 900000)}`;
    setForm({ ...INIT_FORM, codigo_erp: preSKU });
    setShowModal(true);
  };

  const handleEdit = (art) => {
    setEditingId(art.id);
    setForm({
      codigo_erp: art.codigo_erp || '',
      sku_alterno: art.sku_alterno || '',
      descripcion: art.descripcion || '',
      descripcion_ingles: art.descripcion_ingles || '',
      categoria: art.categoria || 'CONSUMIBLES',
      unidad_medida: art.unidad_medida || 'PIEZA',
      proveedor: art.proveedor || '',
      imagen_url: art.imagen_url || '',
      stock_minimo: art.stock_minimo || 5,
      es_activo: art.es_activo !== false, // Defaults to true if null/undefined
      localidad_actual: art.localidad_actual || 'GLOBAL'
    });
    setDummyFiles([]); // Reset files on edit
    setShowModal(true);
  };

  // Drag handlers
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
      setDummyFiles([...dummyFiles, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setDummyFiles([...dummyFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleSave = async () => {
    if (!form.codigo_erp || !form.descripcion) {
      alert("SKU y Descripción son obligatorios.");
      return;
    }
    
    setIsProcessing(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('inv_articulos').update(form).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('inv_articulos').insert([{ ...form, stock_actual: 0 }]);
        if (error) throw error;
      }
      await fetchCatalogo();
      setShowModal(false);
    } catch (e) {
      if(e.code === '23505') alert("Error: El Código ERP ya existe.");
      else alert(`Error: ${e.message}`);
    }
    setIsProcessing(false);
  };

  const filteredActivos = articulos.filter(a => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (a.codigo_erp?.toLowerCase().includes(q) || a.descripcion?.toLowerCase().includes(q) || a.proveedor?.toLowerCase().includes(q));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E0E4E8', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F4287', margin: 0, display: 'flex', alignItems: 'center' }}>
            <PackageOpen size={24} style={{ marginRight: '8px' }} />
            Catálogo Maestro de Artículos
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>
            Base de datos unificada de refacciones, consumibles y herramientas.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleOpenNew}
            style={{ background: '#27ae60', color: 'white', border: 'none', height: '36px', padding: '0 16px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(39, 174, 96, 0.2)' }}
          >
            <Plus size={16} style={{ marginRight: '8px' }} /> Nuevo Artículo
          </button>
        </div>
      </div>

      {/* LISTA DE ARTICULOS */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <div style={{ position: 'relative', width: '350px' }}>
            <Search size={16} color="#95A5A6" style={{ position: 'absolute', top: '10px', left: '12px' }} />
            <input 
              type="text" 
              placeholder="Buscar por SKU, nombre o proveedor..." 
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
                <th style={{ width: '40px', textAlign: 'center' }}><ImageIcon size={14} color="#7F8C8D"/></th>
                <th style={{ width: '120px' }}>Código SKU</th>
                <th style={{ width: '250px' }}>Descripción</th>
                <th style={{ width: '100px', textAlign: 'center' }}>UOM</th>
                <th style={{ width: '150px' }}>Categoría / Tipo</th>
                <th style={{ width: '150px' }}>Proveedor (Opcional)</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Stock Min.</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Estatus</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Cargando catálogo...</td></tr>
              ) : filteredActivos.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No hay artículos registrados.</td></tr>
              ) : (
                filteredActivos.map(art => (
                  <tr key={art.id} style={{ opacity: art.es_activo === false ? 0.6 : 1 }}>
                    <td style={{ textAlign: 'center' }}>
                      {art.imagen_url ? (
                        <img src={art.imagen_url} alt="Item" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '24px', height: '24px', background: '#ecf0f1', borderRadius: '4px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <ImageIcon size={12} color="#bdc3c7" />
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: '#1F4287' }}>
                      {art.codigo_erp}
                      {art.sku_alterno && <div style={{ fontSize: '10px', color: '#7F8C8D', marginTop: '2px', fontWeight: 500 }}>Alt: {art.sku_alterno}</div>}
                    </td>
                    <td style={{ fontWeight: 600, color: '#34495E' }}>
                        {art.descripcion}
                        {art.descripcion_ingles && <div style={{ fontSize: '10px', color: '#95a5a6', marginTop: '2px' }}>{art.descripcion_ingles}</div>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                       <span style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: '#64748B' }}>
                         {art.unidad_medida || 'N/A'}
                       </span>
                    </td>
                    <td>{art.categoria || '-'}</td>
                    <td>{art.proveedor || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{art.stock_minimo}</td>
                    <td style={{ textAlign: 'center' }}>
                      {art.es_activo !== false ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#E8F5E9', color: '#27AE60', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700 }}>
                          <CheckCircle2 size={10} /> ACTIVO
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEE2E2', color: '#EF4444', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700 }}>
                          <X size={10} /> INACTIVO
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleEdit(art)}
                        style={{ background: '#E3F2FD', border: '1px solid #90CAF9', color: '#1976D2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORMULARIO DE ARTÍCULO */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)', overflowY: 'auto', padding: '40px 0' }}>
           <div className="card" style={{ width: '600px', background: 'white', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                 <h2 style={{ margin: 0, fontSize: '18px', color: '#1F4287', fontWeight: 700 }}>
                   {editingId ? 'Editar Artículo' : 'Nuevo Artículo en Catálogo'}
                 </h2>
                 <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7F8C8D' }}><X size={24}/></button>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 
                 {/* ID & Proveedor Row */}
                 <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Id Artículo (Auto) <span style={{color: 'red'}}>*</span></label>
                       <input type="text" disabled value={form.codigo_erp} style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#F1F5F9', color: '#64748B', fontWeight: 700, cursor: 'not-allowed' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>SKU Alterno / Fabricante</label>
                       <input type="text" value={form.sku_alterno} onChange={e => setForm({...form, sku_alterno: e.target.value.toUpperCase()})} placeholder="Ej. LUB-ORIG-100" style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Id Proveedor</label>
                       <input type="text" value={form.proveedor} onChange={e => setForm({...form, proveedor: e.target.value.toUpperCase()})} placeholder="Ej. WABTEC" style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                    </div>
                 </div>

                 {/* Descriptions */}
                 <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Español Descripción <span style={{color: 'red'}}>*</span></label>
                    <input type="text" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value.toUpperCase()})} placeholder="Escribe la descripción completa..." style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Descripción Inglés (Opcional)</label>
                    <input type="text" value={form.descripcion_ingles} onChange={e => setForm({...form, descripcion_ingles: e.target.value.toUpperCase()})} placeholder="English translated description..." style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                 </div>

                 {/* Categorization Row */}
                 <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Tipo de Activo / Categoría</label>
                       
                       {isAddingCategoria ? (
                         <div style={{ display: 'flex', gap: '8px' }}>
                           <input 
                             type="text" 
                             value={form.categoria} 
                             onChange={e => setForm({...form, categoria: e.target.value.toUpperCase()})} 
                             placeholder="Escribe la nueva categoría..." 
                             style={{ flex: 1, height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none' }} 
                             autoFocus
                           />
                           <button 
                             onClick={() => setIsAddingCategoria(false)}
                             style={{ height: '36px', width: '36px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7F8C8D' }}
                           >
                             <X size={16} />
                           </button>
                         </div>
                       ) : (
                         <div style={{ display: 'flex', gap: '4px' }}>
                           <div className="select-container" style={{ flex: 1 }}>
                             <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none', background: 'white' }}>
                                <option value="">-- Seleccionar --</option>
                                {dynamicCategorias.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                           </div>
                           <button 
                             onClick={() => { setForm({...form, categoria: ''}); setIsAddingCategoria(true); }}
                             title="Crear Nueva Categoría"
                             style={{ height: '36px', width: '36px', background: '#1F4287', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                           >
                             <Plus size={16} />
                           </button>
                         </div>
                       )}
                    </div>
                    <div style={{ width: '150px' }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Unidad de Medida</label>
                       <div className="select-container" style={{ width: '100%' }}>
                         <select value={form.unidad_medida} onChange={e => setForm({...form, unidad_medida: e.target.value})} style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none', background: 'white' }}>
                            {UOM_LIST.map(u => <option key={u} value={u}>{u}</option>)}
                         </select>
                       </div>
                    </div>
                    <div style={{ width: '100px' }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Stock Min.</label>
                       <input type="number" value={form.stock_minimo} onChange={e => setForm({...form, stock_minimo: parseInt(e.target.value) || 0})} style={{ width: '100%', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 12px', fontSize: '13px', outline: 'none', textAlign: 'center' }} />
                    </div>
                 </div>

                 {/* Image Drag & Drop & Status Row */}
                 <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '8px' }}>Galería Multimedia (Fotos / Videos)</label>
                       
                       <div 
                         onDragEnter={handleDrag}
                         onDragLeave={handleDrag}
                         onDragOver={handleDrag}
                         onDrop={handleDrop}
                         style={{ 
                            border: dragActive ? '2px dashed #2980b9' : '2px dashed #CBD5E1', 
                            borderRadius: '8px', 
                            padding: '20px', 
                            textAlign: 'center', 
                            background: dragActive ? '#ebf5fb' : '#F8FAFC',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            position: 'relative'
                         }}>
                         <input 
                           type="file" 
                           multiple 
                           accept="image/*,video/*"
                           onChange={handleFileChange}
                           style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                         />
                         <UploadCloud size={28} color={dragActive ? '#2980b9' : '#95A5A6'} style={{ marginBottom: '8px' }} />
                         <div style={{ fontSize: '13px', color: '#34495E', fontWeight: 600 }}>Arrastra tus archivos aquí</div>
                         <div style={{ fontSize: '11px', color: '#7F8C8D', marginTop: '4px' }}>Soporta JPG, PNG, y MP4 (Max 10MB)</div>
                       </div>

                       {/* Preview de Archivos */}
                       {dummyFiles.length > 0 && (
                         <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                           {dummyFiles.map((f, i) => (
                             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ecf0f1', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#34495E', maxWidth: '140px' }}>
                               <FileImage size={14} color="#7F8C8D" style={{ minWidth: '14px' }} />
                               <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                               <XCircle size={14} color="#e74c3c" cursor="pointer" onClick={() => setDummyFiles(dummyFiles.filter((_, idx) => idx !== i))} style={{ minWidth: '14px' }} />
                             </div>
                           ))}
                         </div>
                       )}
                    </div>

                    <div style={{ width: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                       <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#34495E', marginBottom: '12px' }}>Estatus del Artículo</label>
                       <button 
                         onClick={() => setForm({...form, es_activo: !form.es_activo})}
                         style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: form.es_activo ? '#27AE60' : '#E74C3C', fontWeight: 700, fontSize: '14px', width: '100%' }}
                       >
                         {form.es_activo ? <CheckSquare size={28} /> : <Square size={28} />}
                         {form.es_activo ? 'ES ACTIVO' : 'INACTIVO'}
                       </button>
                    </div>
                 </div>

              </div>
              <div style={{ padding: '20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                 <button disabled={isProcessing} onClick={() => setShowModal(false)} style={{ background: 'white', border: '1px solid #CBD5E1', color: '#34495E', height: '40px', padding: '0 20px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                 <button disabled={isProcessing} onClick={handleSave} style={{ background: '#1F4287', border: 'none', color: 'white', height: '40px', padding: '0 20px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   {isProcessing ? <CheckCircle2 size={16} className="spinner" /> : <CheckCircle2 size={16} />}
                   {isProcessing ? 'Guardando...' : 'Guardar Artículo'}
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
