# practice

A personal practice repository, currently holding a full-stack **Expense Tracker** web app.

## Expense Tracker

Track daily, monthly and yearly income & expenses with budgets and spending analysis.

- **Dashboard** — total balance, income & expenses cards, daily / monthly / yearly period views, budget snapshot, category donut and trend charts
- **Transactions** — add, edit and delete entries with search, filters and day-grouped history
- **Budgets** — monthly per-category limits with progress bars and over-budget warnings
- **Analysis** — savings rate, income vs. expense trends, daily spending rhythm, top expenses
- **Local persistence** — data is stored in a local SQLite database, so it survives app restarts

### Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Recharts · Prisma (SQLite) · TanStack Query

### Run locally

```bash
bun install
bun run db:push        # create the SQLite database
bun scripts/seed.ts    # optional: sample data
bun run dev            # start the dev server on port 3000
```
