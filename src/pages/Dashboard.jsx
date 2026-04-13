import React from 'react';

const Dashboard = () => {
  return (
    <div className="flex-col gap-lg">
      <div className="panel" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
        <div style={{ flex: 1, padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '4px', border: '1px solid #90caf9' }}>
          <h3 style={{ margin: 0, color: '#1565c0' }}>Unidades en Mantenimiento</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>14</p>
        </div>
        <div style={{ flex: 1, padding: '16px', backgroundColor: '#fff3e0', borderRadius: '4px', border: '1px solid #ffcc80' }}>
          <h3 style={{ margin: 0, color: '#e65100' }}>Órdenes Retrasadas</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>3</p>
        </div>
        <div style={{ flex: 1, padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '4px', border: '1px solid #a5d6a7' }}>
          <h3 style={{ margin: 0, color: '#2e7d32' }}>Entradas de Almacén Hoy</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>28</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Actividad de Personal - Turno Matutino</h2>
        </div>
        <div className="panel-body">
          <p>Seleccione un área para ver el detalle de operación de los equipos en patio.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
