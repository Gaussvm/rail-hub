import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, Calendar, BarChart2, CheckCircle2, MonitorPlay } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AnalisisExistencias() {
  const [filterProveedor, setFilterProveedor] = useState('TODOS');
  const [filterAno, setFilterAno] = useState('2026');
  const [filterMes, setFilterMes] = useState('TODOS');
  
  const [groupedData, setGroupedData] = useState({});

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const [{ data: arts }, { data: movs }] = await Promise.all([
      supabase.from('inv_articulos').select('*').order('descripcion'),
      supabase.from('inv_movimientos').select('articulo_id, cantidad, tipo_movimiento')
    ]);

    if (!arts) return;

    let grouped = {};
    arts.forEach(art => {
      let loc = art.localidad_actual || 'GLOBAL';
      if(!grouped[loc]) grouped[loc] = [];
      
      let inQty = 0;
      let outQty = 0;
      
      if(movs) {
        let myMovs = movs.filter(m => m.articulo_id === art.id);
        myMovs.forEach(m => {
            if(m.cantidad > 0) inQty += m.cantidad;
            if(m.cantidad < 0) outQty += Math.abs(m.cantidad);
        });
      }
      
      grouped[loc].push({
         sku: art.codigo_erp,
         descripcion: art.descripcion,
         entradas: inQty,
         salidas: outQty,
         total: art.stock_actual,
         alerta: art.stock_actual <= art.stock_minimo
      });
    });
    setGroupedData(grouped);
  };

  // Cálculo de totales
  let totalEntradas = 0;
  let totalSalidas = 0;
  let totalStock = 0;
  let agotados = 0;
  let totalArticulosUnicos = 0;

  Object.values(groupedData).forEach(articulos => {
    articulos.forEach(art => {
      totalEntradas += art.entradas;
      totalSalidas += art.salidas;
      totalStock += art.total;
      totalArticulosUnicos++;
      if(art.alerta) agotados++;
    });
  });

  const indiceRotacion = totalArticulosUnicos > 0 ? ((totalSalidas / (totalStock || 1)) * 100).toFixed(1) : 0;

  const kpiCardStyle = {
    background: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    border: '1px solid #EAECEF',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  };

  const titleStyle = { fontSize: '12px', color: '#7F8C8D', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' };
  const valueStyle = { fontSize: '32px', fontWeight: 800, lineHeight: 1 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* HEADER DE MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E0E4E8', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F4287', margin: 0, display: 'flex', alignItems: 'center' }}>
            <BarChart2 size={24} style={{ marginRight: '8px' }} />
            Análisis y Existencias de Materiales
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>
            Visualización general de existencias y flujo de entradas/salidas en ubicaciones activas.
          </p>
        </div>
      </div>

      {/* TOOLBAR FILTROS */}
      <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Localidad / Filtro Maestro</label>
            <div className="select-container" style={{ width: '220px' }}>
              <select style={{ height: '34px' }} value={filterProveedor} onChange={e => setFilterProveedor(e.target.value)}>
                <option value="TODOS">[ GLOBAL ] - Todas</option>
                <option value="SUR">ALMACÉN VÍAS SUR</option>
                <option value="CENTRO">TALLER PRINCIPAL CENTRO</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Año Ejercicio</label>
            <div className="select-container" style={{ width: '120px' }}>
              <select style={{ height: '34px' }} value={filterAno} onChange={e => setFilterAno(e.target.value)}>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Mes Fiscal</label>
            <div className="select-container" style={{ width: '150px' }}>
              <select style={{ height: '34px' }} value={filterMes} onChange={e => setFilterMes(e.target.value)}>
                <option value="TODOS">Todos los meses</option>
                <option value="1">01 - Enero</option>
                <option value="2">02 - Febrero</option>
                <option value="3">03 - Marzo</option>
                <option value="4">04 - Abril</option>
              </select>
            </div>
          </div>
        </div>

        <button 
          style={{ height: '36px', padding: '0 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(39, 174, 96, 0.2)' }}
        >
          <Download size={16} style={{ marginRight: '8px' }} />
          Exportar Existencias (Excel)
        </button>
      </div>

      {/* SECCIÓN WIDGETS (KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
        <div style={{...kpiCardStyle, borderBottom: '4px solid #1F4287'}}>
          <div style={titleStyle}>Total Entradas</div>
          <div style={{...valueStyle, color: '#1F4287' }}>{totalEntradas}</div>
        </div>
        <div style={{...kpiCardStyle, borderBottom: '4px solid #F39C12'}}>
          <div style={titleStyle}>Total Salidas</div>
          <div style={{...valueStyle, color: '#F39C12' }}>{totalSalidas}</div>
        </div>
        <div style={{...kpiCardStyle, borderBottom: '4px solid #27ae60'}}>
          <div style={titleStyle}>Stock Neto Total</div>
          <div style={{...valueStyle, color: '#27ae60' }}>{totalStock}</div>
        </div>
        <div style={{...kpiCardStyle, borderBottom: '4px solid #D32F2F', background: '#FFFBFA'}}>
          <div style={titleStyle}><AlertCircle size={14} color="#D32F2F"/> Items Agotados</div>
          <div style={{...valueStyle, color: '#D32F2F' }}>{agotados}</div>
        </div>
        <div style={{...kpiCardStyle, borderBottom: '4px solid #8E44AD'}}>
          <div style={titleStyle}>Catálogo Activo</div>
          <div style={{...valueStyle, color: '#8E44AD' }}>{totalArticulosUnicos} <span style={{fontSize:'14px', color:'#7F8C8D'}}>SKUs</span></div>
        </div>
        <div style={{...kpiCardStyle, borderBottom: '4px solid #16A085'}}>
          <div style={titleStyle}>Índice Rotación</div>
          <div style={{...valueStyle, color: '#16A085' }}>{indiceRotacion}%</div>
        </div>
      </div>

      {/* SECCIÓN CATÁLOGO (Main Container) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '400px' }}>
        <div style={{ padding: '16px', overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', tableLayout: 'auto' }}>
            <thead>
              {/* Header Superior (Grouping) */}
              <tr>
                <th colSpan="3" style={{ backgroundColor: '#1F4287', color: 'white', textAlign: 'center', padding: '12px', fontSize: '13px' }}>
                  Jerarquía Operativa y Artículo
                </th>
                <th colSpan="3" style={{ backgroundColor: '#27ae60', color: 'white', textAlign: 'center', padding: '12px', fontSize: '13px' }}>
                  Flujo de Inventario (Unidades Físicas)
                </th>
              </tr>
              {/* Header Secundario */}
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ width: '20%', borderRight: '1px solid #E0E4E8' }}>Localidad Perteneciente</th>
                <th style={{ width: '15%', borderRight: '1px solid #E0E4E8' }}>Código ERP (SKU)</th>
                <th style={{ width: '35%', borderRight: '1px solid #E0E4E8' }}>Descripción del Producto</th>
                <th style={{ width: '10%', textAlign: 'center', color: '#1F4287', borderRight: '1px solid #E0E4E8' }}>(+) ENTRADAS</th>
                <th style={{ width: '10%', textAlign: 'center', color: '#D32F2F', borderRight: '1px solid #E0E4E8' }}>(-) SALIDAS</th>
                <th style={{ width: '10%', textAlign: 'center', color: '#27ae60' }}>STOCK NETO</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedData).map(([localidad, articulos], gIndex) => (
                <React.Fragment key={gIndex}>
                  {articulos.map((item, index) => (
                    <tr key={`${gIndex}-${index}`}>
                      
                      {/* Agrupación visual en la primera celda */}
                      {index === 0 ? (
                        <td rowSpan={articulos.length} style={{ verticalAlign: 'top', background: '#F8FAFC', fontWeight: 600, color: '#7F8C8D', borderRight: '1px solid #E0E4E8', fontSize: '14px' }}>
                          <div style={{ padding: '8px' }}>
                            {localidad}
                          </div>
                        </td>
                      ) : null}

                      <td style={{ fontSize: '13px', fontWeight: 600, color: '#34495E', borderRight: '1px solid #E0E4E8' }}>{item.sku}</td>
                      <td style={{ fontSize: '13px', color: '#7F8C8D', borderRight: '1px solid #E0E4E8' }}>{item.descripcion}</td>
                      
                      <td style={{ textAlign: 'center', borderRight: '1px solid #E0E4E8', fontWeight: 600, color: '#1F4287' }}>
                        {item.entradas > 0 ? item.entradas : '-'}
                      </td>
                      <td style={{ textAlign: 'center', borderRight: '1px solid #E0E4E8', fontWeight: 600, color: '#D32F2F' }}>
                        {item.salidas > 0 ? `-${item.salidas}` : '-'}
                      </td>
                      
                      {/* COLUMNA TOTAL */}
                      <td style={{ 
                        textAlign: 'center', 
                        fontWeight: 800, 
                        fontSize: '14px',
                        background: item.alerta ? '#FFEBEE' : 'transparent',
                        color: item.alerta ? '#D32F2F' : '#27ae60'
                      }}>
                        {item.total}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
