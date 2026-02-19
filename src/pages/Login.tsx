import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/leads', { replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
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
      <div className="auth-wrap">
        <div className="auth-card auth-card--center">
          <h1>Verifique seu e-mail</h1>
          <p>Enviamos um link de acesso para <strong>{email}</strong>. Clique no link para entrar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Entrar</h1>
        <p className="muted">Magic Link — informe seu e-mail.</p>
        <form onSubmit={handleSubmit}>
          <input
            className="input form-field"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {erro && <p className="text-error form-field form-field--error">{erro}</p>}
          <button className="btn" type="submit">
            Enviar link
          </button>
        </form>
      </div>
    </div>
  );
}
