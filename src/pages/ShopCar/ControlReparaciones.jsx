import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Filter, FileText, Search, Settings2, MoreHorizontal, Trash2, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import RepairHubDrawer from './RepairHubDrawer';

// Mocks basados en la captura del usuario
const MOCK_DATA = [
  { id: 1793, cliente: 'FERROMEX', modalidad: 'PEDIDO', fechaPedido: '29/03/2026', localidad: 'SITAO TIGRE, GTO', iniciales: 'UTLX', numero: '667393', tipo: 'TANQUES', fechaIngreso: '29/03/2026', diasTaller: 15, motivoCorte: 'DEVOLUCION', fechaEnvioDM: '-', etapa: 'IDENTIFICACION', via: 'VIA 02', docs: 2, fechaEntrega: '-', avance: 0, observaciones: '', ultimaMod: 'Hace 2 horas', flagMod: false },
  { id: 1762, cliente: 'FERROMEX', modalidad: 'PEDIDO', fechaPedido: '08/03/2026', localidad: 'SITAO TIGRE, GTO', iniciales: 'NKCR', numero: '1376', tipo: 'ARTICULADO', fechaIngreso: '08/03/2026', diasTaller: 36, motivoCorte: 'DEVOLUCION', fechaEnvioDM: '-', etapa: 'OPERACION', via: 'VIA 01', docs: 2, fechaEntrega: '25/03/2026', avance: 100, observaciones: 'PENDIENTE DE RECEPCION', ultimaMod: 'Hace 12 días', flagMod: true },
  { id: 1759, cliente: 'FERROMEX', modalidad: 'PEDIDO', fechaPedido: '03/03/2026', localidad: 'SITAO TIGRE, GTO', iniciales: 'NKCR', numero: '1384', tipo: 'ARTICULADO', fechaIngreso: '03/03/2026', diasTaller: 41, motivoCorte: 'DEVOLUCION', fechaEnvioDM: '-', etapa: 'IDENTIFICACION', via: 'VIA 01', docs: 2, fechaEntrega: '15/04/2026', avance: 35, observaciones: 'EN PROCESO DE REPARACION', ultimaMod: 'Ayer', flagMod: false },
  { id: 1672, cliente: 'FERROMEX', modalidad: 'PEDIDO', fechaPedido: '07/02/2026', localidad: 'SITAO TIGRE, GTO', iniciales: 'NKCR', numero: '1396', tipo: 'ARTICULADO', fechaIngreso: '07/02/2026', diasTaller: 24, motivoCorte: 'DEVOLUCION', fechaEnvioDM: '-', etapa: 'FINALIZADO', via: 'VIA 01', docs: 2, fechaEntrega: '03/03/2026', avance: 100, observaciones: 'FAC A5874', ultimaMod: 'Hace 1 mes', flagMod: false },
  { id: 1518, cliente: 'FERROMEX', modalidad: 'PEDIDO', fechaPedido: '24/11/2025', localidad: 'SITAO TIGRE, GTO', iniciales: 'CP', numero: '546273', tipo: 'AUTORACK', fechaIngreso: '24/11/2025', diasTaller: 140, motivoCorte: 'VANDALIZADA', fechaEnvioDM: '03/12/2025', etapa: 'IDENTIFICACION', via: 'VIA 01', docs: 0, fechaEntrega: '-', avance: 10, observaciones: 'PENDIENTE DE AUTORIZACION', ultimaMod: 'Hace 35 días', flagMod: true },
  { id: 1432, cliente: 'FERROMEX', modalidad: 'PEDIDO', fechaPedido: '07/06/2025', localidad: 'SITAO TIGRE, GTO', iniciales: 'NKLX', numero: '400159', tipo: 'COIL CAR', fechaIngreso: '04/08/2025', diasTaller: 252, motivoCorte: 'ACCIDENTADO', fechaEnvioDM: '-', etapa: 'IDENTIFICACION', via: 'VIA 01', docs: 2, fechaEntrega: '20/12/2025', avance: 75, observaciones: 'FAC A5607 RECIBIDA', ultimaMod: 'Hace 3 días', flagMod: false },
  { id: 1335, cliente: 'FERROMEX', modalidad: 'PEDIDO', fechaPedido: '24/11/2025', localidad: 'SITAO TIGRE, GTO', iniciales: 'NKCR', numero: '66028', tipo: 'FURGON', fechaIngreso: '24/10/2025', diasTaller: 171, motivoCorte: 'DEVOLUCION', fechaEnvioDM: '-', etapa: 'IDENTIFICACION', via: 'VIA 01', docs: 2, fechaEntrega: '-', avance: 45, observaciones: 'UNIDAD DE DEVOLUCION', ultimaMod: 'Hace 14 días', flagMod: true },
  { id: 1326, cliente: 'FERROMEX', modalidad: 'PEDIDO', fechaPedido: '01/04/2025', localidad: 'SITAO TIGRE, GTO', iniciales: 'CNA', numero: '712816', tipo: 'AUTORACK', fechaIngreso: '14/03/2025', diasTaller: 395, motivoCorte: 'REPARACION', fechaEnvioDM: '03/04/2025', etapa: 'ORDEN COMPRA', via: 'VIA 02', docs: 2, fechaEntrega: '29/12/2025', avance: 90, observaciones: 'RECIBIDA, PDTE. RETIRO', ultimaMod: 'Hoy 09:30 AM', flagMod: false },
];

export default function ControlReparaciones() {
  const [data, setData] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);

  const fetchReparaciones = async () => {
    setLoadingDb(true);
    const { data: dbData, error } = await supabase
      .from('reparaciones_shopcar')
      .order('created_at', { ascending: false });

    if (!error && dbData) {
      // Mapeo automático de los nombres de columnas SnakeCase (BD) a CamelCase (UI)
      const mapped = dbData.map(item => {
        // Calcular días en taller
        const fIngreso = new Date(item.fecha_ingreso || item.created_at);
        const fFin = item.fecha_entrega ? new Date(item.fecha_entrega) : new Date();
        const diffTime = Math.abs(fFin - fIngreso);
        const diasTaller = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          uuid: item.id,
          id: item.folio_shopcar,
          cliente: item.cliente || 'S/N',
          modalidad: item.modalidad || 'N/A',
          fechaPedido: item.fecha_pedido ? new Date(item.fecha_pedido).toLocaleDateString('es-MX') : '-',
          localidad: item.localidad || 'SITAO TIGRE, GTO',
          iniciales: item.iniciales || 'S/I',
          numero: item.numero_equipo || 'S/N',
          tipo: item.tipo_equipo || 'N/A',
          fechaIngreso: item.fecha_ingreso ? new Date(item.fecha_ingreso).toLocaleDateString('es-MX') : '-',
          diasTaller: diasTaller,
          motivoCorte: item.motivo_corte || 'MANTENIMIENTO',
          fechaEnvioDM: item.fecha_envio_dm ? new Date(item.fecha_envio_dm).toLocaleDateString('es-MX') : '-',
          etapa: item.etapa || 'IDENTIFICACION',
          via: item.via || 'VIA XX',
          docs: item.docs_count || 0,
          fechaEntrega: item.fecha_entrega ? new Date(item.fecha_entrega).toLocaleDateString('es-MX') : '-',
          avance: parseFloat(item.avance) || 0,
          observaciones: item.observaciones || '',
          ultimaMod: item.ultima_modificacion ? new Date(item.ultima_modificacion).toLocaleString('es-MX') : '',
          flagMod: item.flag_mod || false
        };
      });
      setData(mapped.length > 0 ? mapped : MOCK_DATA);
    } else {
      setData(MOCK_DATA); // Fallback si no hay red
    }
    setLoadingDb(false);
  };

  useEffect(() => {
    fetchReparaciones();
  }, []);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeRepair, setActiveRepair] = useState(null);

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

  const openDrawer = (repair = null) => {
    setActiveRepair(repair);
    setIsDrawerOpen(true);
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(data.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    // Collect the UUIDs of the selected mock IDs by matching them.
    const selectedUuids = data.filter(item => selectedIds.includes(item.id) && item.uuid).map(item => item.uuid);
    
    // Si hay uuids, borrarlos de la BD. Los mocks sin UUID no se borrarán de Supabase.
    if (selectedUuids.length > 0) {
      await supabase.from('reparaciones_shopcar').delete().in('id', selectedUuids);
    }

    // Refresh view
    setData(data.filter(item => !selectedIds.includes(item.id)));
    setSelectedIds([]);
    setShowDeleteConfirm(false);
  };

  // Helper para renderizar los badges de Etapa
  const renderEtapaBadge = (etapa) => {
    let baseClass = 'badge ';
    switch (etapa) {
      case 'IDENTIFICACION':
      case 'COTIZACION':
        baseClass += 'bg-slate-100 text-slate-700 border-slate-200';
        break;
      case 'REQUISICION':
      case 'ORDEN COMPRA':
        baseClass += 'bg-purple-100 text-purple-700 border-purple-200';
        break;
      case 'OPERACION':
        baseClass += 'bg-orange-100 text-orange-700 border-orange-200';
        break;
      case 'FACTURACION':
        baseClass += 'bg-teal-100 text-teal-700 border-teal-200';
        break;
      case 'FINALIZADO':
        baseClass += 'status-success';
        break;
      default:
        baseClass += 'bg-gray-100 text-gray-700';
    }
    return <span className={baseClass}>{etapa}</span>;
  };

  // Helper para renderizar la barra de progreso estilo Batería
  const renderProgressBar = (avance) => {
    let barColor = '#D32F2F'; // 0 - 25% (Rojo Crítico)
    if (avance > 25 && avance <= 50) barColor = '#F57C00'; // Naranja
    else if (avance > 50 && avance <= 80) barColor = '#FFA000'; // Amarillo
    else if (avance > 80 && avance < 100) barColor = '#7CB342'; // Verde Claro
    else if (avance === 100) barColor = '#388E3C'; // Verde Full
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', width: '36px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#2C3E50' }}>
          {avance}%
        </span>
        <div style={{ height: '8px', width: '64px', backgroundColor: '#E0E4E8', borderRadius: '3px', overflow: 'hidden', border: '1px solid #B0BEC5', flexShrink: 0 }}>
          <div 
            style={{ height: '100%', backgroundColor: barColor, transition: 'all 0.4s ease', width: `${avance}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* HEADER & TOP ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F4287', margin: 0 }}>Control de Reparaciones</h1>
          <p style={{ fontSize: '13px', color: '#7F8C8D', marginTop: '4px' }}>Dashboard integral de monitoreo de unidades en taller</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              style={{ padding: '6px 12px', background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
            >
              <Trash2 size={16} style={{ marginRight: '8px' }} />
              Eliminar {selectedIds.length} seleccionado(s)
            </button>
          )}
          <button className="btn-secondary">
            <FileText size={16} /> Exportar XLS
          </button>
          <button onClick={() => openDrawer()} className="btn-success">
            <Plus size={16} /> Nueva Reparación
          </button>
        </div>
      </div>

      {/* CONFIRMACION ELIMINACION MODAL/INLINE */}
      {showDeleteConfirm && (
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '6px', padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AlertCircle color="#D32F2F" size={28} style={{ marginRight: '16px' }} />
            <div>
              <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#B71C1C', margin: 0 }}>¿Estás seguro que deseas eliminar {selectedIds.length} registro(s)?</p>
              <p style={{ fontSize: '13px', color: '#D32F2F', marginTop: '4px' }}>Esta acción no se puede deshacer y afectará permanentemente el historial.</p>
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary" style={{ marginRight: '12px' }}>Cancelar</button>
            <button onClick={handleDelete} className="btn-danger">Sí, eliminar registros</button>
          </div>
        </div>
      )}

      {/* BARRA DE HERRAMIENTAS - VISTA */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button 
          onClick={() => {
            setSortConfig({ key: null, direction: 'asc' });
            setFilters({});
          }}
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', fontWeight: '500', fontSize: '13px' }}
        >
          <Filter size={16} />
          Restablecer Vista por Defecto
        </button>
      </div>

      {/* DATA TABLE CONTAINER */}
      <div className="card flex-1 flex flex-col p-0 overflow-hidden shadow-sm border border-slate-200/60">
        <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs font-medium text-slate-500">
          <span>Vista de Registros (Total: {filteredAndSortedData.length})</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> Finalizado</span>
            <span className="flex items-center gap-1 ml-3"><span className="w-2 h-2 rounded-full bg-orange-500 block"></span> Operación</span>
          </div>
        </div>
        
        {/* Usamos un overflow-x-auto nativo en el wrapper de la tabla para soportar las 18 columnas sin aplastarse */}
        <div className="flex-1 overflow-x-auto overflow-y-auto w-full">
          <table className="data-table" style={{ width: '100%', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{ width: '40px', minWidth: '40px', verticalAlign: 'top', paddingTop: '12px' }} className="text-center bg-slate-50 border-b border-slate-200">
                  <input type="checkbox" checked={selectedIds.length === data.length && data.length > 0} onChange={toggleSelectAll} style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
                </th>
                {renderHeader('Item', 'id', 'center')}
                {renderHeader('Cliente', 'cliente')}
                {renderHeader('Modalidad', 'modalidad')}
                {renderHeader('F. Pedido', 'fechaPedido')}
                {renderHeader('Localidad', 'localidad')}
                {renderHeader('Iniciales', 'iniciales')}
                {renderHeader('Número', 'numero')}
                {renderHeader('Tipo', 'tipo')}
                {renderHeader('F. Ingreso', 'fechaIngreso')}
                {renderHeader('Días T.', 'diasTaller', 'center')}
                {renderHeader('Motivo Corte', 'motivoCorte')}
                {renderHeader('F. Envío DM', 'fechaEnvioDM')}
                {renderHeader('Etapa', 'etapa')}
                {renderHeader('Vía', 'via')}
                {renderHeader('Docs', 'docs', 'center')}
                {renderHeader('F. Entrega', 'fechaEntrega')}
                {renderHeader('% Avance', 'avance')}
                {renderHeader('U. Modificada', 'ultimaMod')}
                {renderHeader('Observaciones', 'observaciones')}
                <th className="sticky right-0 bg-slate-50 border-l z-10 text-center border-b border-slate-200">...</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((row) => (
                <tr key={row.id} onDoubleClick={() => openDrawer(row)} className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${selectedIds.includes(row.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(row.id)} 
                      onChange={() => toggleSelect(row.id)} 
                      className="rounded border-slate-300 text-primary cursor-pointer w-4 h-4 ml-2" 
                    />
                  </td>
                  <td className="text-center font-medium text-slate-500">{row.id}</td>
                  <td className="font-semibold text-slate-700">{row.cliente}</td>
                  <td><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">{row.modalidad}</span></td>
                  <td className="text-slate-500 tabular-nums">{row.fechaPedido}</td>
                  <td className="truncate text-slate-600" title={row.localidad}>{row.localidad}</td>
                  <td className="font-mono text-slate-600">{row.iniciales}</td>
                  <td className="font-mono font-medium text-slate-800">{row.numero}</td>
                  <td className="text-slate-600">{row.tipo}</td>
                  <td className="text-slate-500 tabular-nums">{row.fechaIngreso}</td>
                  <td className="text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${row.diasTaller > 100 ? 'bg-red-50 text-red-600' : 'text-slate-600'}`}>
                      {row.diasTaller}
                    </span>
                  </td>
                  <td className="text-xs text-slate-600 font-medium truncate" title={row.motivoCorte}>{row.motivoCorte}</td>
                  <td className="text-slate-500 tabular-nums">{row.fechaEnvioDM}</td>
                  <td>{renderEtapaBadge(row.etapa)}</td>
                  <td className="text-xs text-slate-500">{row.via}</td>
                  <td className="text-center">
                    <div className="flex justify-center gap-1 text-slate-400">
                      {row.docs > 0 ? (
                        <>
                          <FileText size={14} className="hover:text-blue-500 cursor-pointer" />
                          <FileText size={14} className="hover:text-blue-500 cursor-pointer" />
                        </>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </div>
                  </td>
                  <td className="text-slate-500 tabular-nums font-medium">{row.fechaEntrega}</td>
                  <td style={{ paddingRight: '16px' }}>{renderProgressBar(row.avance)}</td>
                  <td style={{ fontSize: '12px', fontWeight: 500 }}>
                    {row.flagMod ? (
                      <span style={{ color: '#C62828', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', backgroundColor: '#FFEBEE', padding: '2px 8px', borderRadius: '4px', border: '1px solid #FFCDD2', width: 'max-content' }}>
                        <AlertCircle size={12}/> {row.ultimaMod}
                      </span>
                    ) : (
                      <span style={{ color: '#7F8C8D' }}>{row.ultimaMod}</span>
                    )}
                  </td>
                  <td style={{ fontSize: '11px', color: '#7F8C8D', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.observaciones}>{row.observaciones}</td>
                  <td className="sticky right-0 border-l text-center transition-colors" style={{ backgroundColor: '#fcfcfc', width: '50px', minWidth: '50px' }}>
                    <button onClick={(e) => { e.stopPropagation(); openDrawer(row); }} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER - Paginación limpia */}
        <div className="border-t border-slate-200 bg-white p-3 flex justify-between items-center text-sm text-slate-500">
          <span>Mostrando {filteredAndSortedData.length} registros (filtrado)</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50" disabled>Anterior</button>
            <button className="px-3 py-1 border border-primary text-primary bg-primary/5 rounded font-medium">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">2</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">3</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Siguiente</button>
          </div>
        </div>
      </div>

      <RepairHubDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => {
          setIsDrawerOpen(false);
          setActiveRepair(null);
        }} 
        repairData={activeRepair} 
        onRefresh={fetchReparaciones}
      />
    </div>
  );
}

// Icono Helper inline para no llenar los imports arriba
function ChevronDown({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
