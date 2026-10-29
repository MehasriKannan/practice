"use client"

import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"
import { startOfMonth, startOfYear, subDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TransactionList } from "@/components/transaction-list"
import { formatCurrency } from "@/lib/format"
import {
  ALL_CATEGORIES,
  type Transaction,
  type TransactionType,
} from "@/lib/types"

type PeriodFilter = "all" | "30d" | "month" | "year"

interface TransactionsPanelProps {
  transactions: Transaction[] | undefined
  onEdit: (t: Transaction) => void
  onAdd: () => void
}

export function TransactionsPanel({ transactions, onEdit, onAdd }: TransactionsPanelProps) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")

  const filtered = useMemo(() => {
    if (!transactions) return []
    const now = new Date()
    let minDay: string | null = null
    if (periodFilter === "30d") minDay = startOfDayKey(subDays(now, 29))
    if (periodFilter === "month") minDay = startOfDayKey(startOfMonth(now))
    if (periodFilter === "year") minDay = startOfDayKey(startOfYear(now))

    const q = search.trim().toLowerCase()
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false
      if (minDay && t.date.slice(0, 10) < minDay) return false
      if (q) {
        const haystack = `${t.description} ${t.category}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [transactions, search, typeFilter, categoryFilter, periodFilter])

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of filtered) {
      if (t.type === "income") income += t.amount
      else expense += t.amount
    }
    return { income, expense, net: income - expense }
  }, [filtered])

  const hasActiveFilters =
    search.trim() !== "" || typeFilter !== "all" || categoryFilter !== "all" || periodFilter !== "all"

  if (!transactions) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search description or category…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search transactions"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 lg:flex lg:w-auto">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionType | "all")}>
            <SelectTrigger className="w-full lg:w-32" aria-label="Filter by type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full lg:w-44" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {ALL_CATEGORIES.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
            <SelectTrigger className="w-full lg:w-40" aria-label="Filter by period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onAdd} className="lg:ml-2">
          <Plus className="size-4" /> Add transaction
        </Button>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border bg-card px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          <strong className="text-foreground tabular-nums">{filtered.length}</strong> result
          {filtered.length === 1 ? "" : "s"}
        </span>
        <span className="text-muted-foreground">
          Income: <strong className="text-emerald-600 tabular-nums dark:text-emerald-400">{formatCurrency(totals.income)}</strong>
        </span>
        <span className="text-muted-foreground">
          Expenses: <strong className="text-rose-600 tabular-nums dark:text-rose-400">{formatCurrency(totals.expense)}</strong>
        </span>
        <span className="text-muted-foreground">
          Net:{" "}
          <strong className={`tabular-nums ${totals.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
            {formatCurrency(totals.net)}
          </strong>
        </span>
        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 px-2 text-xs"
            onClick={() => {
              setSearch("")
              setTypeFilter("all")
              setCategoryFilter("all")
              setPeriodFilter("all")
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="max-h-[38rem] overflow-y-auto px-4 py-3 [scrollbar-width:thin]">
          <TransactionList
            transactions={filtered}
            onEdit={onEdit}
            grouped
            emptyTitle={hasActiveFilters ? "Nothing matches your filters" : "No transactions yet"}
            emptyDescription={
              hasActiveFilters
                ? "Try widening the period or clearing the search to see more results."
                : "Click \u201cAdd transaction\u201d to record your first income or expense."
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}

function startOfDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
