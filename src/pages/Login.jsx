import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, TrainFront, KeyRound, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMSG, setErrorMSG] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMSG('');
    if (!username || !password) {
      setErrorMSG('Ingrese su nombre de usuario y contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username, password);
      // Tras un login exitoso, navegamos al Dashboard principal
      navigate('/');
    } catch (error) {
      setErrorMSG('Credenciales incorrectas o usuario bloqueado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', // Deep corporate blue
      fontFamily: '"Inter", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Ornaments */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />

      {/* Glassmorphism Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '48px 40px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 10
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '16px' }}>
            <img src="/logo-railhub-bg.png" alt="Rail-Hub Logo" style={{ height: '80px', width: 'auto', display: 'block' }} />
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {errorMSG && (
             <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontSize: '13px' }}>
                <ShieldAlert size={16} /> <span>{errorMSG}</span>
             </div>
          )}

          <div>
             <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Email Corporativo
             </label>
             <input 
                type="email" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ej. jperez@empresa.com" 
                style={{
                  width: '100%', height: '48px', padding: '0 16px', 
                  background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px', color: 'white', outline: 'none', fontSize: '15px',
                  boxSizing: 'border-box'
                }} 
             />
          </div>

          <div>
             <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Contraseña
             </label>
             <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" 
                style={{
                  width: '100%', height: '48px', padding: '0 16px', 
                  background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px', color: 'white', outline: 'none', fontSize: '15px',
                  boxSizing: 'border-box'
                }} 
             />
          </div>

          <button 
             type="submit" 
             disabled={isSubmitting}
             style={{
               marginTop: '8px', height: '48px', width: '100%', borderRadius: '12px',
               background: isSubmitting ? 'rgba(56, 189, 248, 0.5)' : '#38bdf8',
               color: '#0f172a', fontWeight: 800, fontSize: '15px', border: 'none', cursor: isSubmitting ? 'wait' : 'pointer',
               display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
               transition: 'background 0.2s',
             }}>
             {isSubmitting ? <><Loader2 size={18} className="spinning" /> Autenticando...</> : <><KeyRound size={18} /> Iniciar Sesión Operativa</>}
          </button>

        </form>

      </div>
      
      <div style={{ position: 'absolute', bottom: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
        &copy; {new Date().getFullYear()} Autocom Services S.A. DE C.V.<br/>Acceso restringido al personal corporativo.<br/>
        <span style={{ marginTop: '8px', display: 'block', color: '#94a3b8' }}>Powered by <b>ZENOX</b></span>
      </div>

    </div>
  );
}
