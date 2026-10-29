import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

interface BudgetInput {
  month?: string
  category?: string
  amount?: number
}

export function validateBudget(input: BudgetInput) {
  const errors: string[] = []
  const month = String(input.month ?? "").trim()
  const category = String(input.category ?? "").trim()
  const amount = Number(input.amount)

  if (!MONTH_KEY_REGEX.test(month)) {
    errors.push("Month must be in yyyy-MM format.")
  }
  if (!category || category.length > 60) {
    errors.push("Category is required.")
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Budget amount must be a positive number.")
  }

  return {
    errors,
    data: {
      month,
      category,
      amount: Math.round(amount * 100) / 100,
    },
  }
}

export async function GET() {
  try {
    const budgets = await db.budget.findMany({
      orderBy: [{ month: "desc" }, { category: "asc" }],
    })
    return NextResponse.json({ budgets })
  } catch (error) {
    console.error("GET /api/budgets failed:", error)
    return NextResponse.json({ error: "Failed to load budgets." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BudgetInput
    const { errors, data } = validateBudget(body)

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 })
    }

    const budget = await db.budget.upsert({
      where: { month_category: { month: data.month, category: data.category } },
      create: data,
      update: { amount: data.amount },
    })

    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    console.error("POST /api/budgets failed:", error)
    return NextResponse.json({ error: "Failed to save budget." }, { status: 500 })
  }
}
