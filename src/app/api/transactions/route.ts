import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const DAY_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/

interface TransactionInput {
  type?: string
  amount?: number
  category?: string
  description?: string
  date?: string
}

export function validateTransaction(input: TransactionInput, partial = false) {
  const errors: string[] = []
  const data: {
    type?: "income" | "expense"
    amount?: number
    category?: string
    description?: string
    date?: Date
  } = {}

  if (input.type !== undefined || !partial) {
    if (input.type !== "income" && input.type !== "expense") {
      errors.push("Type must be 'income' or 'expense'.")
    } else {
      data.type = input.type
    }
  }

  if (input.amount !== undefined || !partial) {
    const amount = Number(input.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push("Amount must be a positive number.")
    } else {
      data.amount = Math.round(amount * 100) / 100
    }
  }

  if (input.category !== undefined || !partial) {
    const category = String(input.category ?? "").trim()
    if (!category) {
      errors.push("Category is required.")
    } else if (category.length > 60) {
      errors.push("Category is too long.")
    } else {
      data.category = category
    }
  }

  if (input.description !== undefined || !partial) {
    const description = String(input.description ?? "").trim()
    if (description.length > 200) {
      errors.push("Description is too long (max 200 characters).")
    } else {
      data.description = description
    }
  }

  if (input.date !== undefined || !partial) {
    const date = String(input.date ?? "").trim()
    if (!DAY_KEY_REGEX.test(date)) {
      errors.push("Date must be in yyyy-MM-dd format.")
    } else {
      // Store as UTC midnight of the calendar date to keep the day key stable.
      data.date = new Date(`${date}T00:00:00.000Z`)
    }
  }

  return { errors, data }
}

export async function GET() {
  try {
    const transactions = await db.transaction.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    })
    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("GET /api/transactions failed:", error)
    return NextResponse.json({ error: "Failed to load transactions." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TransactionInput
    const { errors, data } = validateTransaction(body)

    if (errors.length > 0 || !data.type || data.amount === undefined || !data.category || !data.date) {
      return NextResponse.json({ error: errors[0] ?? "Invalid transaction." }, { status: 400 })
    }

    const transaction = await db.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description ?? "",
        date: data.date,
      },
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error("POST /api/transactions failed:", error)
    return NextResponse.json({ error: "Failed to create transaction." }, { status: 500 })
  }
}
