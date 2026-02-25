import { useState } from 'react';
import { supabase } from '../lib/ts/supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ChevronRight, Scissors, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">

      {/* Botão Voltar ao Site — fixo no canto superior esquerdo */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255,255,255,0.12)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '10px',
          padding: '8px 14px',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.25s ease',
          zIndex: 10,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.22)';
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(-3px)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0)';
        }}
      >
        <ArrowLeft size={16} />
        Voltar ao site
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card"
      >
        <div className="text-center mb-8">
          <div style={{ background: 'var(--primary)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
            <Scissors color="white" />
          </div>
          <h2 className="font-bold">Painel Administrativo</h2>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Acesse sua conta para gerenciar o salão</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input 
                type="email" 
                placeholder="exemplo@nexus.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            disabled={loading}
            style={{ marginTop: '10px' }}
          >
            {loading ? 'Entrando...' : 'Entrar'} <ChevronRight size={18} />
          </button>
        </form>

        <div className="text-center mt-6">
          <p style={{ color: '#999', fontSize: '0.8rem' }}>
            Esqueceu sua senha? Entre em contato com o suporte.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
