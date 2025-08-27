import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'basic' | 'professional' | 'advanced';
  created_at: string;
  updated_at: string;
}

// Función simple para obtener mensaje de error
const getErrorMessage = (error: any): string => {
  if (!error) return 'Error desconocido';
  if (typeof error === 'string') return error;
  if (error.message) return String(error.message);
  return 'Ha ocurrido un error. Por favor intenta nuevamente.';
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setSession(session);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session);
        
        if (session) {
          setUser(session.user);
          setSession(session);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        const errorMsg = getErrorMessage(error);
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Si el usuario se registró pero necesita confirmar email
      if (data.user && !data.session) {
        const msg = 'Revisa tu email para confirmar tu cuenta';
        setError(msg);
        throw new Error(msg);
      }

      logger.info('User signed up successfully', 'useAuth', { email });
      return data;
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setError(errorMsg);
      logger.error('Sign up error', 'useAuth', { email, error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        let errorMessage = getErrorMessage(error);
        
        // Mensajes más claros según el tipo de error
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Confirma tu email antes de iniciar sesión';
        } else if (errorMessage.includes('Too many requests')) {
          errorMessage = 'Demasiados intentos. Espera unos minutos';
        }
        
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      logger.info('User signed in successfully', 'useAuth', { email });
      return data;
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setError(errorMsg);
      logger.error('Sign in error', 'useAuth', { email, error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        const errorMsg = getErrorMessage(error);
        throw new Error(errorMsg);
      }
      
      // Limpiar estado local
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setError(errorMsg);
      logger.error('Sign out error', 'useAuth', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);

    if (!email || !email.includes('@')) {
      const msg = 'Email inválido';
      setError(msg);
      setLoading(false);
      throw new Error(msg);
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setError('Error al enviar email de recuperación');
        throw new Error('Error al enviar email de recuperación');
      }
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    user,
    profile,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    clearError,
    isAuthenticated: !!user
  };
};