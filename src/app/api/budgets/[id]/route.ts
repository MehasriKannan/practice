import { NextResponse } from "next/server"
import { db } from "@/lib/db"

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const existing = await db.budget.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Budget not found." }, { status: 404 })
    }

    await db.budget.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/budgets/[id] failed:", error)
    return NextResponse.json({ error: "Failed to delete budget." }, { status: 500 })
  }
}
