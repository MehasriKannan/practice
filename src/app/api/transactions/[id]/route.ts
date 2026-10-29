import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateTransaction } from "../route"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { errors, data } = validateTransaction(body, true)

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 })
    }

    const existing = await db.transaction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 })
    }

    const transaction = await db.transaction.update({
      where: { id },
      data,
    })

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("PATCH /api/transactions/[id] failed:", error)
    return NextResponse.json({ error: "Failed to update transaction." }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const existing = await db.transaction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 })
    }

    await db.transaction.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/transactions/[id] failed:", error)
    return NextResponse.json({ error: "Failed to delete transaction." }, { status: 500 })
  }
}
