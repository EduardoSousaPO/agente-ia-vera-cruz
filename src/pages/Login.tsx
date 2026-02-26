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
      if (session) navigate('/leads', { replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setErro('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setLoading(false);
        if (error.message === 'Invalid login credentials') {
          setErro('Email ou senha incorretos');
        } else {
          setErro(error.message);
        }
        return;
      }

      if (data.session) {
        navigate('/leads', { replace: true });
      } else {
        setLoading(false);
        setErro('Erro ao fazer login. Tente novamente.');
      }
    } catch (err) {
      setLoading(false);
      setErro('Erro inesperado. Tente novamente.');
      console.error('Login error:', err);
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
