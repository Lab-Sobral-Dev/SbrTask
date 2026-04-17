import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Crown, Lock, LogIn, User } from 'lucide-react';
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
    <div className="tf-screen flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="tf-panel hidden p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="tf-frame mb-6 inline-flex h-16 w-16 items-center justify-center">
              <Crown className="h-8 w-8 text-[color:var(--tf-primary)]" />
            </div>
            <p className="tf-title text-sm uppercase tracking-[0.18em] text-[color:var(--tf-primary)]">
              Guild Console
            </p>
            <h1 className="tf-title mt-3 text-5xl leading-tight text-[color:var(--tf-text-main)]">
              Entre no painel do seu reino de tarefas.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[color:var(--tf-text-muted)]">
              Progresso, ranking, conquistas e missões diarias reunidos em uma interface inspirada em RPG tatico.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="tf-panel-inset p-4">
              <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-info)]">Painel</p>
              <p className="mt-2 text-sm text-[color:var(--tf-text-muted)]">Monitore XP, nivel e metas com cara de HUD retro.</p>
            </div>
            <div className="tf-panel-inset p-4">
              <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-success)]">Missoes</p>
              <p className="mt-2 text-sm text-[color:var(--tf-text-muted)]">Transforme tarefas em objetivos claros e recompensadores.</p>
            </div>
            <div className="tf-panel-inset p-4">
              <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-warning)]">Conquistas</p>
              <p className="mt-2 text-sm text-[color:var(--tf-text-muted)]">Colecione marcos e acompanhe sua evolucao dentro do sistema.</p>
            </div>
          </div>
        </section>

        <section className="tf-panel p-6 sm:p-8">
          <div className="mb-8 text-center lg:text-left">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center lg:mx-0">
              <div className="tf-frame flex h-16 w-16 items-center justify-center">
                <Crown className="h-8 w-8 text-[color:var(--tf-primary)]" />
              </div>
            </div>
            <h2 className="tf-title text-4xl text-[color:var(--tf-text-main)]">Acessar terminal</h2>
            <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[color:var(--tf-text-dim)]">
              SbrTask / login
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-[4px] border-2 border-[color:var(--tf-danger)] bg-[rgba(216,91,83,0.12)] px-4 py-3 text-sm text-[color:var(--tf-danger)]">
                {error}
              </div>
            )}

            <div>
              <label className="tf-label">Email</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--tf-text-dim)]" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  className="tf-input pl-11"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.email.message}</p>}
            </div>

            <div>
              <label className="tf-label">Senha</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--tf-text-dim)]" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="tf-input pl-11"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="tf-btn tf-btn-primary w-full disabled:opacity-50">
              <LogIn className="h-5 w-5" />
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>

            <p className="text-center text-sm text-[color:var(--tf-text-muted)]">
              Nao tem conta?{' '}
              <Link to="/register" className="font-semibold text-[color:var(--tf-primary)] hover:text-[color:var(--tf-primary-hover)]">
                Criar conta
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
