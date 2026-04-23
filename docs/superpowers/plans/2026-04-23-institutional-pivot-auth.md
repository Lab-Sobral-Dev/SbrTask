# Institutional Pivot — Auth Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace email/bcrypt auth with AD LDAP, restructure the Prisma schema, and deliver the institutional login page (login-kit ported to Tailwind) — establishing a working auth end-to-end on `feat/institutional-pivot`.

**Architecture:** Backend gains a standalone LDAP service module (ported from `apps/gestao-sbr` in sbr-monorepo) that validates credentials via LDAP bind and auto-provisions users on first login. The Prisma User model is restructured around `adUsername` as the identity anchor, with `UserGameProfile` as an optional 1:1 table for TI gamification. The frontend login page is completely rebuilt from the `docs/login-kit/` design, ported entirely to Tailwind classes (no pure CSS file). The Register page and all gamification references in the auth/layout layer are removed.

**Tech Stack:** Node.js + Express 5 + Prisma 6 + `ldapts` + `jsonwebtoken` | React 19 + Vite 8 + Tailwind 3.4 + React Hook Form + Zod 4 + Vitest + @testing-library/react

**Scope note:** This plan covers auth + login UI only. The Kanban board and full application UI rebuild are Plan 2.

---

## File Map

### Backend — Created
- `backend/src/services/ldap.ts` — LDAP bind + user search (pure module, no Fastify)

### Backend — Modified
- `backend/src/config/index.ts` — add LDAP env vars
- `backend/.env.example` — document new vars
- `backend/prisma/schema.prisma` — User restructure + UserGameProfile table
- `backend/src/controllers/authController.ts` — full rewrite: remove register/bcrypt, add LDAP flow
- `backend/src/routes/auth.ts` — remove /register + /xp, update login schema
- `backend/src/middlewares/auth.ts` — update JWT payload shape (`sub` instead of `userId`)

### Frontend — Created
- `frontend/public/foto.svg` — copy from docs/login-kit/assets/
- `frontend/public/logo1_transp.svg` — copy from docs/login-kit/assets/
- `frontend/public/logo115-background.svg` — copy from docs/login-kit/assets/
- `frontend/src/pages/Login.test.tsx` — Vitest tests for new Login page

### Frontend — Modified
- `frontend/tailwind.config.js` — add Ubuntu font + logo-reveal/fade-slide-up keyframes
- `frontend/index.html` — add Ubuntu Google Font preconnect + link
- `frontend/src/types/index.ts` — replace User interface (drop sector/level/xp/avatar, add adUsername/department)
- `frontend/src/hooks/useAuthStore.ts` — remove updateAvatar, align to new User type
- `frontend/src/services/api.ts` — update auth.login() signature, remove register/getXPProgress
- `frontend/src/pages/Login.tsx` — full rewrite: institutional split-screen, Tailwind, RHF, username field
- `frontend/src/components/layout/Layout.tsx` — remove Avatar component + XP/level panel, show department + initials
- `frontend/src/App.tsx` — remove /register route

### Frontend — Deleted
- `frontend/src/pages/Register.tsx` — AD auto-provisions; manual register no longer exists

---

## Task 1: Branch from master

**Files:** none

- [ ] **Step 1: Verify you are on master and it is clean**

```bash
git status
git checkout master
git pull origin master
```

Expected: `On branch master, nothing to commit`

- [ ] **Step 2: Create feature branch**

```bash
git checkout -b feat/institutional-pivot
```

Expected: `Switched to a new branch 'feat/institutional-pivot'`

---

## Task 2: Install ldapts

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install ldapts in backend**

```bash
cd backend && npm install ldapts
```

Expected: `added N packages` with no errors.

- [ ] **Step 2: Verify install**

```bash
node -e "require('ldapts'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore(backend): install ldapts for AD/LDAP auth"
```

---

## Task 3: Update env config

**Files:**
- Modify: `backend/src/config/index.ts`
- Modify: `backend/.env.example` (create if absent)

- [ ] **Step 1: Replace `backend/src/config/index.ts`**

```typescript
import 'dotenv/config';

export default {
  port:            process.env.PORT || 3001,
  jwtSecret:       process.env.JWT_SECRET || 'sbrtask-secret-key',
  databaseUrl:     process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sbrtask',
  corsOrigin:      process.env.CORS_ORIGIN || 'http://localhost:5173',
  ldapUrl:         process.env.LDAP_URL || 'ldap://dc.labsobralnet.ind:389',
  ldapDomain:      process.env.LDAP_DOMAIN || 'labsobralnet.ind',
  ldapBaseDn:      process.env.LDAP_BASE_DN || 'DC=labsobralnet,DC=ind',
  ldapServiceDn:   process.env.LDAP_SERVICE_DN || '',
  ldapServicePass: process.env.LDAP_SERVICE_PASS || '',
  companyIps:      (process.env.COMPANY_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean),
};
```

- [ ] **Step 2: Create/update `backend/.env.example`**

```env
PORT=3001
JWT_SECRET=change-me-in-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sbrtask
CORS_ORIGIN=http://localhost:5173

# AD/LDAP — Laboratório Sobral
LDAP_URL=ldap://dc.labsobralnet.ind:389
LDAP_DOMAIN=labsobralnet.ind
LDAP_BASE_DN=DC=labsobralnet,DC=ind
LDAP_SERVICE_DN=CN=ServiceAccount,OU=Usuarios,DC=labsobralnet,DC=ind
LDAP_SERVICE_PASS=

# IPs da rede interna (vírgula separados). Vazio = sem restrição de acesso remoto.
COMPANY_IPS=
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/config/index.ts backend/.env.example
git commit -m "feat(backend): add LDAP env config vars"
```

---

## Task 4: Prisma schema migration

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Replace the User model and add UserGameProfile**

Replace the entire content of `backend/prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(uuid())
  adUsername        String    @unique
  email             String?
  name              String
  department        String?
  role              String    @default("dept_user")
  active            Boolean   @default(true)
  allowRemoteAccess Boolean   @default(false)
  lastLoginAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  tasks        Task[]
  achievements UserAchievement[]
  gameProfile  UserGameProfile?
}

model UserGameProfile {
  id     String @id @default(uuid())
  userId String @unique
  level  Int    @default(1)
  xp     Int    @default(0)
  avatar Json?  @default("{\"skinTone\":\"#F5D0B5\",\"hairStyle\":\"hair-1\",\"hairColor\":\"#4A3728\",\"eyes\":{\"color\":\"#4B7B4B\",\"shape\":\"round\"},\"outfit\":\"outfit-1\",\"accessories\":[]}")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Task {
  id          String    @id @default(uuid())
  title       String
  description String?
  priority    String    @default("medium")
  status      String    @default("pending")
  dueDate     DateTime?
  category    String?
  xpReward    Int       @default(10)
  completedAt DateTime?
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Achievement {
  id          String   @id @default(uuid())
  name        String
  description String
  icon        String
  requirement Int
  type        String
  xpReward    Int      @default(0)
  users       UserAchievement[]
}

model UserAchievement {
  id            String      @id @default(uuid())
  userId        String
  achievementId String
  achievedAt    DateTime    @default(now())
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
}
```

- [ ] **Step 2: Run migration**

```bash
cd backend && npx prisma migrate dev --name institutional_auth
```

Expected: Migration created and applied. `npx prisma generate` runs automatically.

- [ ] **Step 3: Verify**

```bash
npx prisma studio
```

Open browser, confirm `User` table has `adUsername`, no `password`/`sector`/`level`/`xp`/`avatar`. Close Prisma Studio.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(backend): restructure User schema for AD auth + add UserGameProfile"
```

---

## Task 5: Create LDAP service

**Files:**
- Create: `backend/src/services/ldap.ts`

- [ ] **Step 1: Create `backend/src/services/ldap.ts`**

```typescript
import { Client } from 'ldapts';
import config from '../config';

export interface LdapUser {
  sAMAccountName: string;
  mail:           string;
  displayName:    string;
  departmentSlug: string | null;
}

const OU_SLUG_MAP: Record<string, string> = {
  'TI':                       'ti',
  'Administradores':          'ti',
  'FINANCEIRO':               'financeiro',
  'CONTABILIDADE':            'contabilidade',
  'CONTROLADORIA':            'controladoria',
  'RECURSOS HUMANOS':         'rh',
  'LOGISTICA':                'logistica',
  'VENDAS':                   'vendas',
  'MARKETING':                'marketing',
  'INDUSTRIAL':               'industrial',
  'PCP':                      'pcp',
  'MANUTENÇÃO':               'manutencao',
  'DIRETORIA ADMINISTRATIVA': 'diretoria',
  'PRESIDENCIA':              'presidencia',
  'ADMINISTRATIVO':           'administrativo',
  'SECRETARIA':               'secretaria',
  'SESMT':                    'sesmt',
  'SISTEMA DA QUALIDADE':     'qualidade',
};

function escapeLdapFilter(value: string): string {
  return value.replace(/[\\*()\x00/]/g, c =>
    `\\${c.charCodeAt(0).toString(16).padStart(2, '0')}`
  );
}

function extractDeptSlug(distinguishedName: string): string | null {
  const match = distinguishedName.match(/OU=([^,]+)/i);
  if (!match) return null;
  return OU_SLUG_MAP[match[1]] ?? null;
}

export async function ldapBindUser(username: string, password: string): Promise<boolean> {
  const client = new Client({ url: config.ldapUrl, timeout: 5000 });
  try {
    await client.bind(`${username}@${config.ldapDomain}`, password);
    return true;
  } catch {
    return false;
  } finally {
    await client.unbind().catch(() => {});
  }
}

export async function ldapSearchUser(username: string): Promise<LdapUser | null> {
  const client = new Client({ url: config.ldapUrl, timeout: 5000 });
  try {
    await client.bind(config.ldapServiceDn, config.ldapServicePass);
    const { searchEntries } = await client.search(config.ldapBaseDn, {
      scope:      'sub',
      filter:     `(sAMAccountName=${escapeLdapFilter(username)})`,
      attributes: ['sAMAccountName', 'mail', 'displayName', 'distinguishedName'],
    });
    if (!searchEntries.length) return null;
    const entry = searchEntries[0];
    const dn    = String(entry.distinguishedName ?? '');
    return {
      sAMAccountName: String(entry.sAMAccountName ?? username),
      mail:           String(entry.mail ?? ''),
      displayName:    String(entry.displayName ?? username),
      departmentSlug: extractDeptSlug(dn),
    };
  } catch {
    return null;
  } finally {
    await client.unbind().catch(() => {});
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/ldap.ts
git commit -m "feat(backend): add LDAP service (bind + user search)"
```

---

## Task 6: Rewrite auth controller

**Files:**
- Modify: `backend/src/controllers/authController.ts`

- [ ] **Step 1: Replace entire file**

```typescript
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import config from '../config';
import { ldapBindUser, ldapSearchUser } from '../services/ldap';
import { AuthRequest } from '../middlewares/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username: string; password: string };

    // 1. Validate via LDAP bind
    const isValid = await ldapBindUser(username, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    // 2. Fetch attributes from AD
    const adUser = await ldapSearchUser(username);
    if (!adUser) {
      return res.status(401).json({ error: 'Usuário não encontrado no diretório' });
    }

    const email = adUser.mail || null;

    // 3. Upsert user in DB
    let user = await prisma.user.findUnique({ where: { adUsername: adUser.sAMAccountName } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          adUsername:  adUser.sAMAccountName,
          email,
          name:        adUser.displayName,
          department:  adUser.departmentSlug,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data:  { name: adUser.displayName, email, lastLoginAt: new Date() },
      });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Conta desativada. Contate o TI.' });
    }

    // 4. Remote access check
    const clientIp = req.ip ?? '';
    const isCompanyNetwork =
      config.companyIps.length === 0 || config.companyIps.includes(clientIp);

    if (!isCompanyNetwork) {
      const isTI = user.department === 'ti';
      if (!isTI && !user.allowRemoteAccess) {
        return res.status(403).json({
          error: 'Acesso externo não autorizado. Utilize a rede da empresa.',
        });
      }
    }

    // 5. Issue JWT
    const token = jwt.sign(
      {
        sub:        user.id,
        name:       user.name,
        email:      user.email,
        department: user.department ?? 'unknown',
        role:       user.role,
      },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        department: user.department,
        role:       user.role,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro ao autenticar' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user = await prisma.user.findUnique({
      where:  { id: authReq.userId! },
      select: { id: true, name: true, email: true, department: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/controllers/authController.ts
git commit -m "feat(backend): rewrite auth controller for LDAP/AD login flow"
```

---

## Task 7: Update auth routes and middleware

**Files:**
- Modify: `backend/src/routes/auth.ts`
- Modify: `backend/src/middlewares/auth.ts`

- [ ] **Step 1: Replace `backend/src/routes/auth.ts`**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { login, getMe } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

router.post('/login', async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos' });
  req.body = parsed.data;
  return login(req, res);
});

router.get('/me', authMiddleware, getMe);

router.post('/logout', authMiddleware, (_req, res) => {
  return res.json({ message: 'Logout realizado com sucesso' });
});

export default router;
```

- [ ] **Step 2: Replace `backend/src/middlewares/auth.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface JwtPayload {
  sub:        string;
  name:       string;
  email:      string | null;
  department: string;
  role:       string;
}

export interface AuthRequest extends Request {
  userId?:      string;
  userPayload?: JwtPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload  = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.userId     = payload.sub;
    req.userPayload = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
```

- [ ] **Step 3: Verify backend compiles**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors. If `taskController.ts` or `achievementController.ts` reference removed fields (`user.level`, `user.xp`, `user.password`, `user.sector`), you will see TypeScript errors — fix them by removing or commenting the broken select fields for now (those controllers will be rebuilt in Plan 2).

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/auth.ts backend/src/middlewares/auth.ts
git commit -m "feat(backend): update auth routes + middleware for new JWT payload (sub)"
```

---

## Task 8: Copy assets to frontend/public

**Files:**
- Create: `frontend/public/foto.svg`
- Create: `frontend/public/logo1_transp.svg`
- Create: `frontend/public/logo115-background.svg`

- [ ] **Step 1: Copy the three assets**

```bash
cp "docs/login-kit/assets/foto.svg"              frontend/public/foto.svg
cp "docs/login-kit/assets/logo1_transp.svg"      frontend/public/logo1_transp.svg
cp "docs/login-kit/assets/logo115-background.svg" frontend/public/logo115-background.svg
```

- [ ] **Step 2: Verify files exist**

```bash
ls frontend/public/foto.svg frontend/public/logo1_transp.svg frontend/public/logo115-background.svg
```

Expected: all three listed.

- [ ] **Step 3: Commit**

```bash
git add frontend/public/foto.svg frontend/public/logo1_transp.svg frontend/public/logo115-background.svg
git commit -m "feat(frontend): add institutional login assets to public/"
```

---

## Task 9: Tailwind config + Ubuntu font

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/index.html`

- [ ] **Step 1: Replace `frontend/tailwind.config.js`**

```js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        ubuntu: ['Ubuntu', 'sans-serif'],
      },
      animation: {
        'logo-reveal':   'logoReveal 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'fade-slide-up': 'fadeSlideUp 0.55s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        logoReveal: {
          from: { opacity: '0', transform: 'scale(0.88)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Add Ubuntu font to `frontend/index.html` `<head>`**

Add these two lines immediately after the existing `<meta name="theme-color">` line:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Commit**

```bash
git add frontend/tailwind.config.js frontend/index.html
git commit -m "feat(frontend): add Ubuntu font + login animations to Tailwind config"
```

---

## Task 10: Update frontend types

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Replace the User interface**

Replace the entire content of `frontend/src/types/index.ts`:

```typescript
export interface User {
  id:         string;
  name:       string;
  email:      string | null;
  department: string | null;
  role:       string;
  createdAt?: string;
}

export interface Task {
  id:          string;
  title:       string;
  description: string | null;
  priority:    'simple' | 'medium' | 'critical';
  status:      'pending' | 'in_progress' | 'completed';
  dueDate:     string | null;
  category:    string | null;
  xpReward:    number;
  completedAt: string | null;
  userId:      string;
  createdAt:   string;
  updatedAt:   string;
}

export interface Achievement {
  id:          string;
  name:        string;
  description: string;
  icon:        string;
  requirement: number;
  type:        'daily' | 'weekly' | 'milestone';
  xpReward:    number;
  achieved:    boolean;
  achievedAt:  string | null;
}

export interface LeaderboardEntry {
  rank:       number;
  id:         string;
  name:       string;
  department: string | null;
  xp:         number;
}

export interface TaskStats {
  total:           number;
  completed:       number;
  pending:         number;
  inProgress:      number;
  byPriority:      { simple: number; medium: number; critical: number };
  recentCompleted: number;
  totalXPFromTasks: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat(frontend): update User type for AD auth (remove sector/level/xp/avatar)"
```

---

## Task 11: Update useAuthStore

**Files:**
- Modify: `frontend/src/hooks/useAuthStore.ts`

- [ ] **Step 1: Replace entire file**

```typescript
import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  setAuth:         (user: User, token: string) => void;
  updateUser:      (user: Partial<User>) => void;
  logout:          () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  token:           localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useAuthStore.ts
git commit -m "feat(frontend): update useAuthStore — remove updateAvatar, align to new User type"
```

---

## Task 12: Update api service

**Files:**
- Modify: `frontend/src/services/api.ts`

- [ ] **Step 1: Update the `auth` export in `frontend/src/services/api.ts`**

Replace only the `auth` object (lines 37–52 of the original):

```typescript
// Auth
export const auth = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),

  me: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),
};
```

Remove the `auth.register` and `auth.getXPProgress` entries entirely. Keep `tasks` and `achievements` exports unchanged.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat(frontend): update auth API service — username login, remove register/xp"
```

---

## Task 13: Update Layout — remove gamification refs

**Files:**
- Modify: `frontend/src/components/layout/Layout.tsx`

- [ ] **Step 1: Replace the user card section in Layout.tsx**

In `frontend/src/components/layout/Layout.tsx`:

1. Remove the `Avatar` import and the `ChevronDown`, `ChevronUp` imports.
2. Remove the `showXP` state.
3. Replace the entire user card `<div>` (lines 67–115) with:

```tsx
{user && (
  <div className="border-b-2 border-[color:var(--tf-border-soft)] p-4">
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-lg font-bold text-orange-400">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[color:var(--tf-text-main)]">{user.name}</p>
        <p className="truncate text-xs uppercase tracking-[0.14em] text-[color:var(--tf-text-dim)]">
          {user.department ?? '—'}
        </p>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

If other pages (Dashboard, Tasks, Achievements, Leaderboard) have errors due to removed User fields (`user.level`, `user.xp`, `user.avatar`, `user.sector`), add `// @ts-ignore` above each broken line for now — those pages are fully rebuilt in Plan 2.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/Layout.tsx
git commit -m "feat(frontend): update Layout sidebar — remove avatar/XP panel, show department"
```

---

## Task 14: Port Login page to Tailwind (institutional design)

**Files:**
- Modify: `frontend/src/pages/Login.tsx`

- [ ] **Step 1: Replace entire `frontend/src/pages/Login.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../hooks/useAuthStore';
import { auth } from '../services/api';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuário obrigatório'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate  = useNavigate();
  const setAuth   = useAuthStore(s => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const response = await auth.login(data.username, data.password);
      setAuth(response.data.user, response.data.token);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.error ?? '';
      setServerError(msg || 'Erro ao autenticar. Tente novamente.');
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden font-ubuntu md:flex-row">
      {/* ── Left panel (200px strip on mobile, 50% on desktop) ── */}
      <div className="relative h-[200px] w-full flex-shrink-0 overflow-hidden md:h-auto md:w-1/2">
        <img
          src="/foto.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(145deg, rgba(192,57,43,0.82) 0%, rgba(231,99,39,0.68) 35%, rgba(120,30,20,0.75) 70%, rgba(15,23,42,0.88) 100%)',
          }}
        />
        {/* Corner decorations */}
        <div className="pointer-events-none absolute left-8 top-8 z-[5] h-20 w-20 rounded-tl border-l-2 border-t-2 border-white/35" />
        <div className="pointer-events-none absolute right-8 top-8 z-[6] h-20 w-20 rounded-tr border-r-2 border-t-2 border-white/35" />
        <div className="pointer-events-none absolute bottom-8 left-8 z-[6] h-20 w-20 rounded-bl border-b-2 border-l-2 border-white/35" />
        <div className="pointer-events-none absolute bottom-8 right-8 z-[5] h-20 w-20 rounded-br border-b-2 border-r-2 border-white/35" />
        {/* Decorative circle */}
        <div className="pointer-events-none absolute -bottom-20 -left-20 z-[4] h-80 w-80 rounded-full border border-white/10 bg-orange-500/[0.08]" />
        {/* SVG geometric lines */}
        <svg
          className="pointer-events-none absolute inset-0 z-[4] h-full w-full"
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
        {/* Brand content — hidden on mobile */}
        <div className="relative z-10 hidden h-full flex-col items-center justify-center gap-4 p-8 text-center text-white md:flex">
          <img
            src="/logo1_transp.svg"
            alt="Laboratório Sobral"
            className="mb-1 w-28 animate-logo-reveal drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
          />
          <h1 className="m-0 text-[1.75rem] font-bold leading-tight tracking-[-0.02em]">SbrTask</h1>
          <p className="m-0 text-base font-light opacity-65">Laboratório Sobral</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-[#0f172a] p-6 md:p-8">
        <div className="w-full max-w-[420px] animate-fade-slide-up overflow-hidden rounded-3xl border border-orange-500/20 shadow-[0_24px_64px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)]">
          {/* Card header */}
          <div className="flex items-center justify-center bg-[#ff6501] px-8 py-6">
            <img
              src="/logo115-background.svg"
              alt=""
              className="block h-[130px] w-[130px] animate-logo-reveal object-contain"
            />
          </div>
          {/* Card body — glassmorphism */}
          <div className="flex flex-col items-center gap-4 bg-white/[0.055] p-8 pb-10 backdrop-blur-xl">
            <h2 className="m-0 text-center text-2xl font-bold tracking-[-0.02em] text-white">
              Entre na sua conta
            </h2>
            <p className="m-0 text-center text-xs text-white/45">
              Área restrita · Colaboradores autorizados
            </p>
            <div className="my-1 h-px w-full bg-white/[0.08]" />

            <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="username"
                  className="text-[0.8125rem] font-medium tracking-[0.01em] text-white/65"
                >
                  Usuário de rede
                </label>
                <input
                  {...register('username')}
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  disabled={isSubmitting}
                  className="w-full rounded-[10px] border border-white/[0.12] bg-white/[0.07] px-4 py-3 font-ubuntu text-[0.9375rem] text-white outline-none transition-colors placeholder:text-white/25 focus:border-orange-500/70 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errors.username && (
                  <p className="text-[0.8125rem] text-red-300">{errors.username.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-[0.8125rem] font-medium tracking-[0.01em] text-white/65"
                >
                  Senha
                </label>
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="w-full rounded-[10px] border border-white/[0.12] bg-white/[0.07] px-4 py-3 font-ubuntu text-[0.9375rem] text-white outline-none transition-colors placeholder:text-white/25 focus:border-orange-500/70 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errors.password && (
                  <p className="text-[0.8125rem] text-red-300">{errors.password.message}</p>
                )}
              </div>

              {serverError && (
                <p className="rounded-lg border border-red-500/25 bg-red-500/[0.12] px-3 py-2 text-center text-[0.8125rem] text-red-300">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-xl bg-gradient-to-br from-[#e76327] to-[#c0392b] px-6 py-3.5 font-ubuntu text-[0.9375rem] font-semibold text-white shadow-[0_2px_8px_rgba(231,99,39,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(231,99,39,0.4)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(231,99,39,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Autenticando…' : 'Entrar'}
              </button>
            </form>

            <p className="m-0 text-center text-xs text-white/30">
              Em caso de problemas com a senha, contate o TI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Login.tsx
git commit -m "feat(frontend): port institutional login page to Tailwind (login-kit design)"
```

---

## Task 15: Update App.tsx routing

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Remove /register route and Register import from App.tsx**

Remove line: `import Register from './pages/Register';`

Remove route: `<Route path="/register" element={<Register />} />`

The resulting routes block should look like:

```tsx
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<Login />} />

  {/* Protected routes */}
  <Route element={<Layout />}>
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/tasks"     element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
    <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
    <Route path="/leaderboard"  element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
  </Route>

  <Route path="/"  element={<Navigate to="/dashboard" replace />} />
  <Route path="*"  element={<Navigate to="/dashboard" replace />} />
</Routes>
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: only pre-existing errors in Dashboard/Tasks/etc (pages that use old User fields) — not in Login, App, Layout, or hooks. Those will be cleaned up in Plan 2.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): remove /register route — users auto-provisioned via AD"
```

---

## Task 16: Login page tests

**Files:**
- Create: `frontend/src/pages/Login.test.tsx`

- [ ] **Step 1: Create `frontend/src/pages/Login.test.tsx`**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './Login';

const mockSetAuth   = vi.fn();
const mockNavigate  = vi.fn();

vi.mock('../hooks/useAuthStore', () => ({
  useAuthStore: (selector: any) => selector({ setAuth: mockSetAuth }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({
  auth: { login: vi.fn() },
}));

describe('Login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders username and password fields', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByLabelText(/usuário de rede/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByText(/usuário obrigatório/i)).toBeInTheDocument();
    expect(await screen.findByText(/senha obrigatória/i)).toBeInTheDocument();
  });

  it('calls auth.login with username and password', async () => {
    const { auth } = await import('../services/api');
    vi.mocked(auth.login).mockResolvedValueOnce({
      data: {
        token: 'tok123',
        user:  { id: '1', name: 'João', email: null, department: 'ti', role: 'dept_user' },
      },
    } as any);

    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/usuário de rede/i), 'jsilva');
    await userEvent.type(screen.getByLabelText(/senha/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(auth.login).toHaveBeenCalledWith('jsilva', 'secret123'));
  });

  it('shows server error on 401', async () => {
    const { auth } = await import('../services/api');
    vi.mocked(auth.login).mockRejectedValueOnce({
      response: { data: { error: 'Usuário ou senha inválidos' } },
    });

    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/usuário de rede/i), 'jsilva');
    await userEvent.type(screen.getByLabelText(/senha/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/usuário ou senha inválidos/i)).toBeInTheDocument();
  });

  it('calls setAuth and navigates to /dashboard on success', async () => {
    const { auth } = await import('../services/api');
    const fakeUser = { id: '1', name: 'João', email: null, department: 'ti', role: 'dept_user' };
    vi.mocked(auth.login).mockResolvedValueOnce({
      data: { token: 'tok123', user: fakeUser },
    } as any);

    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/usuário de rede/i), 'jsilva');
    await userEvent.type(screen.getByLabelText(/senha/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(fakeUser, 'tok123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd frontend && npm test
```

Expected: 5 tests pass. If any fail due to a missing mock or import error, check the error message carefully — the most common cause is a missing `vi.mocked()` wrapper or a stale module cache (add `vi.resetModules()` in `beforeEach` if needed).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Login.test.tsx
git commit -m "test(frontend): add Login page tests for institutional auth flow"
```

---

## Task 17: Smoke test

**Files:** none (verification only)

- [ ] **Step 1: Start backend**

```bash
cd backend && npm run dev
```

Expected: `Server running on port 3001` with no TypeScript errors.

- [ ] **Step 2: Start frontend in a separate terminal**

```bash
cd frontend && npm run dev
```

Expected: `Local: http://localhost:5173` with no fatal errors.

- [ ] **Step 3: Open browser at http://localhost:5173/login**

Verify:
- Split-screen layout renders (photo left, card right on desktop)
- Mobile: 200px strip + form below (resize DevTools to < 768px to confirm)
- Card header shows the logo115 image with orange background
- Form has "Usuário de rede" and "Senha" labels
- Submitting empty form shows validation errors
- Ubuntu font loaded (check DevTools > Network > Fonts)
- Logo-reveal animation fires on card header image
- Fade-slide-up animation fires on card

- [ ] **Step 4: Final commit if any adjustments were needed**

```bash
git add -p   # stage only intentional changes
git commit -m "fix(frontend): smoke test adjustments to institutional login"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Branch from master | Task 1 |
| LDAP bind + user search | Task 5 |
| Prisma schema: adUsername, department, UserGameProfile | Task 4 |
| Auth controller: LDAP flow + auto-provision + IP check | Task 6 |
| Auth routes: remove /register, update login schema | Task 7 |
| JWT payload: sub, name, email, department, role | Task 6 + 7 |
| Frontend User type updated | Task 10 |
| useAuthStore: remove updateAvatar | Task 11 |
| auth.login(username, password) | Task 12 |
| Login page: institutional split-screen, Tailwind | Task 14 |
| Login page: username field (not email) | Task 14 |
| Remove /register route | Task 15 |
| Layout: no avatar/XP/sector refs | Task 13 |
| Login tests | Task 16 |
| Assets in public/ | Task 8 |
| Ubuntu font + animations | Task 9 |

**No placeholders found.**

**Type consistency:** `auth.login()` in Task 12 returns `{ data: { token, user: User } }` — Login.tsx in Task 14 reads `response.data.user` and `response.data.token` — consistent. JWT `sub` in Task 6 maps to `req.userId` in middleware Task 7 — consistent.
