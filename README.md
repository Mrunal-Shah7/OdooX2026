# PeoplePay360

```bash
cp .env.example .env   # set DATABASE_URL
npm run setup && npm run db:push && npm run db:seed && npm run dev
```

## Commands

| Script | What it does |
|---|---|
| `npm run setup` | Install root/server/web deps, generate API types + Prisma client |
| `npm run gen:types` | Regenerate `shared/api-types.ts` from `openapi.yaml` |
| `npm run db:push` | Apply Prisma schema to the database |
| `npm run db:seed` | Truncate and reload demo data (TRD §13) |
| `npm run dev` | API on :4000 and Vite on :5173 |

## Stack

Node 22 · TypeScript 5.6 · Express 5 · Prisma 6 · PostgreSQL · React 19 · Vite 6 · TanStack Router/Query/Table · Tailwind 4 · zod · openapi-typescript

## File map

`server/` API · `web/` SPA · `shared/` generated types + enum constants · `openapi.yaml` contract

## Real vs stubbed

**Real:** error envelope, auth middleware interface (`x-user-id` stub), departments list/create/update/delete (DB), seed, UI shell + primitives, every route registered.

**Stubbed:** all other services/endpoints return realistic fixtures (`// TODO: STUB`). Login sets session from seed users without JWT cookies.
