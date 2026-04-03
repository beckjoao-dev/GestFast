# GestFast — Sistema de Precificação

## Stack
- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Banco**: PostgreSQL + Prisma ORM
- **Auth**: JWT em cookie httpOnly
- **Estilo**: TailwindCSS
- **Deploy**: Vercel + Railway

---

## Rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 3. Criar banco e tabelas
npm run db:push

# 4. Popular dados demo (opcional)
npm run db:seed

# 5. Iniciar servidor
npm run dev
```

Acesse: http://localhost:3000

Credenciais demo:
- Admin: `admin@gestfast.com` / `admin123456`
- Usuário: `demo@gestfast.com` / `demo123456`

---

## Deploy no Vercel + Railway

### 1. Banco de dados — Railway
1. Crie um projeto em [railway.app](https://railway.app)
2. Adicione o plugin **PostgreSQL**
3. Copie a `DATABASE_URL` do painel

### 2. Frontend — Vercel
1. Suba o projeto para o GitHub
2. Importe no [vercel.com](https://vercel.com)
3. Adicione as variáveis de ambiente:
   - `DATABASE_URL` — URL do Railway
   - `JWT_SECRET` — gere com o comando abaixo
   - `JWT_EXPIRES_IN` — ex: `8h`
4. O `vercel.json` já inclui `prisma generate` no build

Gerar JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Migrar banco em produção
Após o primeiro deploy, execute via Railway CLI ou painel:
```bash
npx prisma db push
```

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build produção |
| `npm run db:push` | Sincronizar schema |
| `npm run db:seed` | Popular dados demo |
| `npm run db:studio` | Interface visual do banco |
