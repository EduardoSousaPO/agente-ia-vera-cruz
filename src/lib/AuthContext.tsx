import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import supabase from './supabase';

type UserProfile = {
  email: string;
  role: 'gestor' | 'vendedor';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  async function loadUserProfile(email: string) {
    if (!supabase || !email) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('app_users')
        .select('email, role, name, seller_id')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (profile && !error) {
        setUser(profile as UserProfile);
      }
    } catch {
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
            loadUserProfile(session.user.email);
          } else {
            setIsAuthenticated(false);
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
        loadUserProfile(session.user.email);
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
    if (session?.user?.email) {
      await loadUserProfile(session.user.email);
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    isGestor: user?.role === 'gestor',
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
