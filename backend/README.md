# Code-First

> This is where you'll write your code-first implementation of the User Story from DDDForum. You can [see the assignment page for more details](https://www.essentialist.dev/products/the-software-essentialist/categories/2153149734/posts/2168948146).

## Database (required for signup / Prisma)

1. Copy [.env.example](.env.example) to `.env` in this folder (`backend/.env`).
2. Start Docker, then either run **`npm run db:up`** (same folder), or `./scripts/ensure-postgres-dev.sh` — both start Postgres and tolerate an existing **`dddforum-postgres`** container.
3. Apply schema: `npx prisma migrate deploy`  
   (`npm run db:setup` runs `db:up` and migrations together.)

`ECONNREFUSED` while calling Prisma means Postgres is not running or `DATABASE_URL` does not match the running instance.

If Docker is unavailable, run the API with `npx ts-node ./src/index.ts` only after starting Postgres some other way; `npm run start:dev` and the VS Code **DDD Forum (full stack)** launch config run **`scripts/ensure-postgres-dev.sh`** first (via `npm run db:up` / the **backend: Postgres (docker up)** task).
