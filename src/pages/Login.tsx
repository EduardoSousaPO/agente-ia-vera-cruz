import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/leads', { replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/leads' },
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div style={{ maxWidth: 400, margin: '48px auto', padding: 24, textAlign: 'center' }}>
        <h1>Verifique seu e-mail</h1>
        <p>Enviamos um link de acesso para <strong>{email}</strong>. Clique no link para entrar.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '48px auto', padding: 24 }}>
      <h1>Entrar</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Magic Link — informe seu e-mail.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 12, marginBottom: 16, boxSizing: 'border-box' }}
        />
        {erro && <p style={{ color: 'crimson', marginBottom: 16 }}>{erro}</p>}
        <button type="submit" style={{ padding: '12px 24px' }}>
          Enviar link
        </button>
      </form>
    </div>
  );
}
