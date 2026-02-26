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
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function loadUser() {
      const { data: { session } } = await supabase!.auth.getSession();
      
      if (session?.user?.email) {
        const { data: profile } = await supabase!
          .from('app_users')
          .select('email, role, name, seller_id')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        if (profile) {
          setUser(profile as UserProfile);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        const { data: profile } = await supabase!
          .from('app_users')
          .select('email, role, name, seller_id')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        if (profile) {
          setUser(profile as UserProfile);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    isGestor: user?.role === 'gestor',
    isVendedor: user?.role === 'vendedor',
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
