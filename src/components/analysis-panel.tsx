"use client"

import { useMemo, useState } from "react"
import { addMonths, addYears, format } from "date-fns"
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoryIcon } from "@/components/category-icon"
import { CategoryDonutChart, DailyExpenseArea, IncomeExpenseBars } from "@/components/charts"
import { formatCurrency, localMonthKey } from "@/lib/format"
import { categoryMeta, type Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"

type Mode = "month" | "year"

interface AnalysisPanelProps {
  transactions: Transaction[] | undefined
}

export function AnalysisPanel({ transactions }: AnalysisPanelProps) {
  const [mode, setMode] = useState<Mode>("month")
  const [anchor, setAnchor] = useState<Date>(() => new Date())

  const monthKey = localMonthKey(anchor)
  const yearKey = String(anchor.getFullYear())

  const inScope = useMemo(() => {
    if (!transactions) return []
    return transactions.filter((t) =>
      mode === "month" ? t.date.slice(0, 7) === monthKey : t.date.slice(0, 4) === yearKey
    )
  }, [transactions, mode, monthKey, yearKey])

  const donutData = useMemo(() => {
    const buckets = new Map<string, number>()
    for (const t of inScope) {
      if (t.type !== "expense") continue
      buckets.set(t.category, (buckets.get(t.category) ?? 0) + t.amount)
    }
    return [...buckets.entries()]
      .map(([name, value]) => ({ name, value, color: categoryMeta(name).color }))
      .sort((a, b) => b.value - a.value)
  }, [inScope])

  const monthlyBars = useMemo(() => {
    if (!transactions) return []
    if (mode === "year") {
      return Array.from({ length: 12 }, (_, m) => {
        const key = `${yearKey}-${String(m + 1).padStart(2, "0")}`
        let income = 0
        let expense = 0
        for (const t of transactions) {
          if (t.date.slice(0, 7) !== key) continue
          if (t.type === "income") income += t.amount
          else expense += t.amount
        }
        return { label: format(new Date(Number(yearKey), m, 1), "MMM"), income, expense }
      })
    }
    // Month mode → previous 12 months ending at the selected month
    const points: { label: string; income: number; expense: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = addMonths(new Date(`${monthKey}-01T00:00:00`), -i)
      const key = localMonthKey(d)
      let income = 0
      let expense = 0
      for (const t of transactions) {
        if (t.date.slice(0, 7) !== key) continue
        if (t.type === "income") income += t.amount
        else expense += t.amount
      }
      points.push({ label: format(d, "MMM"), income, expense })
    }
    return points
  }, [transactions, mode, monthKey, yearKey])

  const dailyArea = useMemo(() => {
    if (mode !== "month" || !transactions) return []
    const [y, m] = monthKey.split("-").map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => {
      const key = `${monthKey}-${String(i + 1).padStart(2, "0")}`
      const amount = transactions
        .filter((t) => t.type === "expense" && t.date.slice(0, 10) === key)
        .reduce((s, t) => s + t.amount, 0)
      return { label: String(i + 1), amount }
    })
  }, [transactions, mode, monthKey])

  const topExpenses = useMemo(() => {
    return inScope
      .filter((t) => t.type === "expense")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [inScope])

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of inScope) {
      if (t.type === "income") income += t.amount
      else expense += t.amount
    }
    return { income, expense, savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0 }
  }, [inScope])

  const scopeLabel = mode === "month" ? format(anchor, "MMMM yyyy") : format(anchor, "yyyy")

  if (!transactions) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList>
            <TabsTrigger value="month">By month</TabsTrigger>
            <TabsTrigger value="year">By year</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous"
            onClick={() => setAnchor((d) => (mode === "month" ? addMonths(d, -1) : addYears(d, -1)))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-36 text-center text-sm font-semibold">{scopeLabel}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next"
            onClick={() => setAnchor((d) => (mode === "month" ? addMonths(d, 1) : addYears(d, 1)))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="py-4">
          <CardContent className="px-5">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
              {formatCurrency(totals.income)}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-5">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="text-xl font-bold text-rose-600 tabular-nums dark:text-rose-400">
              {formatCurrency(totals.expense)}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-5">
            <p className="text-sm text-muted-foreground">Savings rate</p>
            <p className={cn("text-xl font-bold tabular-nums", totals.savingsRate >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
              {Math.round(totals.savingsRate)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Where the money goes</CardTitle>
            <p className="text-sm text-muted-foreground">Expenses by category · {scopeLabel}</p>
          </CardHeader>
          <CardContent>
            <CategoryDonutChart
              data={donutData}
              total={donutData.reduce((s, d) => s + d.value, 0)}
              centerLabel={mode === "month" ? "This month" : "This year"}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Income vs expenses</CardTitle>
            <p className="text-sm text-muted-foreground">
              {mode === "month" ? "Rolling 12 months" : `Each month of ${yearKey}`}
            </p>
          </CardHeader>
          <CardContent>
            <IncomeExpenseBars data={monthlyBars} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {mode === "month" ? (
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Daily spending rhythm</CardTitle>
              <p className="text-sm text-muted-foreground">Each day of {scopeLabel}</p>
            </CardHeader>
            <CardContent>
              <DailyExpenseArea data={dailyArea} />
            </CardContent>
          </Card>
        ) : (
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Year at a glance</CardTitle>
              <p className="text-sm text-muted-foreground">Compare categories across the year</p>
            </CardHeader>
            <CardContent>
              <CategoryDonutChart
                data={donutData}
                total={donutData.reduce((s, d) => s + d.value, 0)}
                centerLabel="Spent this year"
              />
            </CardContent>
          </Card>
        )}

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-amber-500" /> Largest expenses
            </CardTitle>
            <p className="text-sm text-muted-foreground">Top 5 in {scopeLabel}</p>
          </CardHeader>
          <CardContent>
            {topExpenses.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No expenses recorded for this period.
              </p>
            ) : (
              <ol className="space-y-3">
                {topExpenses.map((t, i) => (
                  <li key={t.id} className="flex items-center gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <CategoryIcon category={t.category} className="size-8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.description || t.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category} · {t.date.slice(0, 10)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(t.amount)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
