# SbrTask - Gerenciador de Tarefas com Gamificacao

Plataforma de gerenciamento de tarefas com sistema de gamificacao integrado, onde cada usuario possui um personagem customizavel que evolui conforme completa tarefas.

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Zustand
- Recharts
- Socket.IO Client

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- Socket.IO

## Funcionalidades

- Autenticacao com login e cadastro
- Criacao e customizacao de personagem
- Gerenciamento de tarefas (CRUD)
- Sistema de XP e niveis
- Conquistas e medalhas
- Ranking por setor
- Dashboard com graficos
- Notificacoes em tempo real

## Como executar

### Pre-requisitos
- Node.js 20+
- PostgreSQL 14+

### Backend

```bash
cd backend
copy .env.example .env
npm install
npm run db:generate
npm run db:push
npm run dev
```

Backend disponivel em `http://localhost:3001`.

### Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm start
```

Frontend disponivel em `http://localhost:5173`.

## Variaveis de ambiente

### Backend

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sbrtask
JWT_SECRET=sua-chave-secreta-aqui
CORS_ORIGIN=http://localhost:5173
```

### Frontend

```env
VITE_API_URL=http://localhost:3001/api
```

O frontend ainda aceita `REACT_APP_API_URL` por compatibilidade, mas o padrao atual e `VITE_API_URL`.
