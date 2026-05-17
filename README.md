# GestFast v2 — Sistema completo de gestão artesanal

## O que há de novo na v2
- 📦 **Estoque completo** — matérias-primas com custo automático
- 📋 **Ficha técnica** — ingredientes, rendimento, mão de obra
- ⚙️ **Módulo de produção** — baixa automática de estoque
- 🔄 **Recálculo automático** — custo muda → preço atualiza sozinho
- 📊 **Dashboard completo** — estoque, produções, alertas

## Stack
- Next.js 14 + TypeScript + TailwindCSS
- PostgreSQL (Supabase) + Prisma ORM
- JWT auth (cookie httpOnly)

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencher com credenciais

# Criar tabelas (inclui modelos novos)
npm run db:push

# Popular dados de demo
npm run db:seed

npm run dev
```

**Credenciais demo:**
- Admin: `admin@gestfast.com` / `admin123456`
- Usuário: `demo@gestfast.com` / `demo123456`

## Deploy Vercel + Supabase

### Variáveis de ambiente no Vercel:
| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL Supabase porta **6543** (Transaction/pgBouncer) |
| `DIRECT_URL` | URL Supabase porta **5432** (Direct) |
| `JWT_SECRET` | 64 bytes hex — `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `8h` |

### IMPORTANTE — migrar banco antes do primeiro deploy:
```bash
# Localmente, com .env preenchido com URLs do Supabase:
npm run db:push
npm run db:seed  # opcional
```

### Após cada push ao GitHub, o Vercel faz redeploy automático.

## Estrutura do projeto (v2)
```
src/
├── app/
│   ├── dashboard/        # Visão geral com lucro, estoque, alertas
│   ├── stock/            # Matérias-primas e ingredientes
│   ├── products/         # Catálogo + ficha técnica por produto
│   ├── production/       # Registrar produções (baixa automática)
│   ├── costs/            # Custos fixos (gás, energia, embalagem)
│   ├── simulation/       # Simular preços
│   └── api/              # REST API routes
├── components/
│   ├── AppShell.tsx      # Layout autenticado com sidebar
│   ├── StockClient.tsx   # CRUD matérias-primas
│   ├── ProductionClient.tsx # Registrar produção + verificar estoque
│   ├── RecipeForm.tsx    # Ficha técnica com preview de custo
│   └── ...
├── services/
│   ├── cost-calculator.ts  # Todas as fórmulas centralizadas
│   ├── stock-service.ts    # Movimentações e baixa automática
│   └── pricing-service.ts  # Recálculo automático de preços
└── types/
    └── index.ts          # Tipos centralizados
```
