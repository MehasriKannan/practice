"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { CategoryIcon } from "@/components/category-icon"
import { useDeleteTransaction } from "@/hooks/use-finance"
import { formatCurrency, formatDayKey, formatDayKeyRelative } from "@/lib/format"
import type { Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TransactionRowProps {
  transaction: Transaction
  onEdit: (t: Transaction) => void
  showDate?: boolean
}

export function TransactionRow({ transaction: t, onEdit, showDate = true }: TransactionRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteMutation = useDeleteTransaction()
  const isIncome = t.type === "income"

  return (
    <div className="flex items-center gap-3 py-2.5">
      <CategoryIcon category={t.category} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {t.description || t.category}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {t.category}
          {showDate ? ` · ${formatDayKeyRelative(t.date.slice(0, 10))}` : ""}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
        )}
      >
        {isIncome ? "+" : "−"}
        {formatCurrency(t.amount)}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label={`Actions for ${t.description || t.category}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(t)}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{t.description || t.category}&rdquo; ({formatCurrency(t.amount)} on{" "}
              {formatDayKey(t.date.slice(0, 10))}) will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(t.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (t: Transaction) => void
  /** Group entries under day headings */
  grouped?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export function TransactionList({
  transactions,
  onEdit,
  grouped = false,
  emptyTitle = "No transactions found",
  emptyDescription = "Try adjusting the filters, or add a new transaction to get started.",
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-6 py-12 text-center">
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  if (!grouped) {
    return (
      <div className="divide-y">
        {transactions.map((t) => (
          <TransactionRow key={t.id} transaction={t} onEdit={onEdit} />
        ))}
      </div>
    )
  }

  // Group by calendar day
  const groups = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const key = t.date.slice(0, 10)
    const list = groups.get(key) ?? []
    list.push(t)
    groups.set(key, list)
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([day, items]) => {
        const dayTotal = items.reduce(
          (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
          0
        )
        return (
          <div key={day}>
            <div className="mb-1 flex items-baseline justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {formatDayKeyRelative(day)}
                <span className="ml-2 font-normal normal-case tracking-normal">
                  {formatDayKey(day)}
                </span>
              </p>
              <p
                className={cn(
                  "text-xs font-medium tabular-nums",
                  dayTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                )}
              >
                {dayTotal >= 0 ? "+" : "−"}
                {formatCurrency(Math.abs(dayTotal))}
              </p>
            </div>
            <div className="divide-y rounded-lg border bg-card px-3">
              {items.map((t) => (
                <TransactionRow key={t.id} transaction={t} onEdit={onEdit} showDate={false} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
