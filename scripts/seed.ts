/**
 * Seeds the SQLite database with realistic sample data (3 months of
 * transactions + current-month budgets). Idempotent: skips if data exists.
 * Run with: bun /home/z/my-project/scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

function dayKey(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d))
}

function rand(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface SeedTx {
  type: "income" | "expense"
  amount: number
  category: string
  description: string
  date: Date
}

async function main() {
  const existing = await db.transaction.count()
  if (existing > 0) {
    console.log(`Database already has ${existing} transactions — skipping seed.`)
    return
  }

  const now = new Date()
  const transactions: SeedTx[] = []

  for (let back = 2; back >= 0; back--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - back, 1)
    const y = monthDate.getFullYear()
    const m = monthDate.getMonth() + 1
    const lastDay = back === 0 ? now.getDate() : new Date(y, m, 0).getDate()

    // Income: salary on the 1st, occasional freelance
    transactions.push({
      type: "income",
      amount: 4800,
      category: "Salary",
      description: "Monthly salary",
      date: dayKey(y, m, 1),
    })
    if (lastDay >= 15) {
      transactions.push({
        type: "income",
        amount: rand(600, 1400),
        category: "Freelance",
        description: pick(["Design project", "Consulting call", "Website build"]),
        date: dayKey(y, m, 15),
      })
    }

    // Recurring expenses
    if (lastDay >= 3) transactions.push({ type: "expense", amount: 1350, category: "Housing", description: "Rent", date: dayKey(y, m, 3) })
    if (lastDay >= 5) transactions.push({ type: "expense", amount: rand(80, 160), category: "Utilities", description: "Electricity & water", date: dayKey(y, m, 5) })
    if (lastDay >= 6) transactions.push({ type: "expense", amount: 55, category: "Utilities", description: "Internet", date: dayKey(y, m, 6) })
    if (lastDay >= 10) transactions.push({ type: "expense", amount: 49.99, category: "Entertainment", description: "Streaming subscriptions", date: dayKey(y, m, 10) })
    if (lastDay >= 12) transactions.push({ type: "expense", amount: rand(35, 70), category: "Transport", description: "Fuel", date: dayKey(y, m, 12) })

    // Random everyday spending
    const everyday: Array<{ category: string; descriptions: string[]; min: number; max: number }> = [
      { category: "Groceries", descriptions: ["Supermarket run", "Weekly groceries", "Farmers market"], min: 25, max: 120 },
      { category: "Food & Dining", descriptions: ["Lunch", "Coffee & pastry", "Dinner with friends", "Takeout"], min: 8, max: 65 },
      { category: "Transport", descriptions: ["Rideshare", "Metro card top-up", "Parking"], min: 3, max: 40 },
      { category: "Shopping", descriptions: ["Clothes", "Home items", "Electronics accessory"], min: 15, max: 180 },
      { category: "Entertainment", descriptions: ["Movie night", "Concert ticket", "Board game"], min: 10, max: 90 },
      { category: "Health", descriptions: ["Pharmacy", "Gym membership", "Dentist visit"], min: 15, max: 150 },
      { category: "Education", descriptions: ["Online course", "Book purchase"], min: 12, max: 90 },
      { category: "Travel", descriptions: ["Weekend trip", "Train ticket", "Hotel booking"], min: 60, max: 420 },
    ]

    const count = back === 0 ? Math.min(14, Math.max(6, Math.floor(lastDay / 2))) : 18
    for (let i = 0; i < count; i++) {
      const item = pick(everyday)
      const day = 1 + Math.floor(Math.random() * lastDay)
      transactions.push({
        type: "expense",
        amount: rand(item.min, item.max),
        category: item.category,
        description: pick(item.descriptions),
        date: dayKey(y, m, day),
      })
    }
  }

  // Sort oldest first for nicer createdAt ordering
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime())

  await db.transaction.createMany({ data: transactions })

  // Budgets for the current month
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const budgets = [
    { month: monthKey, category: "Food & Dining", amount: 450 },
    { month: monthKey, category: "Groceries", amount: 400 },
    { month: monthKey, category: "Transport", amount: 180 },
    { month: monthKey, category: "Shopping", amount: 250 },
    { month: monthKey, category: "Entertainment", amount: 150 },
    { month: monthKey, category: "Housing", amount: 1400 },
    { month: monthKey, category: "Utilities", amount: 220 },
    { month: monthKey, category: "Health", amount: 120 },
  ]
  for (const b of budgets) {
    await db.budget.upsert({
      where: { month_category: { month: b.month, category: b.category } },
      create: b,
      update: { amount: b.amount },
    })
  }

  console.log(`Seeded ${transactions.length} transactions and ${budgets.length} budgets for ${monthKey}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
