# GestFast 🚀

> Plataforma de precificação para pequenos negócios artesanais.
> Calcule o custo real, defina o preço justo e entenda seu lucro.

---

## Stack

| Camada      | Tecnologia                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 14 (App Router) + TypeScript |
| Estilo      | TailwindCSS                       |
| Backend     | API Routes do Next.js             |
| Banco       | PostgreSQL                        |
| ORM         | Prisma                            |
| Auth        | JWT + bcrypt (httpOnly cookie)    |
| Deploy      | Vercel (frontend) + Railway (DB)  |

---

## Estrutura do projeto

```
gestfast/
├── prisma/
│   ├── schema.prisma       # Modelos do banco de dados
│   └── seed.ts             # Dados de demonstração
├── src/
│   ├── app/
│   │   ├── (app)/          # Rotas protegidas (layout com sidebar)
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   │   ├── new/
│   │   │   │   └── [id]/edit/
│   │   │   ├── ingredients/
│   │   │   └── simulation/
│   │   ├── api/
│   │   │   ├── auth/       # login, register, me/logout
│   │   │   ├── products/   # CRUD completo
│   │   │   ├── ingredients/# CRUD completo
│   │   │   └── dashboard/  # Stats + alertas
│   │   ├── login/
│   │   ├── register/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   ├── AlertBanner.tsx
│   │   ├── ProductForm.tsx         # Formulário criar/editar produto
│   │   ├── IngredientManager.tsx   # CRUD de ingredientes (client)
│   │   ├── SimulationClient.tsx    # Slider de margem em tempo real
│   │   └── DeleteProductButton.tsx
│   ├── lib/
│   │   ├── prisma.ts       # Singleton do PrismaClient
│   │   ├── auth.ts         # JWT + bcrypt + cookies
│   │   ├── pricing.ts      # Motor de cálculo de preço
│   │   ├── validations.ts  # Schemas Zod
│   │   ├── api.ts          # Helpers de resposta HTTP
│   │   └── utils.ts        # cn() helper
│   └── middleware.ts       # Proteção de rotas
├── .env.example
├── tailwind.config.js
└── tsconfig.json
```

---

## Configuração local

### 1. Pré-requisitos

- Node.js 18+
- PostgreSQL rodando localmente (ou conta no Railway/Neon)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gestfast"
JWT_SECRET="gere-com-o-comando-abaixo"
```

Gerar JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Configurar banco de dados

```bash
# Criar tabelas
npm run db:push

# Popular com dados de demonstração (opcional)
npm run db:seed
```

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

Usuário demo: `demo@gestfast.com` / `demo123456`

---

## Fórmula de precificação

```
preço_sugerido = custo_unitário ÷ (1 − margem)
```

Exemplo com margem de 40%:
- Custo unitário: R$ 6,00
- Preço sugerido: 6,00 ÷ (1 − 0,40) = **R$ 10,00**
- Lucro unitário: R$ 4,00

---

## Deploy em produção

### Banco de dados — Railway

1. Criar projeto no [Railway](https://railway.app)
2. Adicionar plugin PostgreSQL
3. Copiar a `DATABASE_URL` fornecida
4. Rodar: `npm run db:push`

### Frontend — Vercel

1. Fazer push para GitHub
2. Importar repo no [Vercel](https://vercel.com)
3. Adicionar variáveis de ambiente:
   - `DATABASE_URL` (do Railway)
   - `JWT_SECRET` (gerado acima)
4. Deploy automático em cada push na main

---

## Segurança implementada

- Senhas com bcrypt (salt rounds: 12)
- JWT em cookie `httpOnly` + `secure` + `sameSite: lax`
- Middleware de proteção de rotas
- Validação com Zod (frontend e backend)
- Isolamento por `userId` em todas as queries
- Proteção contra SQL Injection via Prisma ORM
- Variáveis sensíveis apenas em `.env` (nunca no código)

---

## Melhorias futuras sugeridas

- [ ] Histórico de preços (ver se custo aumentou)
- [ ] Exportar ficha técnica do produto em PDF
- [ ] Relatório mensal de lucratividade
- [ ] Multi-usuário com planos (Stripe)
- [ ] PWA para uso offline
- [ ] Dark/light mode toggle na UI
- [ ] Importar ingredientes via CSV

---

## Scripts disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Produção local
npm run db:push      # Sincronizar schema com banco
npm run db:migrate   # Criar migration
npm run db:seed      # Popular dados demo
npm run db:studio    # Interface visual do Prisma
```
