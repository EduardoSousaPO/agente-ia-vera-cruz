import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('[Login] Sessão existente encontrada, redirecionando...');
        navigate('/leads', { replace: true });
      }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setErro('');
    setLoading(true);
    console.log('[Login] Tentando login...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      console.log('[Login] Resposta do Supabase:', { data: !!data, error: !!error, hasSession: !!data?.session });

      if (error) {
        console.error('[Login] Erro:', error.message);
        setLoading(false);
        if (error.message === 'Invalid login credentials') {
          setErro('Email ou senha incorretos');
        } else {
          setErro(error.message);
        }
        return;
      }

      if (data?.session) {
        console.log('[Login] Login OK, navegando para /leads');
        navigate('/leads', { replace: true });
      } else {
        console.log('[Login] Login sem sessão');
        setLoading(false);
        setErro('Erro ao fazer login. Tente novamente.');
      }
    } catch (err) {
      console.error('[Login] Erro inesperado:', err);
      setLoading(false);
      setErro('Erro inesperado. Tente novamente.');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Vera Cruz CRM</h1>
        <p className="muted">Acesse com seu email e senha.</p>
        <form onSubmit={handleSubmit}>
          <input
            className="input form-field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input form-field"
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          {erro && <p className="text-error form-field form-field--error">{erro}</p>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
