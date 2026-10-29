"use client"

import { useEffect, useMemo, useState } from "react"
import { addMonths, format } from "date-fns"
import { ChevronLeft, ChevronRight, PiggyBank, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryIcon } from "@/components/category-icon"
import { useDeleteBudget, useUpsertBudget } from "@/hooks/use-finance"
import { formatCurrency, localMonthKey } from "@/lib/format"
import { EXPENSE_CATEGORIES, type Budget, type Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"

interface BudgetPanelProps {
  budgets: Budget[] | undefined
  transactions: Transaction[] | undefined
}

function progressTone(ratio: number): { bar: string; text: string } {
  if (ratio >= 1)
    return { bar: "[&_[data-slot=progress-indicator]]:bg-destructive", text: "text-destructive" }
  if (ratio >= 0.8)
    return {
      bar: "[&_[data-slot=progress-indicator]]:bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    }
  return {
    bar: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  }
}

export function BudgetPanel({ budgets, transactions }: BudgetPanelProps) {
  const [month, setMonth] = useState(() => localMonthKey(new Date()))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [deleting, setDeleting] = useState<Budget | null>(null)

  const deleteMutation = useDeleteBudget()

  const monthBudgets = useMemo(
    () => (budgets ?? []).filter((b) => b.month === month),
    [budgets, month]
  )

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()
    if (transactions) {
      for (const t of transactions) {
        if (t.type !== "expense") continue
        if (t.date.slice(0, 7) !== month) continue
        map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
      }
    }
    return map
  }, [transactions, month])

  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = [...spentByCategory.values()].reduce((s, v) => s + v, 0)
  const overallRatio = totalBudget > 0 ? totalSpent / totalBudget : 0
  const overallTone = progressTone(overallRatio)

  const unbudgetedCategories = EXPENSE_CATEGORIES.filter(
    (c) => !monthBudgets.some((b) => b.category === c.name)
  )

  const loading = !budgets || !transactions

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonth((m) => localMonthKey(addMonths(new Date(`${m}-01T00:00:00`), -1)))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-36 text-center text-sm font-semibold">{format(new Date(`${month}-01T00:00:00`), "MMMM yyyy")}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonth((m) => localMonthKey(addMonths(new Date(`${m}-01T00:00:00`), 1)))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          disabled={unbudgetedCategories.length === 0 && !monthBudgets.length}
          title={unbudgetedCategories.length === 0 ? "Every expense category already has a budget" : undefined}
        >
          <Plus className="size-4" /> Add budget
        </Button>
      </div>

      {/* Overall summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PiggyBank className="size-5 text-primary" /> Monthly budget overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-2.5 w-full" />
            </div>
          ) : monthBudgets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
              <p className="text-sm font-medium">No budgets for {format(new Date(`${month}-01T00:00:00`), "MMMM yyyy")}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Set limits per category to see how your spending compares throughout the month.
              </p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => {
                  setEditing(null)
                  setDialogOpen(true)
                }}
              >
                <Plus className="size-4" /> Create your first budget
              </Button>
            </div>
          ) : (
            <div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total budget</p>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalBudget)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className={cn("text-2xl font-bold tabular-nums", totalSpent > totalBudget && "text-destructive")}>
                    {formatCurrency(totalSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {totalBudget - totalSpent >= 0 ? "Remaining" : "Over budget"}
                  </p>
                  <p className={cn("text-2xl font-bold tabular-nums", overallTone.text)}>
                    {formatCurrency(Math.abs(totalBudget - totalSpent))}
                  </p>
                </div>
              </div>
              <Progress
                className={cn("mt-4 h-2.5", overallTone.bar)}
                value={Math.min(100, overallRatio * 100)}
                aria-label="Overall budget usage"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {Math.round(overallRatio * 100)}% of the monthly budget used ·{" "}
                {totalSpent > totalBudget
                  ? "You are over budget — consider trimming discretionary spending."
                  : overallRatio >= 0.8
                    ? "You are approaching your budget limit."
                    : "Spending is within the planned limits."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-category budgets */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : monthBudgets.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {monthBudgets
            .slice()
            .sort((a, b) => {
              const ra = (spentByCategory.get(a.category) ?? 0) / a.amount
              const rb = (spentByCategory.get(b.category) ?? 0) / b.amount
              return rb - ra
            })
            .map((b) => {
              const spent = spentByCategory.get(b.category) ?? 0
              const ratio = spent / b.amount
              const tone = progressTone(ratio)
              const remaining = b.amount - spent
              return (
                <Card key={b.id} className="py-4">
                  <CardContent className="space-y-3 px-5">
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={b.category} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{b.category}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(spent)} of {formatCurrency(b.amount)}
                        </p>
                      </div>
                      <span className={cn("shrink-0 text-xs font-semibold tabular-nums", tone.text)}>
                        {Math.round(ratio * 100)}%
                      </span>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Edit ${b.category} budget`}
                          onClick={() => {
                            setEditing(b)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          aria-label={`Delete ${b.category} budget`}
                          onClick={() => setDeleting(b)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Progress className={cn("h-2", tone.bar)} value={Math.min(100, ratio * 100)} />
                    <p className={cn("text-xs", tone.text)}>
                      {remaining >= 0
                        ? `${formatCurrency(remaining)} remaining this month`
                        : `Over by ${formatCurrency(Math.abs(remaining))}`}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      ) : null}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <BudgetForm
            key={editing?.id ?? "new"}
            month={month}
            editing={editing}
            unbudgetedCategories={unbudgetedCategories}
            onSuccess={() => {
              setDialogOpen(false)
              setEditing(null)
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this budget?</AlertDialogTitle>
            <AlertDialogDescription>
              The {deleting?.category} budget of {deleting ? formatCurrency(deleting.amount) : ""} will be
              removed. Your transactions are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleting) deleteMutation.mutate(deleting.id)
                setDeleting(null)
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Over-budget banner for accessibility/visibility */}
      {!loading && totalBudget > 0 && totalSpent > totalBudget ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <TriangleAlert className="size-4 shrink-0" />
          Total spending this month exceeds the combined budget by{" "}
          {formatCurrency(totalSpent - totalBudget)}.
        </div>
      ) : null}
    </div>
  )
}

function BudgetForm({
  month,
  editing,
  unbudgetedCategories,
  onSuccess,
  onCancel,
}: {
  month: string
  editing: Budget | null
  unbudgetedCategories: { name: string; color: string }[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const upsertMutation = useUpsertBudget()
  const [category, setCategory] = useState(editing?.category ?? "")
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = Number(amount)
    if (!category) {
      setError("Please choose a category.")
      return
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Please enter a budget amount greater than zero.")
      return
    }
    upsertMutation.mutate(
      { month, category, amount: Math.round(parsed * 100) / 100 },
      { onSuccess }
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit budget" : "Add budget"}</DialogTitle>
        <DialogDescription>
          Monthly spending limit for {format(new Date(`${month}-01T00:00:00`), "MMMM yyyy")}.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="budget-category">Category</Label>
          <Select value={category} onValueChange={setCategory} disabled={Boolean(editing)} required>
            <SelectTrigger id="budget-category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {(editing ? EXPENSE_CATEGORIES : unbudgetedCategories).map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                      aria-hidden="true"
                    />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget-amount">Monthly limit</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="budget-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="pl-7"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={upsertMutation.isPending} className="min-w-24">
            {editing ? "Save changes" : "Add budget"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
