import React, { useState, useEffect } from 'react';
import { Search, MapPin, Database, Filter, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Kardex() {
  const [catalogo, setCatalogo] = useState([]);
  const [articuloInput, setArticuloInput] = useState('');
  const [currentArticulo, setCurrentArticulo] = useState(null); 
  const [kardexData, setKardexData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCatalogo();
  }, []);

  const fetchCatalogo = async () => {
    const { data } = await supabase.from('inv_articulos').select('*').order('descripcion');
    if (data) setCatalogo(data);
  };

  const handleConsultar = async () => {
    if (articuloInput.trim() !== '') {
      setIsLoading(true);
      const articulo = catalogo.find(a => a.id === articuloInput || a.codigo_erp === articuloInput);
      if (!articulo) {
         alert("Artículo no encontrado en el sistema.");
         setIsLoading(false);
         return;
      }
      
      setCurrentArticulo(articulo);
      
      const { data, error } = await supabase
        .from('inv_movimientos')
        .select('*')
        .eq('articulo_id', articulo.id)
        .order('creado_en', { ascending: true });
        
      if (data) {
        let saldoAcumulado = 0;
        const mappedData = data.map(mov => {
           saldoAcumulado += mov.cantidad;
           const dateObj = new Date(mov.creado_en);
           return {
              fecha: dateObj.toISOString().split('T')[0],
              hora: dateObj.toTimeString().split(' ')[0].substring(0, 5),
              usuario: mov.usuario_id,
              comentarios: mov.comentarios || mov.folio_documento,
              tipo: mov.tipo_movimiento,
              cantidad: mov.cantidad,
              condicion: mov.condicion_material,
              saldo: saldoAcumulado
           }
        });
        setKardexData(mappedData.reverse()); // Mostramos el último más arriba
      }
      setIsLoading(false);
    } else {
      alert('Por favor seleccione un Artículo para generar el Kardex.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* HEADER DE MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E0E4E8', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#34495E', margin: 0, display: 'flex', alignItems: 'center' }}>
            <Database size={24} style={{ marginRight: '8px' }} />
            Kardex Analítico Interactivo
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>
            Bitácora inmutable de entradas, salidas y ajustes del almacén por artículo.
          </p>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* PARÁMETROS DE BÚSQUEDA */}
        <div style={{ padding: '20px', borderBottom: '1px solid #E0E4E8', background: '#F8FAFC' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#7F8C8D', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <Filter size={14} style={{ marginRight: '6px' }} /> Parámetros de Extracción
          </h3>
          
          <div className="grid-form" style={{ gridTemplateColumns: '1fr 2fr 1fr auto' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                <MapPin size={12} style={{ marginRight: '4px' }}/> Localidad
              </label>
              <div className="select-container">
                <select className="form-input">
                  <option>GLOBAL (Consolidado)</option>
                  <option>Taller Principal Centro</option>
                  <option>Almacén Vías Sur</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label font-bold text-gray-900">Código ID del Artículo *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  className="form-input" 
                  style={{ flex: 1, border: '1px solid #1F4287', fontWeight: 600, color: '#1F4287', cursor: 'pointer' }} 
                  value={articuloInput}
                  onChange={(e) => setArticuloInput(e.target.value)}
                >
                   <option value="">-- Buscar Artículo en el Sistema --</option>
                   {catalogo.map(art => (
                      <option key={art.id} value={art.id}>[{art.codigo_erp}] {art.descripcion}</option>
                   ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Fecha Desde</label>
              <input type="date" className="form-input" />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={handleConsultar}
                style={{ height: '36px', padding: '0 24px', background: '#1F4287', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(31, 66, 135, 0.2)' }}
              >
                <Search size={16} style={{ marginRight: '8px' }} /> Consultar
              </button>
            </div>
          </div>
        </div>

        {/* REPORTE DE RESULTADOS KARDEX */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0' }}>
          {currentArticulo ? (
            <>
              <div style={{ padding: '16px 24px', background: '#eaf2f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1F4287' }}>
                <div style={{ fontSize: '14px', color: '#1F4287' }}>
                  Auditoría para <span style={{ fontWeight: 800, fontSize: '16px', background: '#fff', padding: '4px 8px', borderRadius: '4px', marginLeft: '6px', border: '1px solid #2980B9' }}>{currentArticulo.codigo_erp} - {currentArticulo.descripcion}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#2980B9' }}>
                    Saldo Exacto Contable: <span style={{ fontSize: '18px', fontWeight: 800, color: '#27AE60', marginLeft: '4px' }}>{currentArticulo.stock_actual} <span style={{ fontSize: '12px' }}>PZ</span></span>
                  </div>
                  <button style={{ background: '#fff', border: '1px solid #BDC3C7', height: '28px', padding: '0 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: '#34495E', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <Download size={12} style={{ marginRight: '4px' }} /> CSV
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#fff' }}>
                      <th style={{ width: '100px' }}>Fecha</th>
                      <th style={{ width: '70px' }}>Hora</th>
                      <th style={{ width: '150px' }}>Usuario</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Naturaleza</th>
                      <th>Concepto / Evidencia Op.</th>
                      <th style={{ width: '100px' }}>Condición</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Flujo (Unidades)</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Saldo Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                       <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px', fontWeight: 600, color: '#7F8C8D'}}>Descargando historial logístico...</td></tr>
                    ) : kardexData.length === 0 ? (
                       <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px', color: '#95A5A6'}}>Aún no existen registros contables para este artículo.</td></tr>
                    ) : kardexData.map((row, idx) => (
                      <tr key={idx} style={{ background: row.tipo === 'AJUSTE' ? '#FDEDEC' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: '#34495E' }}>{row.fecha}</td>
                        <td style={{ color: '#7F8C8D' }}>{row.hora}</td>
                        <td style={{ color: '#2980B9', fontWeight: 600 }}>{row.usuario}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px',
                            background: row.tipo === 'ENTRADA' ? '#D5F5E3' : row.tipo === 'SALIDA' ? '#FADBD8' : row.tipo === 'TRASPASO' ? '#D6EAF8' : '#FCF3CF',
                            color: row.tipo === 'ENTRADA' ? '#27AE60' : row.tipo === 'SALIDA' ? '#E74C3C' : row.tipo === 'TRASPASO' ? '#2980B9' : '#F39C12'
                          }}>
                            {row.tipo}
                          </span>
                        </td>
                        <td style={{ color: '#34495E' }}>{row.comentarios}</td>
                        <td style={{ fontSize: '11px', color: '#7F8C8D', fontWeight: 600 }}>{row.condicion}</td>
                        <td style={{ 
                          textAlign: 'right', fontWeight: 800, fontSize: '14px',
                          color: row.cantidad < 0 ? '#E74C3C' : '#27AE60' 
                        }}>
                          {row.cantidad > 0 ? '+' : ''}{row.cantidad}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, background: '#F8FAFC', color: '#1F4287' }}>{row.saldo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#95A5A6' }}>
              <Database size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p>Ingrese un Código de Artículo para proyectar el Kardex histórico</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
