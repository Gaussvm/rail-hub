import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowLeft, Save, Trash2, FileText, ChevronDown, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Mocks basados en la captura del usuario
const MOCK_REQUISICIONES = [
  { id: 'RE-9014', localidad: 'SITAO TIGRE, GTO', fecha: '13-04-2026', usuario: 'SDELVALLE', car: '712816', lineas: 4, total: 12500.00 },
  { id: 'RE-9015', localidad: 'MÉXICO D.F.', fecha: '12-04-2026', usuario: 'MRODRIGUEZ', car: '1376', lineas: 1, total: 8500.00 },
  { id: 'RE-9016', localidad: 'MONTERREY P.', fecha: '10-04-2026', usuario: 'JRAMIREZ', car: '546273', lineas: 12, total: 45000.00 },
];

export default function Requisiciones() {
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [activeReq, setActiveReq] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequisiciones = async () => {
    setLoading(true);
    const { data: dbData, error } = await supabase
      .from('requisiciones')
      .select('*, req_partidas(*)')
      .order('created_at', { ascending: false });

    if (!error && dbData) {
      const mapped = dbData.map(item => ({
        uuid: item.id,
        id: item.folio_re,
        localidad: item.localidad || 'SIN LOCALIDAD',
        fecha: new Date(item.created_at).toLocaleDateString('es-MX'),
        usuario: item.usuario_solicita,
        car: item.shopcar_carro,
        lineas: item.req_partidas ? item.req_partidas.length : 0,
        total: parseFloat(item.monto_total_estimado) || 0,
        partidasRaw: item.req_partidas || []
      }));
      setData(mapped.length > 0 ? mapped : MOCK_REQUISICIONES);
    } else {
      setData(MOCK_REQUISICIONES);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequisiciones();
  }, []);

  // VISTA LISTA PRINCIPAL
  const renderList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F4287', margin: 0 }}>Requisiciones</h1>
          <p style={{ fontSize: '13px', color: '#7F8C8D', marginTop: '4px' }}>Solicitudes internas de material y servicios</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary">
            <FileText size={16} /> Exportar Excel
          </button>
          <button className="btn-success" onClick={() => { setActiveReq(null); setPartidas([]); setView('create'); }}>
            <Plus size={16} /> Nueva Requisición
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="card" style={{ padding: '20px', background: '#ffffff', marginBottom: '8px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid #E0E4E8', paddingRight: '20px', marginRight: '20px' }}>
            <Filter size={18} color="#7F8C8D" style={{ marginRight: '8px' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#2C3E50' }}>Filtros</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8f9fa', border: '1px solid #E0E4E8', borderRadius: '4px', padding: '6px 12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#7F8C8D', marginRight: '8px' }}>Mes:</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#2C3E50' }}>ABRIL 2026</span>
              <ChevronDown size={14} style={{ marginLeft: '8px', color: '#7F8C8D' }} />
            </div>
          </div>
          
          <div style={{ flex: 1 }}></div>
          
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#7F8C8D" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Buscar ID o Unidad..." style={{ paddingLeft: '32px', width: '250px' }} />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '110px' }}>ID Req.</th>
                <th>Localidad</th>
                <th style={{ width: '120px' }}>Fecha</th>
                <th style={{ width: '140px' }}>Usuario Solicita</th>
                <th style={{ width: '110px' }}>Asoc. Car</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Líneas</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Total Estimado</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onDoubleClick={() => handleEdit(row)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: '#278EA5' }}>{row.id}</td>
                  <td>{row.localidad}</td>
                  <td style={{ fontSize: '12px' }}>{row.fecha}</td>
                  <td style={{ fontWeight: 500 }}>{row.usuario}</td>
                  <td style={{ fontFamily: 'monospace' }}>{row.car}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-neutral">{row.lineas}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '14px' }}>
                    ${row.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => handleEdit(row)} style={{ background: 'transparent', border: 'none', color: '#1F4287', cursor: 'pointer', fontWeight: 'bold' }}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ESTADOS DE FORMULARIO (Alta/Edicion)
  const [partidas, setPartidas] = useState([]);

  const handleEdit = (req) => {
    setActiveReq(req);
    if (req.partidasRaw) {
      setPartidas(req.partidasRaw.map((p, i) => ({
        linea: i + 1,
        codigo: p.codigo,
        descripcion: p.descripcion,
        cantidad: p.cantidad,
        precio: p.precio_unitario_est
      })));
    }
    setView('create');
  };

  const handleSave = async () => {
    const isEdit = !!activeReq;
    const folioStr = activeReq ? activeReq.id : `RE-00${45 + data.length}-FP`;
    const totalCalc = calculateTotal();

    const reqPayload = {
      folio_re: folioStr,
      localidad: 'FELIPE PESCADOR, ZACATECAS',
      usuario_solicita: 'LUCERO DE LA CRUZ',
      shopcar_carro: '1300',
      monto_total_estimado: totalCalc,
      estatus: 'PENDIENTE'
    };

    if (isEdit && activeReq.uuid) {
      reqPayload.id = activeReq.uuid;
    }

    try {
      const { data: savedReq, error } = await supabase.from('requisiciones').upsert(reqPayload).select().single();
      if (error) throw error;

      if (!isEdit && savedReq && partidas.length > 0) {
        const pLoads = partidas.map(p => ({
          requisicion_id: savedReq.id,
          codigo: p.codigo,
          descripcion: p.descripcion,
          cantidad: parseFloat(p.cantidad) || 1,
          precio_unitario_est: parseFloat(p.precio) || 0
        }));
        await supabase.from('req_partidas').insert(pLoads);
      }

      await fetchRequisiciones();
    } catch(e) {
      console.warn("Fallo Supabase, usando UI Fallback", e);
      if(!isEdit){
         setData([{ id: folioStr, localidad: 'LOCAL', fecha: 'NUEVA', usuario: 'LUCERO', car: '1300', lineas: partidas.length, total: totalCalc }, ...data]);
      }
    }

    setView('list');
    setPartidas([]);
    setActiveReq(null);
  };

  const handleAddPartida = () => setPartidas([...partidas, { linea: partidas.length + 1, codigo: '', descripcion: '', cantidad: 1, precio: 0 }]);
  const updatePartida = (index, field, value) => {
    const newPartidas = [...partidas];
    newPartidas[index][field] = value;
    setPartidas(newPartidas);
  };
  const removePartida = (index) => setPartidas(partidas.filter((_, i) => i !== index));
  const calculateTotal = () => partidas.reduce((acc, curr) => acc + (parseFloat(curr.cantidad || 0) * parseFloat(curr.precio || 0)), 0);

  // VISTA CREACION / EDICION
  const renderCreate = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E0E4E8', paddingBottom: '16px' }}>
        <div>
          <button 
            onClick={() => { setView('list'); setActiveReq(null); }}
            style={{ background: 'transparent', border: 'none', color: '#278EA5', cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Volver a Requisiciones
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F4287', margin: 0 }}>
            {activeReq ? `Edición de Requisición ${activeReq.id}` : 'Alta de Requisición'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          
          {/* BOTON ESTRELLA: GENERAR ORDEN DE COMPRA */}
          {activeReq && (
            <button 
                onClick={() => navigate('/shopcar/ordenes-compra', { state: { inheritedReq: activeReq, inheritedPartidas: partidas } })}
                className="btn-primary" 
                style={{ background: '#D32F2F', borderColor: '#D32F2F', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> GENERAR ORDEN DE COMPRA
            </button>
          )}

          <button className="btn-secondary" onClick={() => { setView('list'); setActiveReq(null); }}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSave} style={{ background: '#278EA5', borderColor: '#278EA5' }}>
            <Save size={16} /> Guardar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px', overflowY: 'auto', paddingBottom: '40px' }}>
        
        {/* BLOQUE MASTRO (ADMINISTRATIVO) */}
        <div className="card">
          <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #E0E4E8', fontWeight: 600, color: '#278EA5', display: 'flex', justifyContent: 'space-between' }}>
            <span>1. Datos de Origen</span>
            <span style={{ color: activeReq ? '#1F4287' : '#D32F2F', fontSize: '12px' }}>{activeReq ? 'Modo Edición' : 'Req. Nueva'}</span>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Localidad / Taller</label>
              <select><option>FELIPE PESCADOR, ZACATECAS</option></select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Solicitud</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">Elaboró</label>
              <input type="text" defaultValue="LUCERO DE LA CRUZ" disabled style={{ background: '#f1f5f9' }} />
            </div>
            <div className="form-group">
              <label className="form-label">ShopCar Relacionado (Car)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" defaultValue="1300" style={{ flex: 1 }} />
                <button className="btn-secondary" style={{ padding: '4px 8px' }}><Search size={14}/></button>
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 3' }}>
              <label className="form-label">Justificación / Motivo de Reemplazo</label>
              <input type="text" placeholder="Explique brevemente porqué necesita el material..." />
            </div>
          </div>
        </div>

        {/* DETALLE GRID */}
        <div className="card">
          <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #E0E4E8', fontWeight: 600, color: '#278EA5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>2. Partidas / Material Solicitado</span>
            <button onClick={handleAddPartida} style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', color: '#2E7D32', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Plus size={14} style={{ marginRight: '4px' }} /> Agregar Partida
            </button>
          </div>
          
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Ln.</th>
                <th style={{ width: '150px' }}>Código ERP</th>
                <th>Descripción / Material</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Cant.</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Precio Unit. Est.</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Importe Est.</th>
                <th style={{ width: '40px', textAlign: 'center' }}>X</th>
              </tr>
            </thead>
            <tbody>
              {partidas.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#7F8C8D', background: '#fdfdfd' }}>
                    Añada los componentes o servicios que necesita solicitar.
                  </td>
                </tr>
              ) : (
                partidas.map((partida, idx) => {
                  const importe = (parseFloat(partida.cantidad || 0) * parseFloat(partida.precio || 0)).toFixed(2);
                  return (
                    <tr key={idx}>
                      <td style={{ fontSize: '12px', color: '#7F8C8D', textAlign: 'center' }}>{idx + 1}</td>
                      <td><input type="text" placeholder="Código..." value={partida.codigo} onChange={e => updatePartida(idx, 'codigo', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px', fontFamily: 'monospace' }} /></td>
                      <td><input type="text" placeholder="Descripción..." value={partida.descripcion} onChange={e => updatePartida(idx, 'descripcion', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px' }} /></td>
                      <td><input type="number" value={partida.cantidad} onChange={e => updatePartida(idx, 'cantidad', e.target.value)} style={{ width: '100%', padding: '4px', textAlign: 'right', fontSize: '12px' }} /></td>
                      <td><input type="number" step="0.01" value={partida.precio} onChange={e => updatePartida(idx, 'precio', e.target.value)} style={{ width: '100%', padding: '4px', textAlign: 'right', fontSize: '12px' }} /></td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '12px', fontFamily: 'monospace' }}>${importe}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => removePartida(idx)} style={{ background: 'transparent', border: 'none', color: '#D32F2F', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" style={{ background: '#f8f9fa' }}></td>
                <td style={{ background: '#f8f9fa', textAlign: 'right', fontWeight: 600 }}>Total Estimado:</td>
                <td style={{ background: '#f8f9fa', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '14px', color: '#1F4287' }}>${calculateTotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td style={{ background: '#f8f9fa' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </div>
  );

  return view === 'list' ? renderList() : renderCreate();
}
