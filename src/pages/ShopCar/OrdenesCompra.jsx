import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Filter, ArrowLeft, Save, Trash2, FileText, ChevronDown, CheckCircle2, ArrowUp, ArrowDown, ArrowUpDown, AlertCircle } from 'lucide-react';
import { PROVEEDORES, LOCALIDADES } from '../../data/catalogs';
import { supabase } from '../../lib/supabase';

// Mocks basados en la captura del usuario
const MOCK_ORDENES = [
  { id: 'OC-12056', localidad: 'SITAO TIGRE, GTO', fecha: '13-04-2026', proveedor: 'INDUSTRIAL TECH SA DE CV', moneda: 'USD', tipoCambio: 20.30, monto: 14500.00, iva: 2320.00, retencion: 0, total: 16820.00, fechaEntrega: '25-04-2026', estatusCruce: 'CRUCE OK', pagos: [100], liquidado: true },
  { id: 'OC-12057', localidad: 'MÉXICO D.F.', fecha: '12-04-2026', proveedor: 'SUMINISTROS FERROVIARIOS MX', moneda: 'MXN', tipoCambio: 1.00, monto: 850000.00, iva: 136000.00, retencion: 50000.00, total: 936000.00, fechaEntrega: '30-04-2026', estatusCruce: 'PDTE CRUCE', pagos: [50, 0], liquidado: false },
  { id: 'OC-12058', localidad: 'MONTERREY P.' ,fecha: '10-04-2026', proveedor: 'ACEROS DEL NORTE', moneda: 'MXN', tipoCambio: 1.00, monto: 25000.00, iva: 4000.00, retencion: 0, total: 29000.00, fechaEntrega: '15-04-2026', estatusCruce: 'CRUCE OK', pagos: [100], liquidado: true },
];

export default function OrdenesCompra() {
  const location = useLocation();

  const [view, setView] = useState('list'); // 'list' | 'create'
  const [activeOrden, setActiveOrden] = useState(null);
  const [importedReqId, setImportedReqId] = useState('');
  const [fileCotizacion, setFileCotizacion] = useState(null);
  const [fileFactura, setFileFactura] = useState(null);
  const [data, setData] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // ESTADOS DE FORMULARIO DE DETALLE
  const [partidas, setPartidas] = useState([]);
  const [pagos, setPagos] = useState([{ numero: 1, fecha: '', monto: 0 }]);
  const [reqList, setReqList] = useState([]);

  // Efecto para auto-llenar Requisición entrante desde React Router
  useEffect(() => {
    if (location.state?.inheritedReq) {
      const pSrc = location.state.inheritedPartidas || [];
      const newP = pSrc.map((p, i) => ({
        linea: i + 1,
        codigo: p.codigo,
        descripcion: p.descripcion,
        cant: p.cantidad,
        precio: p.precio
      }));
      setActiveOrden(null); // Force Alta
      setImportedReqId(location.state.inheritedReq.id);
      setPartidas(newP);
      setView('create');
    }
  }, [location.state]);

  const fetchOrdenes = async () => {
    setLoadingDb(true);
    
    // Fetch para la lista desplegable de Requisiciones
    const { data: reqsDb } = await supabase.from('requisiciones').select('id, folio_re').order('created_at', { ascending: false });
    if (reqsDb) setReqList(reqsDb);

    const { data: dbData, error } = await supabase
      .from('ordenes_compra')
      .select('*, oc_pagos(monto_pago)')
      .order('created_at', { ascending: false });

    if (!error && dbData) {
      const mapped = dbData.map(dbItem => {
        const totalNum = parseFloat(dbItem.monto_total) || 1;
        const pagosList = dbItem.oc_pagos || [];
        const pagosCalc = pagosList.map(p => Math.round((parseFloat(p.monto_pago)/totalNum)*100));

        return {
          uuid: dbItem.id,
          id: dbItem.folio_oc,
          localidad: dbItem.localidad_destino || 'SIN LOCALIDAD',
          fecha: new Date(dbItem.created_at).toLocaleDateString('es-MX').replace(/\//g, '-'),
          proveedor: dbItem.proveedor,
          moneda: dbItem.moneda || 'MXN',
          tipoCambio: 1.0,
          monto: parseFloat(dbItem.monto_subtotal) || 0,
          iva: parseFloat(dbItem.monto_iva) || 0,
          retencion: 0,
          total: parseFloat(dbItem.monto_total) || 0,
          fechaEntrega: dbItem.fecha_entrega || 'POR DEFINIR',
          estatusCruce: dbItem.estatus_cruce || 'PDTE CRUCE',
          pagos: pagosCalc.length > 0 ? pagosCalc : [0], // Default vacío mock
          liquidado: dbItem.liquidado || false
        };
      });
      setData(mapped.length > 0 ? mapped : MOCK_ORDENES); // Fallback a mock si vacio para demo visual
    } else {
      console.warn("Error Supabase o sin credenciales, usando MOCK_ORDENES", error);
      setData(MOCK_ORDENES);
    }
    setLoadingDb(false);
  };

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let processedData = [...data];

    // Aplicar Filtros por Columna
    Object.keys(filters).forEach(key => {
      const filterValue = filters[key].toLowerCase();
      if (filterValue) {
        processedData = processedData.filter(item => {
          const itemValue = item[key] ? String(item[key]).toLowerCase() : '';
          return itemValue.includes(filterValue);
        });
      }
    });

    // Aplicar Ordenamiento
    if (sortConfig.key) {
      processedData.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (typeof aVal !== 'number' || typeof bVal !== 'number') {
           aVal = String(aVal || '').toLowerCase();
           bVal = String(bVal || '').toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return processedData;
  }, [data, filters, sortConfig]);

  const renderHeader = (label, key, align = 'left') => (
    <th className="hover:bg-slate-50 transition-colors cursor-pointer group" style={{ verticalAlign: 'top', padding: '6px 8px' }} onClick={() => requestSort(key)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start', marginBottom: '6px', fontSize: '11px', color: '#2C3E50', fontWeight: 'bold' }}>
        <span>{label}</span>
        {sortConfig.key === key ? (
          sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-primary ml-1" /> : <ArrowDown size={12} className="text-primary ml-1" />
        ) : (
          <ArrowUpDown size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        )}
      </div>
      <input
        type="text"
        placeholder="Filtrar..."
        value={filters[key] || ''}
        onChange={(e) => handleFilterChange(key, e.target.value)}
        onClick={(e) => e.stopPropagation()} 
        style={{ width: '100%', padding: '3px 6px', fontSize: '10px', border: '1px solid #E0E4E8', borderRadius: '3px', fontWeight: 'normal', color: '#2C3E50', outline: 'none' }}
        className="focus:border-primary focus:ring-1 focus:ring-primary/20"
      />
    </th>
  );

  // VISTA LISTA PRINCIPAL
  const renderList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F4287', margin: 0 }}>Órdenes de Compra</h1>
          <p style={{ fontSize: '13px', color: '#7F8C8D', marginTop: '4px' }}>Gestión central de compras y liquidaciones</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(Object.keys(filters).some(key => filters[key] !== '') || sortConfig.key) && (
            <button 
              className="btn-secondary" 
              onClick={() => { setFilters({}); setSortConfig({ key: null, direction: 'asc' }); }}
              style={{ color: '#D32F2F', borderColor: '#FFCDD2', background: '#FFEBEE' }}
            >
              Restablecer Vista
            </button>
          )}
          <button className="btn-secondary">
            <FileText size={16} /> Exportar Excel
          </button>
          <button className="btn-success" onClick={() => { setActiveOrden(null); setView('create'); }}>
            <Plus size={16} /> Nueva Orden
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '1300px' }}>
            <thead>
              <tr>
                {renderHeader('O. Compra', 'id')}
                {renderHeader('Localidad', 'localidad')}
                {renderHeader('Fecha', 'fecha')}
                {renderHeader('Proveedor', 'proveedor')}
                {renderHeader('Moneda', 'moneda', 'center')}
                {renderHeader('Total C/IVA', 'total', 'right')}
                {renderHeader('Est. Entrega', 'fechaEntrega')}
                {renderHeader('Est. Cruce', 'estatusCruce')}
                <th style={{ width: '160px', verticalAlign: 'top', padding: '6px 8px' }}><div style={{ marginBottom: '6px', fontSize: '11px', color: '#2C3E50', fontWeight: 'bold' }}>Pagos (Avance)</div></th>
                <th style={{ width: '90px', textAlign: 'center', verticalAlign: 'top', padding: '6px 8px' }}><div style={{ marginBottom: '6px', fontSize: '11px', color: '#2C3E50', fontWeight: 'bold' }}>¿Liq?</div></th>
                <th style={{ width: '70px', textAlign: 'center', verticalAlign: 'top', padding: '6px 8px' }}><div style={{ marginBottom: '6px', fontSize: '11px', color: '#2C3E50', fontWeight: 'bold' }}>Acción</div></th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#7F8C8D' }}>
                    <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>No se encontraron registros que coincidan con los filtros aplicados.</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((row) => (
                  <tr key={row.id} onDoubleClick={() => { setActiveOrden(row); setView('create'); }} style={{ cursor: 'pointer' }} className="hover:bg-slate-50 transition-colors">
                  <td style={{ fontWeight: 600, color: '#1F4287' }}>{row.id}</td>
                  <td style={{ fontSize: '12px' }}>{row.localidad}</td>
                  <td style={{ fontSize: '12px' }}>{row.fecha}</td>
                  <td style={{ fontWeight: 500 }}>{row.proveedor}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-neutral">{row.moneda}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '14px' }}>
                    ${row.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td style={{ fontSize: '12px' }}>{row.fechaEntrega}</td>
                  <td>
                    <span className={row.estatusCruce === 'CRUCE OK' ? 'badge badge-success' : 'badge badge-warning'}>
                      {row.estatusCruce}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {row.pagos.map((pago, idx) => (
                        <div key={idx} style={{ 
                          background: pago === 100 ? '#E8F5E9' : (pago > 0 ? '#FFF8E1' : '#F1F5F9'), 
                          color: pago === 100 ? '#2E7D32' : (pago > 0 ? '#F57F17' : '#475569'), 
                          border: `1px solid ${pago === 100 ? '#C8E6C9' : (pago > 0 ? '#FFECB3' : '#E2E8F0')}`,
                          padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold'
                        }}>
                          P{idx+1}: {pago}%
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {row.liquidado ? (
                       <CheckCircle2 size={20} color="#2E7D32" style={{ margin: '0 auto' }} />
                    ) : (
                       <div style={{ width: '20px', height: '20px', border: '2px solid #E0E4E8', borderRadius: '50%', margin: '0 auto' }}></div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => { setActiveOrden(row); setView('create'); }} style={{ background: 'transparent', border: 'none', color: '#7F8C8D', cursor: 'pointer' }}>Ver</button>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handleManualReqSelect = async (folio) => {
    setImportedReqId(folio);
    if (!folio) return;
    
    // Buscar el ID real de la requisición seleccionada
    const reqFound = reqList.find(r => r.folio_re === folio);
    if (reqFound && reqFound.id) {
       const { data: pSrc } = await supabase.from('req_partidas').select('*').eq('requisicion_id', reqFound.id);
       if (pSrc && pSrc.length > 0) {
          setPartidas(pSrc.map((p, i) => ({
             linea: i + 1,
             codigo: p.codigo,
             descripcion: p.descripcion,
             cant: parseFloat(p.cantidad) || 1,
             precio: parseFloat(p.precio_unitario_est) || 0
          })));
       }
    }
  };

  const [aplicaIVA, setAplicaIVA] = useState(true);

  const handleAddPartida = () => {
    setPartidas([...partidas, { codigo: '', descripcion: '', cantidad: 1, precio: 0 }]);
  };

  const updatePartida = (index, field, value) => {
    const newPartidas = [...partidas];
    newPartidas[index][field] = value;
    setPartidas(newPartidas);
  };

  const removePartida = (index) => {
    setPartidas(partidas.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return partidas.reduce((acc, curr) => acc + (parseFloat(curr.cantidad || 0) * parseFloat(curr.precio || 0)), 0);
  };

  const subtotal = calculateSubtotal();
  const iva = aplicaIVA ? subtotal * 0.16 : 0;
  const totalNeto = subtotal + iva;

  const handleAddPago = () => {
    setPagos([...pagos, { numero: pagos.length + 1, fecha: '', monto: 0 }]);
  };

  const updatePago = (index, field, value) => {
    const newPagos = [...pagos];
    newPagos[index][field] = value;
    setPagos(newPagos);
  };

  const removePago = (index) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  const calculateTotalPagos = () => {
    return pagos.reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);
  };

  const handleSave = async () => {
    const isEdit = !!activeOrden;
    const folioStr = activeOrden ? activeOrden.id : `OC-${23091 + data.length}`;

    const ocPayload = {
      folio_oc: folioStr,
      proveedor: 'PROVEEDOR MOCK DESDE REACT UI', 
      localidad_destino: 'LOCALIDAD MOCK',
      moneda: 'MXN',
      monto_subtotal: subtotal,
      monto_iva: iva,
      monto_total: totalNeto,
      estatus_cruce: 'PDTE CRUCE',
      fecha_entrega: 'POR DEFINIR'
    };

    if (isEdit && activeOrden.uuid) {
      ocPayload.id = activeOrden.uuid; // Para el upsert en la misma BD
    }

    try {
      const { data: savedOc, error } = await supabase
        .from('ordenes_compra')
        .upsert(ocPayload)
        .select()
        .single();

      if (error) throw error;

      // Si es inserción nueva y tenemos detalle, mockeamos la inserción en Detalle
      if (!isEdit && savedOc) {
        if (partidas.length > 0) {
          const pPayloads = partidas.map(p => ({
            orden_id: savedOc.id,
            codigo: p.codigo,
            descripcion: p.descripcion,
            cantidad: parseFloat(p.cant) || 1,
            precio_unitario: parseFloat(p.precio) || 0
          }));
          await supabase.from('oc_partidas').insert(pPayloads);
        }
        if (pagos.length > 0 && pagos[0].monto > 0) {
          const pgPayloads = pagos.map((p, idx) => ({
            orden_id: savedOc.id,
            numero_pago: idx + 1,
            fecha_pago: p.fecha || null,
            monto_pago: parseFloat(p.monto) || 0
          }));
          await supabase.from('oc_pagos').insert(pgPayloads);
        }
      }

      // Subida de Archivos a Storage y actualización de la BD
      let updatesFiles = {};
      
      if (fileCotizacion) {
        const pathCot = `${savedOc.id}/cotizacion-${Date.now()}.pdf`;
        const { error: errCot } = await supabase.storage.from('oc-files').upload(pathCot, fileCotizacion);
        if (!errCot) {
          const { data: pubCot } = supabase.storage.from('oc-files').getPublicUrl(pathCot);
          updatesFiles.url_cotizacion = pubCot.publicUrl;
        }
      }

      if (fileFactura) {
        const pathFac = `${savedOc.id}/factura-${Date.now()}.pdf`;
        const { error: errFac } = await supabase.storage.from('oc-files').upload(pathFac, fileFactura);
        if (!errFac) {
          const { data: pubFac } = supabase.storage.from('oc-files').getPublicUrl(pathFac);
          updatesFiles.url_factura = pubFac.publicUrl;
        }
      }

      if (Object.keys(updatesFiles).length > 0) {
         await supabase.from('ordenes_compra').update(updatesFiles).eq('id', savedOc.id);
      }

      await fetchOrdenes(); // Refrescar lista de BD
      
    } catch (e) {
      console.warn("Fallo al guardar en Supabase, aplicando fallback local en UI...", e);
      // Fallback UI (lo que ya existía)
      if (isEdit) {
        setData(data.map(item => item.id === activeOrden.id ? { ...item, total: totalNeto > 0 ? totalNeto : item.total, monto: subtotal > 0 ? subtotal : item.monto, iva: iva !== 0 ? iva : item.iva } : item));
      } else {
        setData([{ id: folioStr, localidad: 'LOCALIDAD OFFLINE', fecha: 'NUEVA', proveedor: 'OFLINE', moneda: 'MXN', tipoCambio: 1.0, monto: subtotal, iva: iva, retencion: 0, total: totalNeto, fechaEntrega: 'POR DEFINIR', estatusCruce: 'PDTE CRUCE', pagos: [0], liquidado: false }, ...data]);
      }
    }

    setView('list');
    setPartidas([]);
    setPagos([{ numero: 1, fecha: '', monto: 0 }]);
    setActiveOrden(null);
    setFileCotizacion(null);
    setFileFactura(null);
  };

  const renderCreate = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E0E4E8', paddingBottom: '16px' }}>
        <div>
          <button 
            onClick={() => { setActiveOrden(null); setView('list'); }}
            style={{ background: 'transparent', border: 'none', color: '#1F4287', cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Volver a Órdenes
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F4287', margin: 0 }}>
            {activeOrden ? `Edición de O.C. ${activeOrden.id}` : 'Alta de Orden de Compra'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => setView('list')}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Save size={16} /> Guardar Orden
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px', overflowY: 'auto', paddingBottom: '40px' }}>
        
        {/* BLOQUE MASTRO (ADMINISTRATIVO) */}
        <div className="card">
          <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #E0E4E8', fontWeight: 600, color: '#1F4287', display: 'flex', justifyContent: 'space-between' }}>
            <span>1. Información Administrativa</span>
            <span style={{ color: activeOrden ? '#1F4287' : '#D32F2F', fontSize: '12px' }}>
              {activeOrden ? `OC Existente` : `O.C. Nuevo`}
            </span>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Proveedor</label>
              <select defaultValue="">
                <option value="" disabled>Seleccione Proveedor...</option>
                {PROVEEDORES.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Condiciones</label>
              <input type="text" placeholder="Ej. PAGO CONTRA ENTREGA" />
            </div>
            <div className="form-group">
              <label className="form-label">Elaboró</label>
              <input type="text" defaultValue="SDELVALLE" disabled style={{ background: '#f1f5f9' }} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Asociado a ShopCar</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select style={{ flex: 1 }} value={importedReqId} onChange={(e) => handleManualReqSelect(e.target.value)}>
                  <option value="">Seleccione Requisición...</option>
                  {reqList.map(r => (
                    <option key={r.id} value={r.folio_re}>{r.folio_re}</option>
                  ))}
                  {importedReqId && !reqList.some(r => r.folio_re === importedReqId) && (
                    <option value={importedReqId}>{importedReqId}</option>
                  )}
                </select>
                <div style={{ padding: '4px 12px', background: importedReqId ? '#2E7D32' : '#D32F2F', color: 'white', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  {importedReqId ? 'REQ LIGADA' : 'REQUISICION'}
                </div>
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Proyecto / Justificación</label>
              <input type="text" placeholder="Asigne el proyecto para centro de costos..." />
            </div>
            <div className="form-group">
              <label className="form-label">Localidad Destino</label>
              <select defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {LOCALIDADES.map((l, idx) => <option key={idx} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cotización Anexa</label>
              {activeOrden?.url_cotizacion ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                   <a href={activeOrden.url_cotizacion} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#1F4287', textDecoration: 'underline' }}>Ver Cotización</a>
                   <span style={{ fontSize: '10px', color: '#7F8C8D' }}>(Reemplazar ↓)</span>
                </div>
              ) : null}
              <input type="file" onChange={(e) => setFileCotizacion(e.target.files[0])} accept="application/pdf" style={{ fontSize: '11px', padding: '4px' }} />
            </div>
          </div>
        </div>

        {/* BLOQUE FINANCIERO / FACTURACION */}
        <div className="card">
          <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #E0E4E8', fontWeight: 600, color: '#1F4287' }}>
            <span>2. Condiciones Financieras y Facturación</span>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Estatus (Pago/Crédito)</label>
              <select>
                <option>TRAMITE CREDITO</option>
                <option>MEDIO URGENTE</option>
                <option>URGENTE</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Probable Pago</label>
              <input type="date" />
            </div>
            <div className="form-group">
              <label className="form-label">Liquidado completamente</label>
              <div style={{ padding: '6px' }}>
                <input type="checkbox" style={{ transform: 'scale(1.2)' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Moneda O.C.</label>
              <select>
                <option>MXN (Pesos)</option>
                <option>USD (Dólares)</option>
              </select>
            </div>
            
            <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #E0E4E8', margin: '8px 0' }}></div>
            
            <div className="form-group">
              <label className="form-label">Factura No.</label>
              <input type="text" placeholder="Folio de factura..." />
            </div>
            <div className="form-group">
              <label className="form-label">Archivo de Factura</label>
              {activeOrden?.url_factura ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                   <a href={activeOrden.url_factura} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#1F4287', textDecoration: 'underline' }}>Ver Factura</a>
                   <span style={{ fontSize: '10px', color: '#7F8C8D' }}>(Reemplazar ↓)</span>
                </div>
              ) : null}
              <input type="file" onChange={(e) => setFileFactura(e.target.files[0])} accept="application/pdf" style={{ fontSize: '11px', padding: '4px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Monto USD Fac</label>
              <input type="number" defaultValue="0.00" step="0.01" style={{ textAlign: 'right', fontFamily: 'monospace' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Monto MXN Fac</label>
              <input type="number" defaultValue="0.00" step="0.01" style={{ textAlign: 'right', fontFamily: 'monospace' }} />
            </div>
          </div>
        </div>

        {/* CONTENEDOR DE TABLAS (MAESTRO-DETALLE) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* DETALLE GRID: PARTIDAS */}
          <div className="card">
            <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #E0E4E8', fontWeight: 600, color: '#1F4287', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>3. Partidas de la Orden</span>
              <button onClick={handleAddPartida} style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', color: '#2E7D32', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Agregar Partida
              </button>
            </div>
            
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Ln.</th>
                  <th>Cód / Descripción</th>
                  <th style={{ width: '60px', textAlign: 'right' }}>Cant.</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Precio Unitario</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Importe</th>
                  <th style={{ width: '40px', textAlign: 'center' }}>X</th>
                </tr>
              </thead>
              <tbody>
                {partidas.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#7F8C8D', background: '#fdfdfd', fontSize: '12px' }}>
                      No hay partidas agregadas. Presiona "Agregar Partida".
                    </td>
                  </tr>
                ) : (
                  partidas.map((partida, idx) => {
                    const importe = (parseFloat(partida.cantidad || 0) * parseFloat(partida.precio || 0)).toFixed(2);
                    return (
                      <tr key={idx}>
                        <td style={{ fontSize: '12px', color: '#7F8C8D', textAlign: 'center' }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <input type="text" placeholder="Código..." value={partida.codigo} onChange={e => updatePartida(idx, 'codigo', e.target.value)} style={{ padding: '4px', fontSize: '11px', fontFamily: 'monospace' }} />
                            <input type="text" placeholder="Descripción..." value={partida.descripcion} onChange={e => updatePartida(idx, 'descripcion', e.target.value)} style={{ padding: '4px', fontSize: '12px' }} />
                          </div>
                        </td>
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
                  <td colSpan="3" style={{ background: '#f0f4f8' }}></td>
                  <td style={{ background: '#f0f4f8', textAlign: 'right', fontWeight: 600 }}>Subtotal:</td>
                  <td style={{ background: '#f0f4f8', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td style={{ background: '#f0f4f8' }}></td>
                </tr>
                <tr>
                  <td colSpan="3" style={{ background: '#f0f4f8' }}></td>
                  <td style={{ background: '#f0f4f8', textAlign: 'right', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <input type="checkbox" checked={aplicaIVA} onChange={(e) => setAplicaIVA(e.target.checked)} style={{ cursor: 'pointer' }} title="Calcular IVA" />
                      Monto IVA (16%):
                    </div>
                  </td>
                  <td style={{ background: '#f0f4f8', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>${iva.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td style={{ background: '#f0f4f8' }}></td>
                </tr>
                <tr>
                  <td colSpan="3" style={{ background: '#e2e8f0', borderTop: '2px solid #cbd5e1' }}></td>
                  <td style={{ background: '#e2e8f0', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #cbd5e1', color: '#1F4287' }}>Total MXN:</td>
                  <td style={{ background: '#e2e8f0', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '14px', borderTop: '2px solid #cbd5e1', color: '#1F4287' }}>${totalNeto.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td style={{ background: '#e2e8f0', borderTop: '2px solid #cbd5e1' }}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* DETALLE GRID: PAGOS */}
          <div className="card">
            <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #E0E4E8', fontWeight: 600, color: '#1F4287', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>4. Programa de Pagos</span>
              <button onClick={handleAddPago} style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', color: '#2E7D32', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Registrar Pago
              </button>
            </div>
            
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '70px', textAlign: 'center' }}>No. Pago</th>
                  <th>Fecha Pago</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Monto a Pagar</th>
                  <th style={{ width: '40px', textAlign: 'center' }}>X</th>
                </tr>
              </thead>
              <tbody>
                {pagos.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#7F8C8D', background: '#fdfdfd', fontSize: '12px' }}>
                      No hay pagos programados.
                    </td>
                  </tr>
                ) : (
                  pagos.map((pago, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center' }}>
                        <input type="number" value={pago.numero} onChange={e => updatePago(idx, 'numero', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px', textAlign: 'center' }} />
                      </td>
                      <td>
                        <input type="date" value={pago.fecha} onChange={e => updatePago(idx, 'fecha', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '12px' }} />
                      </td>
                      <td>
                        <input type="number" step="0.01" value={pago.monto} onChange={e => updatePago(idx, 'monto', e.target.value)} style={{ width: '100%', padding: '4px', textAlign: 'right', fontSize: '12px', fontFamily: 'monospace' }} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => removePago(idx)} style={{ background: 'transparent', border: 'none', color: '#D32F2F', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ background: '#fdfdfd', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right', fontWeight: 600 }}>Total Pagado:</div>
                      <div style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '14px', color: calculateTotalPagos() === totalNeto ? '#2E7D32' : (calculateTotalPagos() > totalNeto ? '#D32F2F' : '#F57F17') }}>
                        ${calculateTotalPagos().toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                    </div>
                    {calculateTotalPagos() !== totalNeto && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '6px', color: calculateTotalPagos() > totalNeto ? '#D32F2F' : '#F57F17', fontSize: '11px', fontWeight: 600 }}>
                        <AlertCircle size={12} /> La suma de los pagos no cuadra con el Total MXN de la orden
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>

      </div>
    </div>
  );

  return view === 'list' ? renderList() : renderCreate();
}
