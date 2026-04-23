import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  DollarSign, 
  Wallet, 
  FileText, 
  PieChart, 
  UploadCloud, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Users
} from 'lucide-react';

const ControlFinanciero = () => {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Falsa Data
  const [anticipoForm, setAnticipoForm] = useState({
    empleado_id: '',
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    monto: ''
  });

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fin_empleados')
        .select('*')
        .order('nombre_completo', { ascending: true });
        
      if (error) throw error;
      setEmpleados(data || []);
    } catch (error) {
      console.error('Error fetching empleados:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnticipoSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...anticipoForm,
        monto: parseFloat(anticipoForm.monto)
      };

      const { error } = await supabase
        .from('fin_anticipos')
        .insert([payload]);
        
      if (error) throw error;
      
      alert('Anticipo inyectado a la cuenta del empleado correctamente.');
      setAnticipoForm({
        empleado_id: '',
        fecha: new Date().toISOString().split('T')[0],
        concepto: '',
        monto: ''
      });
      // Optionally trigger a refetch of balances if needed later
    } catch (error) {
      console.error('Error insertando anticipo:', error.message);
      alert('Hubo un error al inyectar los fondos: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1F2937', display: 'flex', alignItems: 'center' }}>
            <Wallet size={28} style={{ marginRight: '8px', color: '#1F4287' }} />
            Control Financiero y Egresos
          </h1>
          <p style={{ margin: '0', color: '#6B7280', fontSize: '14px' }}>
            Hub de Tesorería Empresarial para gestión de anticipos, captura automatizada de comprobantes y auditoría de cuentas.
          </p>
        </div>
      </div>

      {/* TABS NAVEGACIÓN */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E5E7EB', paddingBottom: '8px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('DASHBOARD')} 
          style={{ background: 'transparent', border: 'none', padding: '8px 16px', color: activeTab === 'DASHBOARD' ? '#1F4287' : '#6B7280', borderBottom: activeTab === 'DASHBOARD' ? '3px solid #1F4287' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <PieChart size={16}/> Análisis y Radar
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>Indicadores de egresos por rubro</div>
        </button>

        <button 
          onClick={() => setActiveTab('ESTADO_CUENTA')} 
          style={{ background: 'transparent', border: 'none', padding: '8px 16px', color: activeTab === 'ESTADO_CUENTA' ? '#1F4287' : '#6B7280', borderBottom: activeTab === 'ESTADO_CUENTA' ? '3px solid #1F4287' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <Users size={16}/> Estado de Cuenta
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>Saldos vigentes por empleado</div>
        </button>

        <button 
          onClick={() => setActiveTab('ANTICIPOS')} 
          style={{ background: 'transparent', border: 'none', padding: '8px 16px', color: activeTab === 'ANTICIPOS' ? '#1F4287' : '#6B7280', borderBottom: activeTab === 'ANTICIPOS' ? '3px solid #1F4287' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <DollarSign size={16}/> Anticipos
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>Otorgamiento de inyecciones de capital</div>
        </button>

        <button 
          onClick={() => setActiveTab('COMPROBACIONES')} 
          style={{ background: 'transparent', border: 'none', padding: '8px 16px', color: activeTab === 'COMPROBACIONES' ? '#1F4287' : '#6B7280', borderBottom: activeTab === 'COMPROBACIONES' ? '3px solid #1F4287' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <FileText size={16}/> Comprobación Inteligente
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>Captura XML Automatizada y Remisiones</div>
        </button>
      </div>

      {/* RENDERIZADO CONDICIONAL DE PESTAÑAS */}
      
      {activeTab === 'DASHBOARD' && (
        <div style={{ padding: '40px', textAlign: 'center', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
          <PieChart size={48} style={{ color: '#9CA3AF', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>Análisis Financiero</h3>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>Aquí construiremos las gráficas de Egresos por Concepto (Gasto/SubGasto).</p>
        </div>
      )}

      {activeTab === 'ESTADO_CUENTA' && (
        <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
             <h3 style={{ margin: 0, color: '#1F2937' }}>Saldos de Personal</h3>
             <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }} />
                <input 
                  type="text" 
                  placeholder="Buscar empleado..." 
                  style={{ padding: '8px 12px 8px 36px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', width: '250px' }}
                />
             </div>
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             {empleados.map(emp => {
                // TODO: Saldo real calculado desde base de datos (por ahora en 0 para visualización)
                const saldoReal = 0; 

                return (
                <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
                   <div>
                     <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '14px' }}>{emp.nombre_completo}</div>
                     <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Depto. {emp.departamento}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Saldo por comprobar</div>
                     {saldoReal > 0 ? (
                       <span style={{ fontWeight: 700, color: '#DC2626', fontSize: '16px' }}>
                         $ {saldoReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                       </span>
                     ) : saldoReal < 0 ? (
                       <span style={{ fontWeight: 700, color: '#059669', fontSize: '16px' }}>
                         A Favor: $ {Math.abs(saldoReal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                       </span>
                     ) : (
                       <span style={{ fontWeight: 700, color: '#10B981', fontSize: '16px' }}>
                         $ 0.00
                       </span>
                     )}
                   </div>
                </div>
             )})}
           </div>
        </div>
      )}

      {activeTab === 'ANTICIPOS' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          
          <div style={{ paddingRight: '24px', borderRight: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1F2937', fontSize: '18px', display: 'flex', alignItems: 'center' }}>
              <DollarSign size={20} style={{ marginRight: '8px', color: '#10B981' }} />
              Otorgar Nuevo Anticipo
            </h3>
            <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '24px' }}>
              Los fondos asignados aquí sumarán al "Saldo por comprobar" del empleado seleccionado. Se requiere factura o recibo para solventarlo posteriormente.
            </p>

            <form onSubmit={handleAnticipoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Empleado Beneficiario *</label>
                <select 
                  required
                  value={anticipoForm.empleado_id}
                  onChange={(e) => setAnticipoForm({...anticipoForm, empleado_id: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                >
                  <option value="">-- Seleccione un empleado --</option>
                  {empleados.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nombre_completo} ({emp.departamento})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Monto (MXN) *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    step="0.01"
                    placeholder="Ej. 5000"
                    value={anticipoForm.monto}
                    onChange={(e) => setAnticipoForm({...anticipoForm, monto: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Fecha de Emisión *</label>
                  <input 
                    type="date" 
                    required
                    value={anticipoForm.fecha}
                    onChange={(e) => setAnticipoForm({...anticipoForm, fecha: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Concepto o Motivo *</label>
                <textarea 
                  required
                  placeholder="Ej. Viáticos viaje a Monterrey para inspección..."
                  rows="3"
                  value={anticipoForm.concepto}
                  onChange={(e) => setAnticipoForm({...anticipoForm, concepto: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit" 
                style={{ marginTop: '8px', width: '100%', background: '#10B981', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                <Plus size={18} style={{ marginRight: '8px' }} /> Confirmar Inyección de Fondos
              </button>
            </form>
          </div>

          <div>
             <h3 style={{ margin: '0 0 16px 0', color: '#1F2937', fontSize: '18px' }}>Historial del Empleado</h3>
             <div style={{ padding: '30px', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB', textAlign: 'center' }}>
                <AlertCircle size={32} style={{ color: '#9CA3AF', margin: '0 auto 12px' }} />
                <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>
                  Selecciona un empleado a la izquierda para ver cuántos anticipos le has otorgado recientemente y si han sido comprobados.
                </p>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'COMPROBACIONES' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          
          {/* LADO IZQUIERDO: DROPZONE */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1F2937', fontSize: '16px' }}>Captura Automatizada</h3>
            
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', border: '2px dashed #3B82F6', borderRadius: '8px', background: '#EFF6FF', cursor: 'pointer', transition: 'all 0.2s' }}>
               <UploadCloud size={48} style={{ color: '#3B82F6', marginBottom: '16px' }} />
               <span style={{ fontWeight: 600, color: '#1E40AF' }}>Arrastra tu archivo XML aquí</span>
               <span style={{ fontSize: '13px', color: '#60A5FA', marginTop: '4px' }}>o haz clic para explorar</span>
               <input type="file" accept=".xml" style={{ display: 'none' }} onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(ev.target.result, "text/xml");
                    
                    const comp = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0] || xmlDoc.getElementsByTagName("Comprobante")[0];
                    const semi = xmlDoc.getElementsByTagName("cfdi:Emisor")[0] || xmlDoc.getElementsByTagName("Emisor")[0];
                    const tfd = xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0];

                    const sub = comp ? comp.getAttribute("SubTotal") : '0.00';
                    const tot = comp ? comp.getAttribute("Total") : '0.00';
                    const diff = (parseFloat(tot) - parseFloat(sub)).toFixed(2);
                    
                    document.getElementById('xml_rfc').value = semi ? semi.getAttribute("Rfc") : 'SIN RFC';
                    document.getElementById('xml_nombre').value = semi ? semi.getAttribute("Nombre") : 'SIN NOMBRE';
                    document.getElementById('xml_sub').value = sub;
                    document.getElementById('xml_iva').value = diff !== 'NaN' ? diff : '0.00';
                    document.getElementById('xml_tot').value = tot;
                    document.getElementById('xml_uuid').value = tfd ? tfd.getAttribute("UUID") : 'PENDIENTE FISCAL';
                  };
                  reader.readAsText(file);
               }} />
            </label>
            
            <div style={{ marginTop: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '6px', fontSize: '13px', color: '#4B5563' }}>
              <AlertCircle size={16} style={{ marginBottom: '8px', color: '#F59E0B' }}/>
              <p style={{ margin: 0 }}>El sistema descifrará los nodos CFDI del SAT automáticamente para agilizar la captura y evitar errores matemáticos.</p>
            </div>
          </div>

          {/* LADO DERECHO: FORMULARIO RESULTANTE */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1F2937', fontSize: '16px' }}>Datos Extraídos de la Comprobación</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>RFC EMISOR</label>
                <input id="xml_rfc" type="text" readOnly style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#F9FAFB', fontWeight: 600 }} placeholder="..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>RAZÓN SOCIAL / NOMBRE</label>
                <input id="xml_nombre" type="text" readOnly style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#F9FAFB' }} placeholder="..." />
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>FOLIO FISCAL (UUID)</label>
                <input id="xml_uuid" type="text" readOnly style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#F9FAFB', fontSize: '12px' }} placeholder="00000000-0000-0000-0000-000000000000" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>TIPO DE GASTO</label>
                <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', background: 'white' }}>
                  <option>Seleccione...</option>
                  <option>COMBUSTIBLES</option>
                  <option>VIÁTICOS Y HOSPEDAJE</option>
                  <option>TORNILLERÍA</option>
                  <option>PAPELERÍA</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>EMPLEADO A COMPROBAR</label>
                <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', background: 'white' }}>
                  <option>Seleccione Empleado...</option>
                  <option>Salvador Del Valle Villazar</option>
                  <option>Eduardo Munoz</option>
                  <option>Jacob Saucedo</option>
                </select>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed #E5E7EB' }}>
               <div style={{ flex: 1 }}>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>SUBTOTAL</label>
                 <input id="xml_sub" type="text" readOnly style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#F3F4F6', color: '#4B5563', fontSize: '16px' }} placeholder="$ 0.00" />
               </div>
               <div style={{ flex: 1 }}>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>I.V.A.</label>
                 <input id="xml_iva" type="text" readOnly style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#F3F4F6', color: '#4B5563', fontSize: '16px' }} placeholder="$ 0.00" />
               </div>
               <div style={{ flex: 1 }}>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>TOTAL FACTURADO</label>
                 <input id="xml_tot" type="text" readOnly style={{ width: '100%', padding: '8px 12px', border: '2px solid #10B981', borderRadius: '6px', background: '#ECFDF5', color: '#047857', fontWeight: 700, fontSize: '18px' }} placeholder="$ 0.00" />
               </div>
            </div>

            <button style={{ marginTop: '24px', width: '100%', background: '#1F4287', color: 'white', padding: '12px', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} /> Validar y Guardar Comprobación
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ControlFinanciero;
