import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Crown, Shield, Sword, User, Zap } from 'lucide-react';
import CharacterEditor from '../components/character/CharacterEditor';
import type { AvatarData } from '../types';
import { useAuthStore } from '../hooks/useAuthStore';
import { auth } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../components/character/avatar-options';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  sector: z.string().min(1, 'Setor obrigatorio'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [step, setStep] = useState<'form' | 'character'>('form');
  const [avatar, setAvatar] = useState<AvatarData | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onCharacterComplete = async (finalAvatar: AvatarData) => {
    try {
      const formData = JSON.parse(sessionStorage.getItem('registerData') || '{}');
      const response = await auth.register({
        ...formData,
        avatar: finalAvatar,
      });

      setAuth(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar conta');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const saveFormData = (data: RegisterForm) => {
    sessionStorage.setItem('registerData', JSON.stringify(data));
    setAvatar(DEFAULT_AVATAR);
    setStep('character');
  };

  if (step === 'character' && avatar) {
    return (
      <div className="tf-screen flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div className="mb-8 text-center">
            <p className="tf-title text-sm uppercase tracking-[0.18em] text-[color:var(--tf-primary)]">Forge seu heroi</p>
            <h1 className="tf-title mt-3 text-4xl text-[color:var(--tf-text-main)]">Criacao de personagem</h1>
            <p className="mt-3 text-[color:var(--tf-text-muted)]">Vamos dar ao seu perfil uma identidade digna de campanha.</p>
          </div>
          <CharacterEditor initialData={avatar} onComplete={onCharacterComplete} />
          {error && (
            <div className="mt-4 rounded-[4px] border-2 border-[color:var(--tf-danger)] bg-[rgba(216,91,83,0.12)] px-4 py-3 text-center text-sm text-[color:var(--tf-danger)]">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tf-screen flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_0.95fr]">
        <section className="tf-panel hidden p-8 lg:block">
          <div className="tf-frame mb-6 inline-flex h-16 w-16 items-center justify-center">
            <Crown className="h-8 w-8 text-[color:var(--tf-primary)]" />
          </div>
          <p className="tf-title text-sm uppercase tracking-[0.18em] text-[color:var(--tf-primary)]">Nova campanha</p>
          <h1 className="tf-title mt-3 text-5xl leading-tight text-[color:var(--tf-text-main)]">
            Monte seu perfil e entre na guilda.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[color:var(--tf-text-muted)]">
            Cada conta nasce com avatar, setor e identidade propria para transformar trabalho em jornada.
          </p>

          <div className="mt-8 space-y-4">
            <div className="tf-panel-inset flex items-start gap-3 p-4">
              <Sword className="mt-0.5 h-5 w-5 text-[color:var(--tf-primary)]" />
              <div>
                <p className="font-semibold text-[color:var(--tf-text-main)]">Escolha seu setor</p>
                <p className="mt-1 text-sm text-[color:var(--tf-text-muted)]">Organize a progressao da sua equipe com contexto desde o inicio.</p>
              </div>
            </div>
            <div className="tf-panel-inset flex items-start gap-3 p-4">
              <Shield className="mt-0.5 h-5 w-5 text-[color:var(--tf-info)]" />
              <div>
                <p className="font-semibold text-[color:var(--tf-text-main)]">Prepare o avatar</p>
                <p className="mt-1 text-sm text-[color:var(--tf-text-muted)]">Na proxima etapa voce monta o visual do personagem com o tema retro do sistema.</p>
              </div>
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
            <h2 className="tf-title text-4xl text-[color:var(--tf-text-main)]">Criar conta</h2>
            <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[color:var(--tf-text-dim)]">
              SbrTask / registro
            </p>
          </div>

          <form onSubmit={handleSubmit(saveFormData)} className="space-y-5">
            {error && (
              <div className="rounded-[4px] border-2 border-[color:var(--tf-danger)] bg-[rgba(216,91,83,0.12)] px-4 py-3 text-sm text-[color:var(--tf-danger)]">
                {error}
              </div>
            )}

            <div>
              <label className="tf-label">Nome</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--tf-text-dim)]" />
                <input {...register('name')} type="text" placeholder="Seu nome" className="tf-input pl-11" />
              </div>
              {errors.name && <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.name.message}</p>}
            </div>

            <div>
              <label className="tf-label">Email</label>
              <div className="relative">
                <Zap className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--tf-text-dim)]" />
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
                <Shield className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--tf-text-dim)]" />
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

            <div>
              <label className="tf-label">Setor</label>
              <div className="relative">
                <Sword className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--tf-text-dim)]" />
                <select {...register('sector')} className="tf-input appearance-none pl-11">
                  <option value="">Selecione seu setor</option>
                  <option value="TI">TI</option>
                  <option value="RH">RH</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Operacoes">Operacoes</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              {errors.sector && (
                <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.sector.message}</p>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="tf-btn tf-btn-primary w-full disabled:opacity-50">
              Continuar para o avatar
            </button>

            <p className="text-center text-sm text-[color:var(--tf-text-muted)]">
              Ja tem conta?{' '}
              <Link to="/login" className="font-semibold text-[color:var(--tf-primary)] hover:text-[color:var(--tf-primary-hover)]">
                Entrar
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Register;
