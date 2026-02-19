import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import supabase from './lib/supabase';
import Login from './pages/Login';
import LeadsList from './pages/LeadsList';
import LeadDetail from './pages/LeadDetail';
import Metricas from './pages/Metricas';

function Protegida({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(!!s);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(!!s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/leads"
        element={
          <Protegida>
            <LeadsList />
          </Protegida>
        }
      />
      <Route
        path="/leads/:id"
        element={
          <Protegida>
            <LeadDetail />
          </Protegida>
        }
      />
      <Route
        path="/metricas"
        element={
          <Protegida>
            <Metricas />
          </Protegida>
        }
      />
      <Route path="/" element={<Navigate to="/leads" replace />} />
    </Routes>
  );
}
