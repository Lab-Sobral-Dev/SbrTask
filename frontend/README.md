# Frontend SbrTask

Frontend em React + TypeScript com Vite.

## Scripts

- `npm start` ou `npm run dev`: inicia o servidor de desenvolvimento em `http://localhost:5173`
- `npm run build`: valida TypeScript e gera o bundle de produção
- `npm run preview`: publica localmente o build gerado
- `npm test`: executa os testes com Vitest

## Ambiente

Crie um arquivo `.env` com:

```bash
VITE_API_URL=http://localhost:3001/api
```

Por compatibilidade, o código ainda aceita `REACT_APP_API_URL`, mas o padrão novo é `VITE_API_URL`.
