import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import supabase from './supabase';

type UserProfile = {
  email: string;
  role: 'gestor' | 'vendedor' | 'admin' | 'manager';
  name: string;
  seller_id: string | null;
};

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  isGestor: boolean;
  isVendedor: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function isGestorRole(role: UserProfile['role'] | undefined): boolean {
  return role === 'gestor' || role === 'admin' || role === 'manager';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  async function loadUserProfile(accessToken: string) {
    if (!supabase || !accessToken) return;

    try {
      const response = await fetch('/api/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const profile = await response.json();
      setUser(profile as UserProfile);
    } catch {
      setUser(null);
      console.error('[AuthContext] Erro ao carregar perfil');
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        
        if (isMounted) {
          if (session?.user?.email) {
            setIsAuthenticated(true);
            if (session.access_token) {
              await loadUserProfile(session.access_token);
            }
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      if (event === 'SIGNED_IN' && session?.user?.email) {
        setIsAuthenticated(true);
        if (session.access_token) {
          await loadUserProfile(session.access_token);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    }
  }

  async function refreshProfile() {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await loadUserProfile(session.access_token);
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    isGestor: isGestorRole(user?.role),
    isVendedor: user?.role === 'vendedor',
    isAuthenticated,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
