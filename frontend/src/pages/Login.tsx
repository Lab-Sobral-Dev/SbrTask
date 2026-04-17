import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, Crown, Lock, LogIn, Mail } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { auth } from '../services/api';

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Senha obrigatoria'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await auth.login(data.email, data.password);
      setAuth(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bx-screen">
      <div className="bx-shell">

        {/* ===== Login (primeiro) ===== */}
        <section className="lg-panel" aria-labelledby="lg-title">
          <div className="lg-emblem-wrap">
            <div className="lg-emblem" aria-hidden="true">
              <Crown size={24} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="lg-title" id="lg-title">Acessar terminal</h1>
          <p className="lg-meta">SbrTask / login</p>

          <form className="lg-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {error && <div className="lg-error-banner" role="alert">{error}</div>}

            <div>
              <label className="lg-label" htmlFor="email">E-mail</label>
              <div className="lg-input-wrap">
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="lg-input"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                <span className="lg-input-icon" aria-hidden="true">
                  <Mail size={16} />
                </span>
              </div>
              {errors.email && <p id="email-error" className="lg-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="lg-label" htmlFor="senha">Senha</label>
              <div className="lg-input-wrap">
                <input
                  {...register('password')}
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="lg-input"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'senha-error' : undefined}
                />
                <span className="lg-input-icon" aria-hidden="true">
                  <Lock size={16} />
                </span>
              </div>
              {errors.password && <p id="senha-error" className="lg-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="lg-btn">
              <LogIn size={16} />
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="lg-bottom">
            Nao tem conta?{' '}
            <Link to="/register">Criar conta</Link>
          </p>
        </section>

        {/* ===== Guild Console (collapsible) ===== */}
        <details className="gc-details">
          <summary className="gc-summary">
            <span className="gc-summary-icon" aria-hidden="true">
              <Crown size={16} />
            </span>
            <span className="gc-summary-text">Guild Console</span>
            <span className="gc-summary-hint">Sobre o sistema</span>
            <span className="gc-chevron" aria-hidden="true">
              <ChevronDown size={16} strokeWidth={3} />
            </span>
          </summary>

          <div className="gc-content">
            <h2 className="gc-headline">Entre no painel do seu reino de tarefas.</h2>
            <p className="gc-tagline">
              Progresso, ranking, conquistas e missoes diarias reunidos em uma interface inspirada em RPG tatico.
            </p>
            <div className="gc-cards">
              <div className="gc-card gc-card-painel">
                <h3 className="gc-card-title">Painel</h3>
                <p className="gc-card-text">Monitore XP, nivel e metas com cara de HUD retro.</p>
              </div>
              <div className="gc-card gc-card-missoes">
                <h3 className="gc-card-title">Missoes</h3>
                <p className="gc-card-text">Transforme tarefas em objetivos claros e recompensadores.</p>
              </div>
              <div className="gc-card gc-card-conquistas">
                <h3 className="gc-card-title">Conquistas</h3>
                <p className="gc-card-text">Colecione marcos e acompanhe sua evolucao dentro do sistema.</p>
              </div>
            </div>
          </div>
        </details>

      </div>
    </div>
  );
};

export default Login;
