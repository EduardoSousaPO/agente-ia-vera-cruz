import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import supabase, { isSupabaseConfigured } from './lib/supabase';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Login from './pages/Login';
import LeadsList from './pages/LeadsList';
import LeadDetail from './pages/LeadDetail';
import Metricas from './pages/Metricas';

function TelaConfigNecessaria() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Vera Cruz — CRM Leads</h1>
        <p className="muted">
          Para o app funcionar, crie um arquivo <code>.env</code> na raiz do projeto com:
        </p>
        <pre className="code-block code-block--env">
{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key`}
        </pre>
        <p className="muted auth-card__hint">
          Use os valores do projeto no dashboard do Supabase (Configurações → API). Depois reinicie o servidor (<code>npm run dev</code>).
        </p>
      </div>
    </div>
  );
}

function AcessoNegado() {
  const navigate = useNavigate();
  
  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card auth-card--center">
        <h1>Acesso Negado</h1>
        <p className="muted">
          Seu email não está cadastrado no sistema. Entre em contato com o administrador para solicitar acesso.
        </p>
        <button className="btn" onClick={handleLogout}>
          Voltar ao login
        </button>
      </div>
    </div>
  );
}

function Protegida({ children }: { children: React.ReactNode }) {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const { user, loading: profileLoading } = useAuth();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setSessionLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setHasSession(!!s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (sessionLoading || profileLoading) {
    return <div className="loading-wrap">Carregando…</div>;
  }

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <AcessoNegado />;
  }

  return <>{children}</>;
}

function ProtegidaGestor({ children }: { children: React.ReactNode }) {
  const { isGestor, loading } = useAuth();

  if (loading) {
    return <div className="loading-wrap">Carregando…</div>;
  }

  if (!isGestor) {
    return <Navigate to="/leads" replace />;
  }

  return <>{children}</>;
}

function LayoutPrivado() {
  const { user, isGestor, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>Vera Cruz CRM</h1>
          <p>Pipeline comercial Effa</p>
        </div>
        <nav className="nav-links">
          <NavLink
            to="/leads"
            className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
          >
            Leads
          </NavLink>
          {isGestor && (
            <NavLink
              to="/metricas"
              className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
            >
              Métricas
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role === 'gestor' ? 'Gestor' : 'Vendedor'}</span>
          </div>
          <button className="btn btn--logout" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protegida>
            <LayoutPrivado />
          </Protegida>
        }
      >
        <Route path="/leads" element={<LeadsList />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route
          path="/metricas"
          element={
            <ProtegidaGestor>
              <Metricas />
            </ProtegidaGestor>
          }
        />
      </Route>
      <Route path="/" element={<Navigate to="/leads" replace />} />
    </Routes>
  );
}

export default function App() {
  if (!isSupabaseConfigured()) {
    return <TelaConfigNecessaria />;
  }

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
