import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart2, 
  Download, 
  Calendar, 
  MapPin, 
  Search,
  Filter,
  Wrench,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

const MOCK_OPERACIONES = [
  { id: 'SC-1029', car: 'FXE-40192', prioridad: 'Alta', diasTaller: 5, estatus: 'En Proceso', refacciones: 3 },
  { id: 'SC-1030', car: 'KCS-1847', prioridad: 'Media', diasTaller: 2, estatus: 'Inspección', refacciones: 0 },
  { id: 'SC-1031', car: 'FXE-5510', prioridad: 'Crítica', diasTaller: 12, estatus: 'Pausado', refacciones: 8 }
];

const MOCK_COTIZACIONES = [
  { folio: 'COT-8812', car: 'FXE-40192', fecha: '2026-04-10', montoUSD: 1450.00, estatus: 'Pendiente Cliente', revisor: 'A. Gómez' },
  { folio: 'COT-8813', car: 'UP-99201', fecha: '2026-04-11', montoUSD: 2300.50, estatus: 'Aprobada', revisor: 'J. Martínez' },
  { folio: 'COT-8814', car: 'BNSF-112', fecha: '2026-04-12', montoUSD: 850.25, estatus: 'Rechazada', revisor: 'A. Gómez' }
];

const MOCK_FINALIZADOS = [
  { folioSC: 'SC-990', car: 'FXE-119', fechaLiberacion: '2026-04-01', totalHoras: 45, montoUSD: 3200.00, via: 'V-1B' },
  { folioSC: 'SC-991', car: 'KCS-554', fechaLiberacion: '2026-04-05', totalHoras: 12, montoUSD: 890.00, via: 'V-2A' },
  { folioSC: 'SC-992', car: 'FXE-900', fechaLiberacion: '2026-04-08', totalHoras: 80, montoUSD: 5400.00, via: 'V-3C' }
];

const Reportes = () => {
  const [activeTab, setActiveTab] = useState('operaciones');

  const exportToExcel = (data, filename) => {
    // Convierte el JSON a worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    // Crea un workbook y añade el worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    // Descarga el archivo
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handleExport = () => {
    if (activeTab === 'operaciones') exportToExcel(MOCK_OPERACIONES, 'Op_Activas_ShopCar');
    if (activeTab === 'cotizaciones') exportToExcel(MOCK_COTIZACIONES, 'Cotizaciones_ShopCar');
    if (activeTab === 'finalizados') exportToExcel(MOCK_FINALIZADOS, 'Historial_Finalizados');
  };

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

  const renderKPIs = () => {
    switch (activeTab) {
      case 'operaciones':
        return (
          <>
            <div style={{...kpiCardStyle, borderLeft: '4px solid #F39C12'}}>
              <div style={titleStyle}><Wrench size={14}/> Unidades Activas</div>
              <div style={{...valueStyle, color: '#F39C12' }}>24</div>
            </div>
            <div style={{...kpiCardStyle, borderLeft: '4px solid #278EA5'}}>
              <div style={titleStyle}><Calendar size={14}/> Promedio Días en Taller</div>
              <div style={{...valueStyle, color: '#1F4287'}}>6.3</div>
            </div>
            <div style={{...kpiCardStyle, borderLeft: '4px solid #D32F2F', background: '#FFFBFA'}}>
              <div style={titleStyle}><AlertCircle size={14} color="#D32F2F"/> Críticas / Detenidas</div>
              <div style={{...valueStyle, color: '#D32F2F' }}>3</div>
            </div>
          </>
        );
      case 'cotizaciones':
        return (
          <>
            <div style={{...kpiCardStyle, borderLeft: '4px solid #F39C12'}}>
              <div style={titleStyle}><FileText size={14}/> Pendientes de Firma</div>
              <div style={{...valueStyle, color: '#F39C12' }}>18</div>
            </div>
            <div style={{...kpiCardStyle, borderLeft: '4px solid #27ae60'}}>
              <div style={titleStyle}><CheckCircle2 size={14}/> Aprobaciones (Semana)</div>
              <div style={{...valueStyle, color: '#27ae60' }}>$14,500 <span style={{fontSize:'16px', color:'#7F8C8D', fontWeight: 600}}>USD</span></div>
            </div>
            <div style={{...kpiCardStyle, borderLeft: '4px solid #1F4287'}}>
              <div style={titleStyle}><BarChart2 size={14}/> Ratio Rechazo</div>
              <div style={{...valueStyle, color: '#1F4287'}}>8%</div>
            </div>
          </>
        );
      case 'finalizados':
        return (
          <>
            <div style={{...kpiCardStyle, borderLeft: '4px solid #2E7D32'}}>
              <div style={titleStyle}><CheckCircle2 size={14}/> Liberadas (Mes)</div>
              <div style={{...valueStyle, color: '#2E7D32' }}>142</div>
            </div>
            <div style={{...kpiCardStyle, borderLeft: '4px solid #1F4287'}}>
              <div style={titleStyle}><Download size={14}/> Total Generado (USD)</div>
              <div style={{...valueStyle, color: '#1F4287' }}>$112,000</div>
            </div>
            <div style={{...kpiCardStyle, borderLeft: '4px solid #7F8C8D'}}>
              <div style={titleStyle}><Wrench size={14}/> Hr Promedio x Unidad</div>
              <div style={{...valueStyle, color: '#34495E'}}>34.5</div>
            </div>
          </>
        );
      default: return null;
    }
  };

  const renderTable = () => {
    if (activeTab === 'operaciones') {
      return (
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID ShopCar</th>
              <th>Unidad (Car)</th>
              <th>Prioridad</th>
              <th>Estatus Taller</th>
              <th style={{ textAlign: 'center' }}>Días Taller</th>
              <th style={{ textAlign: 'center' }}>Partidas Req.</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_OPERACIONES.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: '#278EA5' }}>{row.id}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '14px' }}>{row.car}</td>
                <td>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                    background: row.prioridad === 'Crítica' ? '#FFEBEE' : row.prioridad === 'Alta' ? '#FFF8E1' : '#E8F5E9',
                    color: row.prioridad === 'Crítica' ? '#D32F2F' : row.prioridad === 'Alta' ? '#F39C12' : '#2E7D32'
                  }}>
                    {row.prioridad}
                  </span>
                </td>
                <td>{row.estatus}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.diasTaller}</td>
                <td style={{ textAlign: 'center' }}>{row.refacciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (activeTab === 'cotizaciones') {
      return (
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Folio COT</th>
              <th>Unidad (Car)</th>
              <th>Fecha Emisión</th>
              <th>Revisor Autorizado</th>
              <th>Estatus</th>
              <th style={{ textAlign: 'right' }}>Monto (USD)</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_COTIZACIONES.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: '#1F4287' }}>{row.folio}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '14px' }}>{row.car}</td>
                <td>{row.fecha}</td>
                <td>{row.revisor}</td>
                <td>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                    background: row.estatus === 'Rechazada' ? '#FFEBEE' : row.estatus === 'Aprobada' ? '#E8F5E9' : '#E3F2FD',
                    color: row.estatus === 'Rechazada' ? '#D32F2F' : row.estatus === 'Aprobada' ? '#2E7D32' : '#1565C0'
                  }}>
                    {row.estatus}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                  ${row.montoUSD.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (activeTab === 'finalizados') {
      return (
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID ShopCar</th>
              <th>Unidad (Car)</th>
              <th>Fecha Liberación</th>
              <th>Vía Cierre</th>
              <th style={{ textAlign: 'center' }}>Total HRs</th>
              <th style={{ textAlign: 'right' }}>Liquidación (USD)</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_FINALIZADOS.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: '#7F8C8D' }}>{row.folioSC}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '14px' }}>{row.car}</td>
                <td style={{ color: '#2E7D32', fontWeight: 500 }}>{row.fechaLiberacion} <CheckCircle2 size={12} style={{marginLeft: '4px'}}/></td>
                <td>{row.via}</td>
                <td style={{ textAlign: 'center' }}>{row.totalHoras}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#1F4287' }}>
                  ${row.montoUSD.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E0E4E8', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F4287', margin: 0, display: 'flex', alignItems: 'center' }}>
            <BarChart2 size={24} style={{ marginRight: '8px' }} />
            Hub de Reportes
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>
            Centro de Mando Analítico para Operaciones, Cotizaciones y Finalizados.
          </p>
        </div>
      </div>

      {/* TOOLBAR SUPERIOR (Filtros Globales y Excel) */}
      <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Localidad / Taller</label>
            <div className="select-container" style={{ width: '200px' }}>
              <select style={{ height: '34px' }}>
                <option>SITAO TIGRE, GTO</option>
                <option>ALL (Global)</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Desde</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #BDC3C7', borderRadius: '4px', padding: '0 8px', background: '#fff' }}>
              <Calendar size={14} color="#7F8C8D" />
              <input type="date" style={{ border: 'none', height: '32px', outline: 'none', background: 'transparent' }} />
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Hasta</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #BDC3C7', borderRadius: '4px', padding: '0 8px', background: '#fff' }}>
              <Calendar size={14} color="#7F8C8D" />
              <input type="date" style={{ border: 'none', height: '32px', outline: 'none', background: 'transparent' }} />
            </div>
          </div>
          <button className="btn-secondary" style={{ height: '34px', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
            <Filter size={14} style={{ marginRight: '6px' }} /> Aplicar
          </button>
        </div>

        <button 
          onClick={handleExport}
          style={{ height: '36px', padding: '0 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(39, 174, 96, 0.2)' }}
        >
          <Download size={16} style={{ marginRight: '8px' }} />
          Exportar Excel ({activeTab})
        </button>
      </div>

      {/* KPI METRICS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {renderKPIs()}
      </div>

      {/* MAIN DATAGRID AREA WITH TABS */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '400px' }}>
        {/* TABS HEADER */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E0E4E8', background: '#f8f9fa' }}>
          <button 
            onClick={() => setActiveTab('operaciones')}
            style={{ flex: 1, padding: '14px', border: 'none', background: activeTab === 'operaciones' ? '#fff' : 'transparent', color: activeTab === 'operaciones' ? '#278EA5' : '#7F8C8D', fontWeight: activeTab === 'operaciones' ? 700 : 500, borderBottom: activeTab === 'operaciones' ? '3px solid #278EA5' : '3px solid transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}
          >
            <Wrench size={16} style={{ marginRight: '8px' }} /> Operaciones Activas
          </button>
          <button 
            onClick={() => setActiveTab('cotizaciones')}
            style={{ flex: 1, padding: '14px', border: 'none', background: activeTab === 'cotizaciones' ? '#fff' : 'transparent', color: activeTab === 'cotizaciones' ? '#1F4287' : '#7F8C8D', fontWeight: activeTab === 'cotizaciones' ? 700 : 500, borderBottom: activeTab === 'cotizaciones' ? '3px solid #1F4287' : '3px solid transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}
          >
            <FileText size={16} style={{ marginRight: '8px' }} /> Cotizaciones
          </button>
          <button 
            onClick={() => setActiveTab('finalizados')}
            style={{ flex: 1, padding: '14px', border: 'none', background: activeTab === 'finalizados' ? '#fff' : 'transparent', color: activeTab === 'finalizados' ? '#2E7D32' : '#7F8C8D', fontWeight: activeTab === 'finalizados' ? 700 : 500, borderBottom: activeTab === 'finalizados' ? '3px solid #2E7D32' : '3px solid transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}
          >
            <CheckCircle2 size={16} style={{ marginRight: '8px' }} /> Histórico Finalizados
          </button>
        </div>
        
        {/* TAB CONTENT (GRID) */}
        <div style={{ padding: '16px', overflowX: 'auto' }}>
          {renderTable()}
        </div>
      </div>

    </div>
  );
};

export default Reportes;
