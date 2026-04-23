import React, { useState, useEffect } from 'react';
import { Download, PlusCircle, Trash2, Camera, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function EntradaMateriales() {
  const DEFAULT_LINE = { id: 1, articulo_id: '', comentarios: '', cantidad: 1, condicion_material: 'NUEVO' };
  const [lineas, setLineas] = useState([{ ...DEFAULT_LINE }]);
  const [catalogo, setCatalogo] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);



  useEffect(() => {
    fetchCatalogo();
  }, []);

  const fetchCatalogo = async () => {
    const { data, error } = await supabase.from('inv_articulos').select('*').order('descripcion');
    if (!error && data) setCatalogo(data.filter(a => a.es_activo !== false));
  };



  const updateLinea = (id, field, value) => {
    setLineas(lineas.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const addLinea = () => {
    setLineas([...lineas, { id: Date.now(), articulo_id: '', comentarios: '', cantidad: 1, condicion_material: 'NUEVO' }]);
  };

  const removeLinea = (id) => {
    if (lineas.length === 1) return; // Mantener siempre al menos una fila
    setLineas(lineas.filter(l => l.id !== id));
  };

  const handleProcesarIngreso = async () => {
    const validLines = lineas.filter(l => l.articulo_id && l.cantidad > 0);
    if(validLines.length === 0) {
       alert("Por favor captura al menos un artículo válido.");
       return;
    }
    
    setIsProcessing(true);
    const folio = `ENT-${Date.now()}`;
    
    const payloads = validLines.map(l => ({
       articulo_id: l.articulo_id,
       tipo_movimiento: 'ENTRADA',
       folio_documento: folio,
       cantidad: parseInt(l.cantidad),
       condicion_material: l.condicion_material,
       comentarios: l.comentarios || '',
       usuario_id: 'SISTEMA_LOCAL' // Dummy current user
    }));
    
    const { error } = await supabase.from('inv_movimientos').insert(payloads);
    
    setIsProcessing(false);
    if(error){
      console.error(error);
      alert("Error al guardar: " + error.message);
    } else {
      alert(`¡Entrada Registrada Exitosamente! Folio: ${folio}`);
      setLineas([{ ...DEFAULT_LINE, id: Date.now() }]);
    }
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* HEADER DE MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E0E4E8', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F4287', margin: 0, display: 'flex', alignItems: 'center' }}>
            <Download size={24} style={{ marginRight: '8px' }} />
            Entrada de Materiales
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>
            Recepción e ingreso de refacciones y consumibles al almacén general o taller.
          </p>
        </div>
      </div>

      {/* SECCIÓN MAESTRO - ENCABEZADO */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#34495E', marginBottom: '16px', borderBottom: '1px solid #E0E4E8', paddingBottom: '8px' }}>
          Información del Movimiento
        </h2>
        
        <div className="grid-form" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="form-group">
            <label className="form-label">Folio Automático</label>
            <input type="text" className="form-input" disabled value="AUTOGEN-ENT-001" style={{ background: '#F8FAFC', fontWeight: 600, color: '#7F8C8D' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de Ingreso</label>
            <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="form-group">
            <label className="form-label">Razón Comercial / Proveedor</label>
            <div className="select-container">
              <select className="form-input" style={{ width: '100%' }}>
                <option>FNTX Logistics S.A. de C.V.</option>
                <option>Autocom Rail Services</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Almacén Destino</label>
            <div className="select-container">
              <select className="form-input" style={{ width: '100%' }}>
                <option>Taller Principal Centro</option>
                <option>Almacén Vías Sur</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN DETALLE (GRID DE PARTIDAS) */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E0E4E8', background: '#F8FAFC' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1F4287' }}>Partidas a Ingresar</h3>
          <button className="btn-secondary" onClick={addLinea} style={{ display: 'flex', alignItems: 'center', height: '32px', padding: '0 12px', fontSize: '13px' }}>
            <PlusCircle size={14} style={{ marginRight: '6px' }} /> Agregar Fila
          </button>
        </div>

        <div style={{ padding: '0', overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#fff' }}>
                <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                <th style={{ width: '300px' }}>Artículo ID / Nombre</th>
                <th style={{ width: '350px' }}>Comentarios o Factura Justificante</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Condición</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Cantidad</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea, idx) => (
                <tr key={linea.id}>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: '#7F8C8D', background: '#F8FAFC' }}>{idx + 1}</td>
                  <td style={{ padding: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div className="select-container" style={{ flex: 1, height: '34px', border: '1px solid #BDC3C7', borderRadius: '4px', background: '#fff', overflow: 'hidden' }}>
                        <select 
                          value={linea.articulo_id} 
                          onChange={(e) => updateLinea(linea.id, 'articulo_id', e.target.value)}
                          style={{ height: '34px', fontSize: '12px', width: '100%', background: 'transparent', outline: 'none', border: 'none' }}>
                          <option value="">-- Seleccionar Artículo --</option>
                          {catalogo.map(art => (
                             <option key={art.id} value={art.id}>[{art.codigo_erp}] {art.descripcion}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #BDC3C7', borderRadius: '4px', overflow: 'hidden' }}>
                      <input 
                        type="text" 
                        placeholder="Ej. Según Factura A-1992" 
                        value={linea.comentarios}
                        onChange={(e) => updateLinea(linea.id, 'comentarios', e.target.value)}
                        style={{ border: 'none', padding: '8px', width: '100%', outline: 'none', fontSize: '13px' }} 
                      />
                    </div>
                  </td>
                  <td style={{ padding: '6px' }}>
                    <div className="select-container" style={{ width: '100%', height: '34px', border: '1px solid #BDC3C7', borderRadius: '4px', background: '#fff' }}>
                      <select 
                        value={linea.condicion_material}
                        onChange={(e) => updateLinea(linea.id, 'condicion_material', e.target.value)}
                        style={{ height: '34px', fontSize: '12px', width: '100%', background: 'transparent', border: 'none', outline: 'none' }}>
                        <option>NUEVA</option>
                        <option>USADA</option>
                        <option>REACONDICIONADA</option>
                      </select>
                    </div>
                  </td>
                  <td style={{ padding: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #BDC3C7', borderRadius: '4px', overflow: 'hidden' }}>
                      <input 
                        type="number" 
                        value={linea.cantidad} 
                        onChange={(e) => updateLinea(linea.id, 'cantidad', e.target.value)}
                        min={1} 
                        style={{ border: 'none', padding: '8px', width: '100%', outline: 'none', fontSize: '14px', textAlign: 'center', fontWeight: 600, color: '#27ae60' }} 
                      />
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => removeLinea(linea.id)}
                      style={{ background: 'transparent', border: 'none', color: '#E74C3C', cursor: 'pointer', padding: '4px' }}
                      title="Eliminar Partida"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      style={{ background: 'transparent', border: 'none', color: '#34495E', cursor: 'pointer', padding: '4px', marginLeft: '8px' }}
                      title="Subir Fotografía (Opcional)"
                    >
                      <Camera size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '20px', background: '#F8FAFC', borderTop: '1px solid #E0E4E8', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            disabled={isProcessing}
            onClick={handleProcesarIngreso}
            style={{ height: '40px', padding: '0 24px', background: isProcessing ? '#95A5A6' : '#1F4287', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', boxShadow: '0 2px 4px rgba(31, 66, 135, 0.2)' }}>
            {isProcessing ? <CheckCircle2 size={16} className="spinner" style={{ marginRight: '8px' }} /> : <Download size={16} style={{ marginRight: '8px' }} />}
            {isProcessing ? 'Procesando...' : 'Procesar Ingreso Oficial a Almacén'}
          </button>
        </div>
      </div>



    </div>
  );
}
