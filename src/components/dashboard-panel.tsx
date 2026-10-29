"use client"

import { useMemo, useState } from "react"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { addDays, addMonths, addYears, format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/stat-card"
import { TransactionList } from "@/components/transaction-list"
import { CategoryDonutChart, DailyExpenseArea, IncomeExpenseBars } from "@/components/charts"
import { formatCurrency, localDayKey, localMonthKey } from "@/lib/format"
import { categoryMeta, type Budget, type Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"

type Granularity = "daily" | "monthly" | "yearly"

interface DashboardPanelProps {
  transactions: Transaction[] | undefined
  budgets: Budget[] | undefined
  onEdit: (t: Transaction) => void
  onViewAll: () => void
  onGoToBudgets: () => void
}

export function DashboardPanel({
  transactions,
  budgets,
  onEdit,
  onViewAll,
  onGoToBudgets,
}: DashboardPanelProps) {
  const [granularity, setGranularity] = useState<Granularity>("monthly")
  const [anchor, setAnchor] = useState<Date>(() => new Date())

  const loading = !transactions

  const periodStats = useMemo(() => {
    if (!transactions) return null
    const dayKey = localDayKey(anchor)
    const monthKey = localMonthKey(anchor)
    const yearKey = String(anchor.getFullYear())

    const inPeriod = transactions.filter((t) => {
      if (granularity === "daily") return t.date.slice(0, 10) === dayKey
      if (granularity === "monthly") return t.date.slice(0, 7) === monthKey
      return t.date.slice(0, 4) === yearKey
    })

    const income = inPeriod.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expense = inPeriod.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    const count = inPeriod.length

    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

    return { income, expense, count, totalIncome, totalExpense, balance: totalIncome - totalExpense }
  }, [transactions, granularity, anchor])

  const donutData = useMemo(() => {
    if (!transactions) return []
    const dayKey = localDayKey(anchor)
    const monthKey = localMonthKey(anchor)
    const yearKey = String(anchor.getFullYear())

    const buckets = new Map<string, number>()
    for (const t of transactions) {
      if (t.type !== "expense") continue
      const match =
        granularity === "daily"
          ? t.date.slice(0, 10) === dayKey
          : granularity === "monthly"
            ? t.date.slice(0, 7) === monthKey
            : t.date.slice(0, 4) === yearKey
      if (!match) continue
      buckets.set(t.category, (buckets.get(t.category) ?? 0) + t.amount)
    }
    return [...buckets.entries()]
      .map(([name, value]) => ({ name, value, color: categoryMeta(name).color }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, granularity, anchor])

  const trendData = useMemo(() => {
    if (!transactions) return []
    if (granularity === "yearly") {
      const year = anchor.getFullYear()
      const months: { label: string; income: number; expense: number }[] = []
      for (let m = 0; m < 12; m++) {
        const monthKey = `${year}-${String(m + 1).padStart(2, "0")}`
        let income = 0
        let expense = 0
        for (const t of transactions) {
          if (t.date.slice(0, 7) !== monthKey) continue
          if (t.type === "income") income += t.amount
          else expense += t.amount
        }
        months.push({ label: format(new Date(year, m, 1), "MMM"), income, expense })
      }
      return months
    }

    if (granularity === "daily") {
      const days: { label: string; income: number; expense: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = addDays(anchor, -i)
        const key = localDayKey(d)
        let income = 0
        let expense = 0
        for (const t of transactions) {
          if (t.date.slice(0, 10) !== key) continue
          if (t.type === "income") income += t.amount
          else expense += t.amount
        }
        days.push({ label: format(d, "EEE d"), income, expense })
      }
      return days
    }

    // Monthly → daily expense area
    const year = anchor.getFullYear()
    const month = anchor.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: { label: string; amount: number }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      let amount = 0
      for (const t of transactions) {
        if (t.type !== "expense") continue
        if (t.date.slice(0, 10) === key) amount += t.amount
      }
      days.push({ label: String(d), amount })
    }
    return days
  }, [transactions, granularity, anchor])

  // Budget overview uses the real current month
  const budgetOverview = useMemo(() => {
    if (!budgets || !transactions) return null
    const monthKey = localMonthKey(new Date())
    const monthBudgets = budgets.filter((b) => b.month === monthKey)
    const budgetTotal = monthBudgets.reduce((s, b) => s + b.amount, 0)
    const spent = transactions
      .filter((t) => t.type === "expense" && t.date.slice(0, 7) === monthKey)
      .reduce((s, t) => s + t.amount, 0)
    return { budgetTotal, spent, remaining: budgetTotal - spent, count: monthBudgets.length }
  }, [budgets, transactions])

  const periodLabel =
    granularity === "daily"
      ? format(anchor, "EEE, MMM d, yyyy")
      : granularity === "monthly"
        ? format(anchor, "MMMM yyyy")
        : format(anchor, "yyyy")

  function shiftPeriod(dir: -1 | 1) {
    setAnchor((prev) =>
      granularity === "daily"
        ? addDays(prev, dir)
        : granularity === "monthly"
          ? addMonths(prev, dir)
          : addYears(prev, dir)
    )
  }

  function jumpToNow() {
    setAnchor(new Date())
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftPeriod(-1)} aria-label="Previous period">
            <ChevronLeft className="size-4" />
          </Button>
          <button
            onClick={jumpToNow}
            className="min-w-44 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
            title="Jump to today"
          >
            {periodLabel}
          </button>
          <Button variant="outline" size="icon" onClick={() => shiftPeriod(1)} aria-label="Next period">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={loading ? "—" : formatCurrency(periodStats?.balance ?? 0)}
          subtitle="All-time income minus expenses"
          icon={<Wallet className="size-5" />}
        />
        <StatCard
          title="Income"
          value={loading ? "—" : formatCurrency(periodStats?.income ?? 0)}
          subtitle={loading ? undefined : `${periodStats?.count ?? 0} transactions this period`}
          icon={<TrendingUp className="size-5" />}
          tone="income"
        />
        <StatCard
          title="Expenses"
          value={loading ? "—" : formatCurrency(periodStats?.expense ?? 0)}
          subtitle={loading ? undefined : `Net ${formatCurrency((periodStats?.income ?? 0) - (periodStats?.expense ?? 0))}`}
          icon={<TrendingDown className="size-5" />}
          tone="expense"
        />

        {/* Budget mini-card */}
        <Card className="py-5">
          <CardContent className="px-5">
            {loading || !budgetOverview ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : budgetOverview.count === 0 ? (
              <div className="flex h-full flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                    <PiggyBank className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">No budgets yet</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Set monthly limits to track your spending.
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={onGoToBudgets}>
                  Set budgets <ArrowRight className="size-4" />
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">{format(new Date(), "MMMM")} budget</p>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      budgetOverview.remaining < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {budgetOverview.remaining < 0
                      ? `${formatCurrency(Math.abs(budgetOverview.remaining))} over`
                      : `${formatCurrency(budgetOverview.remaining)} left`}
                  </span>
                </div>
                <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                  {formatCurrency(budgetOverview.spent)}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {formatCurrency(budgetOverview.budgetTotal)} budget
                </p>
                <Progress
                  className={cn(
                    "mt-3 h-2",
                    budgetOverview.spent > budgetOverview.budgetTotal
                      ? "[&_[data-slot=progress-indicator]]:bg-destructive"
                      : "[&_[data-slot=progress-indicator]]:bg-emerald-500"
                  )}
                  value={Math.min(100, (budgetOverview.spent / budgetOverview.budgetTotal) * 100)}
                  aria-label="Budget usage"
                />
                <button
                  onClick={onGoToBudgets}
                  className="mt-2 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                >
                  Manage budgets
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Spending by category</CardTitle>
            <p className="text-sm text-muted-foreground">
              {granularity === "daily" ? "For this day" : granularity === "monthly" ? "For this month" : "For this year"}
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full rounded-xl" />
            ) : (
              <CategoryDonutChart
                data={donutData}
                total={donutData.reduce((s, d) => s + d.value, 0)}
                centerLabel={granularity === "daily" ? "Today" : granularity === "monthly" ? "This month" : "This year"}
              />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">
              {granularity === "daily"
                ? "Last 7 days"
                : granularity === "monthly"
                  ? "Daily spending"
                  : "Income vs expenses"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {granularity === "daily"
                ? "Income and expenses per day"
                : granularity === "monthly"
                  ? `Each day of ${format(anchor, "MMMM yyyy")}`
                  : `Monthly totals in ${format(anchor, "yyyy")}`}
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : granularity === "monthly" ? (
              <DailyExpenseArea data={trendData as { label: string; amount: number }[]} />
            ) : (
              <IncomeExpenseBars data={trendData as { label: string; income: number; expense: number }[]} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent transactions</CardTitle>
            <p className="text-sm text-muted-foreground">Your latest entries across all periods</p>
          </div>
          <Button variant="outline" size="sm" onClick={onViewAll}>
            View all <ArrowRight className="size-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <TransactionList
              transactions={(transactions ?? []).slice(0, 6)}
              onEdit={onEdit}
              emptyTitle="No transactions yet"
              emptyDescription="Add your first income or expense to see it here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
