/**
 * LoginPage — componente React autocontido, extraído do gestao-sbr.
 *
 * Customize 3 pontos para adaptar ao seu sistema:
 *   1. handleSubmit — troque a URL/body pela sua API de autenticação
 *   2. onSuccess    — navegação pós-login (react-router navigate, window.location, etc.)
 *   3. Assets       — substitua os caminhos de /foto.png, /logo1_transp.svg, /logo115-background.svg
 *                     pelos logos/foto do SEU sistema (mesmas proporções recomendadas).
 *
 * Dependências:
 *   - React 18+
 *   - login.css no mesmo diretório (ou importado globalmente)
 *
 * Sem dependência de useAuth, useNavigate, Tailwind, lucide-react — props simples.
 */

import { useState, type FormEvent } from 'react'
import './login.css'

export type LoginResult =
  | { ok: true; token: string; payload?: unknown }
  | { ok: false; error: string }

export interface LoginPageProps {
  /** Função que recebe as credenciais e devolve resultado do login. Você implementa. */
  onLogin: (credentials: { username: string; password: string }) => Promise<LoginResult>
  /** Callback disparado em login bem-sucedido — use para navegar (react-router, etc.). */
  onSuccess: (token: string) => void
  /** Textos customizáveis — se omitidos, usa defaults em pt-BR. */
  texts?: {
    brandTitle?: string       // "Sistema de Gestão"
    brandSubtitle?: string    // "Laboratório Sobral"
    cardTitle?: string        // "Entre na sua conta"
    cardSubtitle?: string     // "Área restrita · Colaboradores autorizados"
    usernameLabel?: string    // "Usuário de rede"
    passwordLabel?: string    // "Senha"
    submitIdle?: string       // "Entrar"
    submitLoading?: string    // "Autenticando…"
    footerHelp?: string       // "Em caso de problemas com a senha, contate o TI"
    errorInvalid?: string     // "Usuário ou senha inválidos."
    errorGeneric?: string     // "Erro ao autenticar. Tente novamente."
    errorNetwork?: string     // "Falha de conexão. Verifique a rede e tente novamente."
  }
  /** Caminhos dos assets. Substitua pelos logos/foto do seu sistema. */
  assets?: {
    backgroundPhoto?: string   // '/foto.png'
    brandLogo?: string         // '/logo1_transp.svg'
    cardHeaderLogo?: string    // '/logo115-background.svg'
  }
  /** Mensagem pré-preenchida (ex: vinda de expiração de sessão). */
  initialMessage?: string | null
}

const DEFAULTS = {
  brandTitle: 'Sistema de Gestão',
  brandSubtitle: 'Laboratório Sobral',
  cardTitle: 'Entre na sua conta',
  cardSubtitle: 'Área restrita · Colaboradores autorizados',
  usernameLabel: 'Usuário de rede',
  passwordLabel: 'Senha',
  submitIdle: 'Entrar',
  submitLoading: 'Autenticando…',
  footerHelp: 'Em caso de problemas com a senha, contate o TI',
  errorInvalid: 'Usuário ou senha inválidos.',
  errorGeneric: 'Erro ao autenticar. Tente novamente.',
  errorNetwork: 'Falha de conexão. Verifique a rede e tente novamente.',
}

const ASSETS_DEFAULT = {
  backgroundPhoto: '/foto.png',
  brandLogo: '/logo1_transp.svg',
  cardHeaderLogo: '/logo115-background.svg',
}

export function LoginPage(props: LoginPageProps) {
  const t = { ...DEFAULTS, ...(props.texts ?? {}) }
  const a = { ...ASSETS_DEFAULT, ...(props.assets ?? {}) }
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(props.initialMessage ?? null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await props.onLogin({ username, password })
      if (result.ok) {
        props.onSuccess(result.token)
      } else {
        setError(result.error || t.errorGeneric)
      }
    } catch {
      setError(t.errorNetwork)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      {/* ── Painel esquerdo — foto + decoração ─────────────────── */}
      <div className="login-left">
        <img src={a.backgroundPhoto} alt="" className="login-left-bg" />
        <div className="login-overlay" />

        <div className="login-left-deco" />
        <div className="login-deco-circle" />
        <div className="login-deco-corner-tr" />
        <div className="login-deco-corner-bl" />

        <svg
          className="login-deco-lines"
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

        <div className="login-left-content">
          <img src={a.brandLogo} alt={t.brandSubtitle} className="login-left-logo" />
          <h1>{t.brandTitle}</h1>
          <p className="brand-sub">{t.brandSubtitle}</p>
        </div>
      </div>

      {/* ── Painel direito — formulário ─────────────────────────── */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <img src={a.cardHeaderLogo} alt="" className="login-card-header-logo" />
          </div>

          <div className="login-card-body">
            <h2>{t.cardTitle}</h2>
            <p className="subtitle">{t.cardSubtitle}</p>

            <div className="card-divider" />

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="username" className="form-label">{t.usernameLabel}</label>
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">{t.passwordLabel}</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>

              {error && <p className="login-error">{error}</p>}

              <button
                type="submit"
                className="btn-submit"
                disabled={loading || !username || !password}
              >
                {loading ? t.submitLoading : t.submitIdle}
              </button>
            </form>

            <p className="card-footer">{t.footerHelp}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
