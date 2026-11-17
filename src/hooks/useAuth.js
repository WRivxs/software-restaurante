import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from './useStore';

/**
 * Hook de autenticación optimizado v3.0.
 * Eliminados parches temporales y normalizado flujo de roles.
 */
export function useAuth() {
  const { user, setUser, logout } = useAppStore();
  const [loading, setLoading] = useState(true); // Empezamos en loading real

  useEffect(() => {
    // 1. Revisar sesión inicial
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (e) {
        console.error('❌ useAuth: Error en checkSession:', e);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Escuchar cambios de estado (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 useAuth: Evento de Auth:', event);
        
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          setLoading(true);
          await fetchUserProfile(session.user.id);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          logout();
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(uid) {
    try {
      console.log('🔍 useAuth: Solicitando perfil para:', uid);
      
      // Timeout más razonable de 5 segundos para conexiones lentas
      const profilePromise = supabase
        .from('usuarios')
        .select('*')
        .eq('id', uid)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_DB')), 5000)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);
      
      if (error) throw error;

      if (data) {
        // Normalización garantizada de rol
        const normalizedData = {
          ...data,
          rol: data.rol ? data.rol.toUpperCase() : 'MESERO'
        };
        console.log('✅ useAuth: Perfil verificado:', normalizedData.rol);
        setUser(normalizedData);
      } else {
        throw new Error('USER_NOT_FOUND_IN_DB');
      }
    } catch (e) {
      console.error('⚠️ useAuth: No se pudo cargar perfil real:', e.message);
      
      // Si ya tenemos un usuario en el store (persistido), NO lo borramos por un error de red
      // Esto evita cierres de sesión por micro-cortes.
      if (!user) {
        setUser(null); 
      }
      
      if (e.message === 'TIMEOUT_DB') {
        console.warn('⌛ La base de datos está lenta, manteniendo sesión persistida.');
      }
    }
  }

  async function loginWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    logout();
  }

  return { user, loading, loginWithEmail, signOut };
}
