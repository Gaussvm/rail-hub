import React, { useState } from 'react';
import { ArrowRightLeft, Search, Save, CheckCircle2, Package, MapPin } from 'lucide-react';

export default function Traspasos() {
  const [fechaHoy] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* HEADER DE MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E0E4E8', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#8E44AD', margin: 0, display: 'flex', alignItems: 'center' }}>
            <ArrowRightLeft size={24} style={{ marginRight: '8px' }} />
            Suministro y Traspaso
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#7F8C8D', fontSize: '13px' }}>
            Movimientos internos de inventario entre distintas sucursales.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
        
        {/* BLOQUE 1: Selección de Artículo */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#7F8C8D', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '1px solid #E0E4E8', paddingBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <Package size={14} style={{ marginRight: '6px' }} /> 1. Material a Traspasar
          </h3>
          <div className="grid-form" style={{ gridTemplateColumns: 'minmax(200px, 1fr) 2fr 1fr' }}>
            <div className="form-group">
              <label className="form-label font-bold text-gray-900">Código de Artículo *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="form-input" style={{ flex: 1, border: '1px solid #3498DB', fontWeight: 600 }} placeholder="Ej. LUB-101" />
                <button className="btn-primary" style={{ padding: '0 12px', background: '#3498DB', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }} title="Buscar Artículo">
                  <Search size={16} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción del Artículo</label>
              <input type="text" className="form-input" style={{ background: '#F8FAFC', color: '#7F8C8D' }} readOnly value="ACEITE LUBRICANTE TRUPER 500ML (Simulado)" />
            </div>
            <div className="form-group">
              <label className="form-label">Stock Disponible</label>
              <input type="text" className="form-input" style={{ background: '#F8FAFC', fontWeight: 800, textAlign: 'center', color: '#1F4287' }} readOnly value="145 PZ" />
            </div>
          </div>
        </div>

        {/* BLOQUE 2: Logística de Movimiento */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#7F8C8D', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '1px solid #E0E4E8', paddingBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <MapPin size={14} style={{ marginRight: '6px' }} /> 2. Logística Operativa (Origen a Destino)
          </h3>
          <div className="grid-form" style={{ gridTemplateColumns: 'minmax(250px, 1fr) 40px minmax(250px, 1fr)' }}>
            <div className="form-group" style={{ background: '#FFF5F5', padding: '16px', borderRadius: '8px', border: '1px solid #FADBD8' }}>
              <label className="form-label" style={{ color: '#C0392B', fontWeight: 700 }}>📍 Origen (Reducir Stock)</label>
              <div className="select-container">
                <select className="form-input" style={{ width: '100%', borderColor: '#E74C3C', color: '#C0392B', fontWeight: 600 }}>
                  <option value="">Seleccione Localidad Origen...</option>
                  <option>TALLER PRINCIPAL</option>
                  <option>HERMOSILLO, SONORA</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BDC3C7' }}>
              <ArrowRightLeft size={24} />
            </div>

            <div className="form-group" style={{ background: '#F9EBEA', padding: '16px', borderRadius: '8px', border: '1px solid #D5F5E3', backgroundColor: '#EAFAF1' }}>
              <label className="form-label" style={{ color: '#27AE60', fontWeight: 700 }}>🏁 Destino (Aumentar Stock)</label>
              <div className="select-container">
                <select className="form-input" style={{ width: '100%', borderColor: '#2ECC71', color: '#27AE60', fontWeight: 600 }}>
                  <option value="">Seleccione Localidad Destino...</option>
                  <option>ALZADA, COLIMA</option>
                  <option>SILAO GM, GTO</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 3: Cantidades y Detalles */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#7F8C8D', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '1px solid #E0E4E8', paddingBottom: '8px' }}>
            3. Detalles del Movimiento
          </h3>
          <div className="grid-form" style={{ gridTemplateColumns: '1fr 1fr 2fr' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: '#34495E' }}>Cantidad TRASPASO *</label>
              <input type="number" className="form-input" style={{ border: '2px solid #8E44AD', fontSize: '16px', fontWeight: 800, textAlign: 'center', color: '#8E44AD' }} placeholder="0" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Condición del Material</label>
              <input type="text" className="form-input" placeholder="Ej. NUEVO, USADO..." />
            </div>
            <div className="form-group">
              <label className="form-label">Comentarios / Motivo de Traspaso</label>
              <input type="text" className="form-input" placeholder="Escriba la justificación operativa aquí..." />
            </div>
          </div>
        </div>

        {/* BLOQUE 4: Metadatos y Guardado */}
        <div style={{ background: '#F8FAFC', border: '1px solid #EAECEF', padding: '16px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Usuario Autoriza</label>
              <div style={{ fontWeight: 600, color: '#34495E', fontSize: '13px' }}>SALVADOR DEL VALLE VILLAZAR</div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Fecha Efectiva</label>
              <input type="date" className="form-input" style={{ height: '30px', fontSize: '13px' }} defaultValue={fechaHoy} />
            </div>
          </div>
          
          <button style={{ height: '44px', padding: '0 32px', background: '#8E44AD', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(142, 68, 173, 0.2)' }}>
            <Save size={18} style={{ marginRight: '8px' }} />
            Ejecutar Traspaso Logístico
          </button>
        </div>

      </div>
      
      {/* Opcional: Tabla de últimos traspasos del día para feedback rápido */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#7F8C8D', marginBottom: '8px' }}>
          Últimos traspasos registrados hoy
        </h3>
        <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#fff' }}>
              <th style={{ width: '80px', textAlign: 'center' }}>Hora</th>
              <th>Artículo</th>
              <th>Origen</th>
              <th>Destino</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Cantidad</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Estatus</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#95A5A6', fontStyle: 'italic', background: '#F8FAFC' }}>
                Ningún traspaso registrado en esta sesión.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
