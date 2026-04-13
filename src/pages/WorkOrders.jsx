import React from 'react';
import { FileEdit, Printer, XCircle } from 'lucide-react';

const WorkOrders = () => {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Control de Reparaciones (Shop Car)</h2>
        <div className="flex gap-sm">
          <button className="btn-secondary">Exportar a Excel</button>
          <button className="btn-primary">Nueva Orden de Trabajo</button>
        </div>
      </div>
      
      <div className="panel-body" style={{ padding: 0 }}>
        {/* Filter bar */}
        <div className="flex items-center gap-md" style={{ padding: '12px var(--spacing-md)', borderBottom: '1px solid var(--border-color)', backgroundColor: '#fcfcfc' }}>
          <div className="flex items-center gap-sm">
            <label style={{fontWeight: 500}}>Estado:</label>
            <select>
              <option>Todos (Activos)</option>
              <option>En progreso</option>
              <option>Esperando refacciones</option>
            </select>
          </div>
          <div className="flex items-center gap-sm">
            <label style={{fontWeight: 500}}>Unidad:</label>
            <input type="text" placeholder="FXE-..." style={{ width: '120px' }} />
          </div>
        </div>

        {/* High Density Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Folio</th>
                <th>Unidad (Locomotora/Vagón)</th>
                <th>Fecha Ingreso</th>
                <th>Falla Reportada</th>
                <th>Técnico Asignado</th>
                <th>Estado</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({length: 12}).map((_, i) => (
                <tr key={i}>
                  <td><strong>WO-{4023 + i}</strong></td>
                  <td>FXE-{9000 + i * 23}</td>
                  <td>12/10/2026</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>Falla en compresión de frenos eje {i+1}</td>
                  <td>García, M.</td>
                  <td>
                    {i % 3 === 0 ? (
                      <span style={{ backgroundColor: '#fff3e0', color: '#e65100', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>ESPERANDO REFACCIONES</span>
                    ) : (
                      <span style={{ backgroundColor: '#e3f2fd', color: '#1565c0', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>EN PROGRESO</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex gap-sm justify-center">
                      <button title="Editar" style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--color-primary)' }}><FileEdit size={16} /></button>
                      <button title="Imprimir" style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--color-text-muted)' }}><Printer size={16} /></button>
                      <button title="Cancelar" style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--color-danger)' }}><XCircle size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkOrders;
