import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, ChevronRight, FileSpreadsheet, File, Trash2, Calendar, User, DollarSign } from 'lucide-react';
import { TIPOS_EQUIPO, CLIENTES, LOCALIDADES, MOTIVOS_CORTE, ESTATUS_RECLAMACION, RESPONSABLES } from '../../data/catalogs';

const STAGES = [
  'Identificación', 
  'Cotización', 
  'Requisición', 
  'Orden de Compra', 
  'Operaciones', 
  'Facturación'
];

export default function RepairHubDrawer({ isOpen, onClose, repairData, onRefresh }) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageStatuses, setStageStatuses] = useState(Array(STAGES.length).fill('pending'));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  // ESTADO DEL FORMULARIO
  const [formData, setFormData] = useState({
    cliente: '', localidad: '', iniciales: '', numero_equipo: '', tipo_equipo: '', motivo_corte: '', fecha_ingreso: new Date().toISOString().split('T')[0]
  });

  React.useEffect(() => {
    if (isOpen) {
      if (repairData) {
        // Modo Edición: Mapear la etapa actuaL a un index
        const sIndex = STAGES.indexOf(repairData.etapa);
        const activeIdx = sIndex >= 0 ? sIndex : 0;
        setCurrentStageIndex(activeIdx);
        
        // Repintar lineas de estado
        const newStatuses = Array(STAGES.length).fill('pending');
        for (let i = 0; i <= activeIdx; i++) newStatuses[i] = 'completed';
        newStatuses[activeIdx] = 'in_progress';
        setStageStatuses(newStatuses);

        setFormData({
          cliente: repairData.cliente || '',
          localidad: repairData.localidad || '',
          iniciales: repairData.iniciales || '',
          numero_equipo: repairData.numero || '',
          tipo_equipo: repairData.tipo || '',
          motivo_corte: repairData.motivoCorte || '',
          fecha_ingreso: repairData.fechaIngreso && repairData.fechaIngreso.includes('-') 
            ? repairData.fechaIngreso.split('-').reverse().join('-') 
            : new Date().toISOString().split('T')[0]
        });
      } else {
        // Modo Alta
        setCurrentStageIndex(0);
        setStageStatuses(['in_progress', ...Array(STAGES.length - 1).fill('pending')]);
        setFormData({
          cliente: '', localidad: '', iniciales: '', numero_equipo: '', tipo_equipo: '', motivo_corte: '', fecha_ingreso: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, repairData]);

  if (!isOpen) return null;

  // Manejo de Drag and Drop
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    const newFiles = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      id: Math.random().toString(36).substring(7)
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (type, name) => {
    if (type.includes('pdf') || name.endsWith('.pdf')) return <FileText color="#D32F2F" size={24} />;
    if (type.includes('excel') || type.includes('spreadsheet') || name.endsWith('.xlsx')) return <FileSpreadsheet color="#388E3C" size={24} />;
    if (type.includes('xml') || name.endsWith('.xml')) return <File color="#8E24AA" size={24} />;
    return <File color="#1F4287" size={24} />;
  };

  const handleStageChange = (index) => {
    setCurrentStageIndex(index);
    setStageStatuses(prev => {
      const newSt = [...prev];
      if (newSt[index] === 'pending') {
        newSt[index] = 'in_progress';
      }
      return newSt;
    });
  };

  const saveToSupabase = async (newStageIndex) => {
    setIsSaving(true);
    try {
      // Calcular el avance basado en el número de pasos (ej: 0, 20, 40, 60, 80, 100)
      const isFinished = newStageIndex >= STAGES.length - 1;
      const calculatedProgress = isFinished ? 100 : Math.round((newStageIndex / (STAGES.length - 1)) * 100);
      const stageName = isFinished ? 'FINALIZADO' : STAGES[newStageIndex];

      const payload = {
        cliente: formData.cliente,
        localidad: formData.localidad,
        iniciales: formData.iniciales,
        numero_equipo: formData.numero_equipo,
        tipo_equipo: formData.tipo_equipo,
        motivo_corte: formData.motivo_corte,
        fecha_ingreso: formData.fecha_ingreso,
        etapa: stageName,
        avance: calculatedProgress,
        docs_count: uploadedFiles.length,
        ultima_modificacion: new Date().toISOString()
      };

      if (repairData?.uuid) {
        // Edit mode
        await supabase.from('reparaciones_shopcar').update(payload).eq('id', repairData.uuid);
      } else {
        // Create mode
        await supabase.from('reparaciones_shopcar').insert([payload]);
      }
      
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStage = async () => {
    if (currentStageIndex < STAGES.length - 1) {
      const nextIdx = currentStageIndex + 1;
      handleStageChange(nextIdx);
      await saveToSupabase(nextIdx);
    } else {
      // Finalizar del todo
      await saveToSupabase(currentStageIndex);
      onClose();
    }
  };

  const toggleCurrentStageCompleted = (e) => {
    const isChecked = e.target.checked;
    setStageStatuses(prev => {
      const newSt = [...prev];
      newSt[currentStageIndex] = isChecked ? 'completed' : 'in_progress';
      return newSt;
    });
  };

  return (
    <>
      {/* OVERLAY */}
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
          zIndex: 1000
        }} 
        onClick={onClose} 
      />

      {/* DRAWER CONTENEDOR PRINCIPAL */}
      <div 
        style={{
          position: 'fixed', top: 0, right: 0, width: '85vw', maxWidth: '1100px', height: '100vh',
          backgroundColor: 'var(--color-background)', zIndex: 1001,
          boxShadow: '-5px 0 25px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .hub-header {
            background-color: var(--color-primary-dark);
            color: white;
            padding: var(--spacing-md) var(--spacing-lg);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .hub-stepper {
            background-color: var(--color-surface);
            border-bottom: 1px solid var(--border-color);
            padding: var(--spacing-lg) var(--spacing-xl);
            position: relative;
          }
          .stepper-line {
            position: absolute; top: 50%; left: 0; width: 100%; height: 2px;
            background-color: var(--border-color); z-index: 1; transform: translateY(-50%);
          }
          .stepper-nodes {
            display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;
          }
          .step-node {
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            background: var(--color-surface); padding: 0 10px; cursor: pointer;
          }
          .step-circle {
            width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--border-color);
            display: flex; justify-content: center; align-items: center; background: white;
            font-weight: bold; transition: all 0.2s;
          }
          .step-node.pending .step-circle { border-color: #CFD8DC; color: #90A4AE; }
          .step-node.in_progress .step-circle { border-color: #F57F17; color: #F57F17; }
          .step-node.completed .step-circle { border-color: #2E7D32; color: #2E7D32; }
          
          .step-node.active .step-circle { box-shadow: 0 0 0 4px rgba(31,66,135,0.1); border-width: 3px; }
          
          .step-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); }
          .step-node.active .step-label { color: var(--color-primary-dark); }
          
          .hub-content {
            flex: 1; overflow-y: auto; padding: var(--spacing-xl); background-color: var(--color-background);
          }
          .hub-wrapper {
            background: white; border: 1px solid var(--border-color); border-radius: 6px;
            padding: var(--spacing-xl); margin-bottom: 20px; box-shadow: var(--shadow-sm);
          }
          .hub-section-title {
            font-size: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 20px; color: var(--color-primary-dark);
          }
          
          .dropzone {
            border: 2px dashed var(--border-color); border-radius: 8px; padding: 30px; text-align: center;
            background: #f8fafc; cursor: pointer; transition: all 0.2s; margin-top: 15px;
          }
          .dropzone.dragover { border-color: var(--color-primary); background: #f0f4f8; }
          .file-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-top: 15px; }
          .file-item {
            display: flex; align-items: center; gap: 12px; padding: 10px; border: 1px solid var(--border-color);
            border-radius: 6px; background: white;
          }
          .file-info { flex: 1; min-width: 0; }
          .file-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text-main); }
          .file-size { font-size: 10px; color: var(--color-text-muted); font-family: monospace; }
          
          .hub-footer {
            background: var(--color-surface); border-top: 1px solid var(--border-color);
            padding: var(--spacing-md) var(--spacing-xl); display: flex; justify-content: space-between; align-items: center;
          }
          .status-box {
            display: flex; align-items: center; gap: 15px; padding: 8px 15px;
            background: #FFF8E1; border: 1px solid #FFECB3; border-radius: 4px;
          }
        `}} />

        {/* HEADER */}
        <div className="hub-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '16px' }}>Control de Reparaciones: Item {repairData?.id || 'Nuevo'}</h2>
            {(formData.iniciales || formData.numero_equipo) && (
              <span style={{ backgroundColor: '#1565C0', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                {formData.iniciales} {formData.numero_equipo}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* STEPPER */}
        <div className="hub-stepper">
          <div className="stepper-line"></div>
          <div className="stepper-nodes">
            <div className="step-node">
              <div className="step-circle" style={{ background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }}>IN</div>
            </div>

            {STAGES.map((stage, index) => {
              const status = stageStatuses[index] || 'pending';
              const isCurrent = index === currentStageIndex;
              let className = `step-node ${status}`;
              if (isCurrent) className += ' active';
              
              return (
                <div key={stage} className={className} onClick={() => handleStageChange(index)}>
                  <div className="step-circle">
                    {status === 'completed' ? <CheckCircle2 size={20} /> : index + 1}
                  </div>
                  <span className="step-label">{stage}</span>
                </div>
              );
            })}

            <div className="step-node">
              <div className="step-circle" style={{ background: '#CFD8DC', color: 'white', borderColor: '#CFD8DC' }}>FIN</div>
            </div>
          </div>
        </div>

        {/* ESTADO DINÁMICO */}
        <div className="hub-content custom-scrollbar">
          <div className="hub-wrapper">

            {/* FORMULARIO 1: IDENTIFICACIÓN */}
            {currentStageIndex === 0 && (
              <div>
                <h3 className="hub-section-title">Identificación de la Unidad</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Cliente</label>
                    <select name="cliente" value={formData.cliente} onChange={handleFormChange}>
                      <option value="" disabled>Seleccionar Cliente...</option>
                      {CLIENTES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Localidad</label>
                    <select name="localidad" value={formData.localidad} onChange={handleFormChange}>
                      <option value="" disabled>Seleccionar Localidad...</option>
                      {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Iniciales</label>
                    <input type="text" name="iniciales" value={formData.iniciales} onChange={handleFormChange} placeholder="Ej. UTLX" style={{ width: '100%' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Num Equipo</label>
                    <input type="text" name="numero_equipo" value={formData.numero_equipo} onChange={handleFormChange} placeholder="Num ID" style={{ width: '100%' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha Ingreso</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={14} style={{ position: 'absolute', top: '8px', left: '8px', color: '#999' }}/>
                      <input type="date" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleFormChange} style={{ paddingLeft: '28px', width: '100%' }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo Equipo</label>
                    <select name="tipo_equipo" value={formData.tipo_equipo} onChange={handleFormChange}>
                      <option value="" disabled>Seleccionar Tipo...</option>
                      {TIPOS_EQUIPO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Motivo Corte</label>
                    <select name="motivo_corte" value={formData.motivo_corte} onChange={handleFormChange}>
                      <option value="" disabled>Seleccionar Motivo...</option>
                      {MOTIVOS_CORTE.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* FORMULARIO 2: COTIZACIÓN */}
            {currentStageIndex === 1 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '20px' }}>
                  <h3 style={{ borderBottom: 'none', margin: 0, padding: 0 }} className="hub-section-title">Cotización Financiera</h3>
                  <div className="badge badge-neutral" style={{ padding: '4px 10px', fontSize: '13px' }}>
                    <DollarSign size={14} style={{ marginRight: '4px' }}/> T.C. 17.50 MXN
                  </div>
                </div>
                
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '4px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    <div>
                      <h4 style={{ color: 'var(--color-success)', marginBottom: '15px' }}>Montos MXP</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group"><label className="form-label">Labor (MXP)</label><input type="number" defaultValue="0.00" style={{ fontFamily: 'monospace' }} /></div>
                        <div className="form-group"><label className="form-label">Material (MXP)</label><input type="number" defaultValue="0.00" style={{ fontFamily: 'monospace' }}/></div>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--color-primary)', marginBottom: '15px' }}>Montos USD</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group"><label className="form-label">Labor (USD)</label><input type="number" defaultValue="0.00" style={{ fontFamily: 'monospace' }}/></div>
                        <div className="form-group"><label className="form-label">Material (USD)</label><input type="number" defaultValue="0.00" style={{ fontFamily: 'monospace' }}/></div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Estatus Reclamación</label>
                      <select style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 'bold' }}>
                        {ESTATUS_RECLAMACION.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Autorizó</label>
                      <div style={{ position: 'relative' }}>
                        <User size={14} style={{ position: 'absolute', top: '8px', left: '8px', color: '#999' }}/>
                        <select style={{ paddingLeft: '28px', width: '100%' }}>
                          <option value="" disabled selected>Selecciona Autorizador...</option>
                          {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OTROS FORMULARIOS (PLACEHOLDERS DE FLUJO) */}
            {currentStageIndex >= 2 && (
              <div>
                <h3 className="hub-section-title">{STAGES[currentStageIndex]}</h3>
                <div style={{ background: '#FFF8E1', color: '#F57F17', padding: '15px', border: '1px solid #FFECB3', borderRadius: '4px', fontSize: '13px' }}>
                  Esta sección cargará los datos dinámicamente según la base de datos de {currentStageIndex === 2 ? 'Inventarios (Requisitando materiales del Kardex)' : currentStageIndex === 4 ? 'Recursos Humanos / Nóminas (Técnicos operativos)' : 'Finanzas (Integración OC y XML de Facturas)'}.
                </div>

                {currentStageIndex === 4 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Responsable Operativo (Catálogo de RH)</label>
                      <select defaultValue="">
                        <option value="" disabled>Asigna un Responsable...</option>
                        {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">% Avance Real</label>
                      <input type="number" defaultValue="50" min="0" max="100" style={{ fontFamily: 'monospace' }}/>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ARCHIVOS MULTIPLES - DRAG AND DROP */}
            <div style={{ marginTop: '40px' }}>
              <h4 style={{ fontSize: '14px', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <UploadCloud size={16} color="var(--color-secondary)" /> Archivos Adjuntos ({STAGES[currentStageIndex]})
              </h4>
              
              <div 
                className={`dropzone ${isDragging ? 'dragover' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" multiple style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileInput} />
                <UploadCloud size={32} color={isDragging ? "var(--color-primary)" : "#CBD5E1"} style={{ marginBottom: '10px' }} />
                <p style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '5px' }}>Arrastra archivos aquí o haz clic para buscar</p>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Soporta cargas múltiples simultáneas (PDF, XML, Excel, Word)</p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="file-list">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="file-item">
                      {getFileIcon(file.type, file.name)}
                      <div className="file-info">
                        <div className="file-name" title={file.name}>{file.name}</div>
                        <div className="file-size">{file.size}</div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#CBD5E1' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* FOOTER - AL ESTILO CLÁSICO ERP */}
        <div className="hub-footer">
          <div className="status-box">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: stageStatuses[currentStageIndex] === 'completed' ? '#2E7D32' : '#F57F17', fontSize: '13px' }}>
              <input 
                type="checkbox" 
                checked={stageStatuses[currentStageIndex] === 'completed'}
                onChange={toggleCurrentStageCompleted}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
              />
              ETAPA TERMINADA
            </label>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#FFECB3' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>Fecha Cierre:</span>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} style={{ padding: '2px 6px', fontSize: '12px', fontFamily: 'monospace' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={onClose} disabled={isSaving}>Cancelar</button>
            <button className="btn-primary" onClick={handleNextStage} disabled={isSaving}>
              {isSaving ? 'Guardando...' : (currentStageIndex === STAGES.length - 1 ? 'Finalizar Reparación' : 'Guardar y Continuar')} 
              {!isSaving && currentStageIndex !== STAGES.length - 1 && <ChevronRight size={16} color="white" />}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
