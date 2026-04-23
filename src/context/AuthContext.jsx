import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Aquí cargaremos su fila de sys_usuarios
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión actual inicialmente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.email);
      } else {
        setLoading(false);
      }
    });

    // 2. Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.email);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authEmail) => {
    try {
      // Cruzamos el email de Auth (ej. jperez@railhub.local) con nuestro sys_usuarios
      const { data, error } = await supabase
        .from('sys_usuarios')
        .select('*')
        .eq('email', authEmail)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error buscando perfil de usuario:", error);
      }
      
      if (data) {
        // Parseamos json si viene en string
        const profile = {
          ...data,
          accesos_modulos: typeof data.accesos_modulos === 'string' ? JSON.parse(data.accesos_modulos) : data.accesos_modulos
        };
        setUserProfile(profile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    });
    
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, userProfile, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
