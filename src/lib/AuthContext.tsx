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
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!supabase) {
      console.log('[AuthContext] Supabase não configurado');
      setLoading(false);
      return;
    }

    let isMounted = true;
    let loadingTimeout: ReturnType<typeof setTimeout>;

    async function loadUserProfile(email: string | undefined) {
      console.log('[AuthContext] loadUserProfile chamado para:', email);
      if (!email) {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        console.log('[AuthContext] Consultando app_users...');
        const { data: profile, error } = await supabase!
          .from('app_users')
          .select('email, role, name, seller_id')
          .eq('email', email)
          .eq('is_active', true)
          .maybeSingle();

        console.log('[AuthContext] Resposta app_users:', { profile, error });

        if (isMounted) {
          if (profile && !error) {
            setUser(profile as UserProfile);
          } else {
            setUser(null);
          }
          setIsAuthenticated(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('[AuthContext] Erro ao carregar perfil:', err);
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(true);
          setLoading(false);
        }
      }
    }

    async function initAuth() {
      console.log('[AuthContext] initAuth iniciando...');
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        console.log('[AuthContext] getSession resultado:', { hasSession: !!session, email: session?.user?.email });
        
        if (session?.user?.email) {
          await loadUserProfile(session.user.email);
        } else {
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Erro ao inicializar auth:', err);
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    }

    loadingTimeout = setTimeout(() => {
      console.log('[AuthContext] Timeout de segurança atingido');
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 5000);

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] onAuthStateChange:', event);
      if (!isMounted) return;
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' && session?.user?.email) {
        setLoading(true);
        await loadUserProfile(session.user.email);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
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

  const value: AuthContextType = {
    user,
    loading,
    isGestor: user?.role === 'gestor',
    isVendedor: user?.role === 'vendedor',
    isAuthenticated,
    signOut,
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
