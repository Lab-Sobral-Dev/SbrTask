import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';
import { auth } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError(null);
    setLoading(true);
    try {
      const response = await auth.login(username, password);
      setAuth(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) setError('Usuário ou senha inválidos.');
      else if (status === 403) setError('Acesso restrito. Contate o TI.');
      else setError('Erro ao autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-ubuntu">

      {/* ── Painel esquerdo — foto + decoração ── */}
      <div className="relative hidden md:block w-1/2 overflow-hidden">
        <img
          src="/foto.svg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Overlay gradiente */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(145deg, rgba(192,57,43,0.82) 0%, rgba(231,99,39,0.68) 35%, rgba(120,30,20,0.75) 70%, rgba(15,23,42,0.88) 100%)',
          }}
        />

        {/* SVG decorativo */}
        <svg
          className="absolute inset-0 w-full h-full z-[4] pointer-events-none"
          viewBox="0 0 500 700"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <line x1="0"  y1="200" x2="200" y2="0"   stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <line x1="0"  y1="350" x2="350" y2="0"   stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="50" y1="700" x2="500" y2="250" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <line x1="0"  y1="500" x2="500" y2="0"   stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <circle cx="420" cy="80"  r="60"  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle cx="420" cy="80"  r="90"  fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <circle cx="80"  cy="620" r="80"  fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <circle cx="80"  cy="620" r="120" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        </svg>

        {/* Canto sup-direito */}
        <div className="absolute top-8 right-8 w-20 h-20 border-t-2 border-r-2 border-white/35 rounded-tr-[4px] z-[6] pointer-events-none" />
        {/* Canto inf-esquerdo */}
        <div className="absolute bottom-8 left-8 w-20 h-20 border-b-2 border-l-2 border-white/35 rounded-bl-[4px] z-[6] pointer-events-none" />
        {/* Círculo decorativo */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full border border-white/10 bg-[rgba(231,99,39,0.08)] z-[4] pointer-events-none" />

        {/* Conteúdo da marca */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4 p-8 text-center text-white">
          <img
            src="/logo1_transp.svg"
            alt="Laboratório Sobral"
            className="w-28 h-auto mb-1 drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] animate-logo-reveal"
          />
          <h1 className="text-3xl font-bold tracking-tight leading-tight">SbrTask</h1>
          <p className="text-base font-light opacity-65">Laboratório Sobral</p>
        </div>
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="flex flex-1 items-center justify-center bg-[#0f172a] p-8">
        <div className="w-full max-w-[420px] overflow-hidden rounded-3xl border border-[rgba(231,99,39,0.2)] shadow-[0_24px_64px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)] animate-fade-slide-up">

          {/* Cabeçalho com logo */}
          <div className="flex items-center justify-center bg-[#ff6501] py-6 px-8">
            <img
              src="/logo115-background.svg"
              alt=""
              className="w-[130px] h-[130px] object-contain block animate-logo-reveal"
            />
          </div>

          {/* Corpo do card */}
          <div className="flex flex-col items-center gap-4 bg-white/[0.055] px-10 pb-10 pt-8 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white tracking-tight text-center m-0">
              Entre na sua conta
            </h2>
            <p className="text-xs text-white/45 text-center m-0">
              Área restrita · Colaboradores autorizados
            </p>

            <div className="w-full h-px bg-white/[0.08] my-1" />

            <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-[13px] font-medium text-white/65">
                  Usuário de rede
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                  disabled={loading}
                  className="w-full rounded-[10px] border border-white/[0.12] bg-white/[0.07] px-4 py-3 font-ubuntu text-[15px] text-white outline-none placeholder:text-white/25 transition-[border-color,background] duration-200 focus:border-[rgba(231,99,39,0.7)] focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[13px] font-medium text-white/65">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full rounded-[10px] border border-white/[0.12] bg-white/[0.07] px-4 py-3 font-ubuntu text-[15px] text-white outline-none placeholder:text-white/25 transition-[border-color,background] duration-200 focus:border-[rgba(231,99,39,0.7)] focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {error && (
                <p className="m-0 rounded-lg border border-red-500/25 bg-red-500/[0.12] px-3 py-2 text-center text-[13px] text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full rounded-xl bg-gradient-to-br from-[#e76327] to-[#c0392b] px-6 py-3.5 font-ubuntu text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(231,99,39,0.3)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_4px_16px_rgba(231,99,39,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Autenticando…' : 'Entrar'}
              </button>
            </form>

            <p className="m-0 text-center text-[11px] text-white/30">
              Em caso de problemas com a senha, contate o TI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
