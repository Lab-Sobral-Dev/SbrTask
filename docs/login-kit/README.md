# Login Kit — gestao-sbr (Laboratório Sobral)

Tela de login com split-screen (foto à esquerda + card de login à direita), paleta vermelho-laranja-navy, decoração geométrica, responsivo (colapsa em mobile).

**Pacote:** 2 arquivos de código + 3 assets (opcionais — você substitui pelos do seu sistema).

---

## Arquivos aqui

```
docs/login-kit/
├── LoginPage.tsx        (componente React autocontido)
├── login.css            (estilos isolados; sem dependência de Tailwind)
├── README.md            (este arquivo)
└── assets/              (exemplos — o seu sistema tem os próprios)
    ├── foto.png         → foto de fundo do painel esquerdo (recomendado ≥ 1200×900, proporção landscape)
    ├── logo1_transp.svg → logo institucional branco/transparente (112px de largura)
    └── logo115-background.svg → logo do card header (130×130, fundo neutro)
```

> **Nota:** os assets do `gestao-sbr` **não estão incluídos neste commit** — são da marca Laboratório Sobral. Substitua pelos da sua empresa. Caminhos estão parametrizados em `LoginPage.tsx`.

---

## Como usar em outro projeto React

1. **Copie** `LoginPage.tsx` e `login.css` para o `src/` do outro projeto
2. **Coloque seus assets** em `public/` do outro projeto (ou use URLs remotas)
3. **Import e use:**

```tsx
import { LoginPage, type LoginResult } from './LoginPage'
import { useNavigate } from 'react-router-dom'
import { setToken } from './auth'

export function LoginRoute() {
  const navigate = useNavigate()

  async function onLogin({ username, password }): Promise<LoginResult> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (res.status === 401) return { ok: false, error: 'Usuário ou senha inválidos.' }
    if (!res.ok) return { ok: false, error: 'Erro ao autenticar.' }
    const data = await res.json()
    return { ok: true, token: data.token }
  }

  return (
    <LoginPage
      onLogin={onLogin}
      onSuccess={(token) => { setToken(token); navigate('/', { replace: true }) }}
      texts={{
        brandTitle: 'Nome do Seu Sistema',
        brandSubtitle: 'Empresa do Grupo',
      }}
      assets={{
        backgroundPhoto: '/minha-foto.png',
        brandLogo: '/meu-logo.svg',
        cardHeaderLogo: '/meu-logo-card.svg',
      }}
    />
  )
}
```

---

## Customização de paleta

A paleta está em CSS variables no topo de `login.css`:

```css
:root {
  --login-accent-1: #e76327;      /* laranja principal */
  --login-accent-2: #c0392b;      /* vermelho vinho */
  --login-accent-bright: #ff6501; /* laranja vivo do cabeçalho do card */
  --login-bg-right: #0f172a;      /* navy do painel direito */
}
```

Edite essas 4 variáveis para reterritorializar a identidade visual. O `linear-gradient` do overlay (`.login-overlay`) usa cores hard-coded — se a marca for radicalmente diferente (ex: azul/verde), ajuste diretamente.

---

## Estrutura visual

```
┌─────────────────────────┬─────────────────────────┐
│  Painel Esquerdo        │  Painel Direito (navy)  │
│                         │                         │
│  Foto + overlay laranja │  ┌───────────────────┐  │
│                         │  │ Card header (lara)│  │
│  Decoração geométrica   │  │  [logo 115 anos]  │  │
│  (4 cantos + linhas)    │  ├───────────────────┤  │
│                         │  │ Card body (navy)  │  │
│    [Logo branco]        │  │                   │  │
│  "Sistema de Gestão"    │  │  Entre na conta   │  │
│  "Laboratório Sobral"   │  │                   │  │
│                         │  │  [ user  ]        │  │
│                         │  │  [ pass  ]        │  │
│                         │  │  [ ENTRAR ]       │  │
│                         │  │                   │  │
│                         │  │  "Em caso de..."  │  │
│                         │  └───────────────────┘  │
└─────────────────────────┴─────────────────────────┘
       (< 768px: colapsa pra 1 coluna — faixa superior de 200px + form abaixo)
```

---

## Dependências

- **React 18+** (hooks nativos — `useState`, sem libs externas)
- **Nada mais.** Sem Tailwind, sem lucide-react, sem react-hook-form.
- Google Fonts Ubuntu é carregado via `@import` no CSS — funciona offline se cachear; senão troque pela fonte do seu sistema.

---

## Prompt pronto para entregar a outro agente

> Copie o bloco abaixo (entre as linhas `---`) e cole pra outro agente/dev junto com os 2 arquivos (`LoginPage.tsx` + `login.css`).

---

**PROMPT PARA O OUTRO SISTEMA:**

Preciso que você crie a tela de login deste projeto reproduzindo **fielmente** o design do arquivo `LoginPage.tsx` + `login.css` que vou te passar. A tela é do sistema "gestao-sbr" do Laboratório Sobral e tem um estilo bem específico que queremos manter consistente entre os sistemas do grupo.

**Como integrar:**

1. Copie `LoginPage.tsx` e `login.css` para o `src/` do projeto. Se não for TypeScript, renomeie para `.jsx` e apague as anotações de tipo (trivial — `: Type` e `interface` só).

2. Coloque 3 assets na pasta `public/` (ou use CDN/S3). Dimensões recomendadas:
   - **Foto de fundo** (`/foto.png`): landscape, ≥ 1200×900, clima institucional (fábrica, laboratório, equipe). Vai receber overlay laranja/vermelho/navy.
   - **Logo branco** (`/logo1_transp.svg`): 112px de largura, deve funcionar sobre gradiente colorido (branco/transparente ideal).
   - **Logo do card header** (`/logo115-background.svg`): 130×130, fundo neutro (será colocado sobre laranja vivo `#ff6501`).

3. Na rota de login, importe `<LoginPage />` passando:
   - `onLogin({ username, password })` — função async que chama sua API de auth e retorna `{ ok: true, token }` ou `{ ok: false, error }`.
   - `onSuccess(token)` — callback após login (tipicamente salva token e navega).
   - `texts` — objeto opcional pra customizar labels em português.
   - `assets` — objeto opcional com os caminhos dos 3 arquivos acima.

4. Ajuste as 4 CSS variables no topo de `login.css` se a paleta da sua marca for diferente:
   ```css
   --login-accent-1:      /* laranja principal, cor do botão */
   --login-accent-2:      /* vermelho vinho, segundo stop do gradiente */
   --login-accent-bright: /* laranja vivo do cabeçalho do card */
   --login-bg-right:      /* cor de fundo do painel direito */
   ```

**Princípios de design que você deve preservar:**

- **Split screen** 50/50 no desktop (≥768px), coluna única no mobile
- **Painel esquerdo**: foto com **gradiente vermelho-laranja-navy em 145°** por cima (não é filtro — é um overlay específico). 4 cantos geométricos brancos semi-transparentes. SVG de linhas e círculos decorativos. Logo branco + título + subtítulo centralizados.
- **Painel direito**: fundo navy `#0f172a`. Card com borda-radius 24px, sombra profunda. Cabeçalho do card em **laranja vivo** com logo central (130×130). Corpo do card em **glassmorphism** (`rgba(255,255,255,0.055)` + `backdrop-filter: blur(40px)`).
- **Botão de submit**: gradiente `linear-gradient(135deg, laranja, vermelho)`, hover com `translateY(-2px)` e sombra mais intensa.
- **Fonte**: Ubuntu do Google Fonts. Se a marca de vocês for outra, troque no `@import` e no `font-family` do `.login-root`.
- **Animações de entrada**: `logoReveal` (scale 0.88→1) e `fadeSlideUp` (20px abaixo → 0). São sutis; mantenha.

**O que NÃO fazer:**

- Não use Tailwind pra estilizar — o CSS é puro e isolado de propósito (portabilidade)
- Não adicione libs extras (zod, react-hook-form, etc.) — o formulário é controlado com `useState` simples
- Não altere a estrutura de DOM do `LoginPage.tsx` — se precisar adicionar algo (ex: campo extra, link de "esqueci senha"), insira dentro do `<form className="login-form">` mantendo o padrão `.form-group` + `.form-label` + `.form-input`
- Não mude os valores de z-index da decoração — foram calibrados (deco=4-6, conteúdo=10)

**Quando terminar:**

- Rode o dev server e abra em desktop + mobile (DevTools) pra conferir o responsive
- Confirme que a animação de entrada dispara no primeiro mount
- Teste submit com credenciais erradas → a mensagem aparece em `.login-error`
- Teste submit com credenciais certas → `onSuccess(token)` dispara

Me avise se algum asset não cabe no layout (tipo logo muito largo ou foto com proporção errada) pra gente ajustar.

---

**Fim do prompt.** Entregue ao outro agente junto com os 2 arquivos.

---

## Alterações intencionais em relação ao original do gestao-sbr

Para deixar o kit **autossuficiente e portável**, esta versão difere ligeiramente do original:

| Aspecto | Original gestao-sbr | Kit portável |
|---|---|---|
| Auth | `useAuth()` + `fetch('/api/auth/login')` hardcoded | Prop `onLogin` (você implementa) |
| Navegação | `useNavigate()` de react-router hardcoded | Prop `onSuccess` (você chama) |
| Sessão expirada | Ler `sessionExpired` do AuthContext | Prop `initialMessage` |
| Textos | Fixos em pt-BR | Prop `texts` com defaults pt-BR |
| Assets | Caminhos fixos | Prop `assets` com defaults |

Isto torna o componente reutilizável em qualquer stack React (react-router, tanstack-router, next, sem router, etc).
