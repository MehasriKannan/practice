"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useCreateTransaction,
  useUpdateTransaction,
  type TransactionInput,
} from "@/hooks/use-finance"
import { categoriesFor, type Transaction, type TransactionType } from "@/lib/types"
import { localDayKey } from "@/lib/format"
import { cn } from "@/lib/utils"

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, the dialog edits this transaction; otherwise it creates a new one. */
  transaction?: Transaction | null
}

export function TransactionDialog({ open, onOpenChange, transaction }: TransactionDialogProps) {
  const isEditing = Boolean(transaction)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Keyed by the transaction id so the form state resets for each open/edit target.
            Radix unmounts content when closed, which also resets state between opens. */}
        <TransactionForm
          key={transaction?.id ?? "new"}
          transaction={transaction}
          isEditing={isEditing}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  )
}

function TransactionForm({
  transaction,
  isEditing,
  onOpenChange,
}: {
  transaction?: Transaction | null
  isEditing: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()

  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense")
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "")
  const [category, setCategory] = useState(transaction?.category ?? "")
  const [date, setDate] = useState(transaction ? transaction.date.slice(0, 10) : localDayKey(new Date()))
  const [description, setDescription] = useState(transaction?.description ?? "")
  const [error, setError] = useState<string | null>(null)

  const categories = useMemo(() => categoriesFor(type), [type])
  const pending = createMutation.isPending || updateMutation.isPending

  function handleTypeChange(next: TransactionType) {
    setType(next)
    // Reset the category if it does not exist under the new type
    if (category && !categoriesFor(next).some((c) => c.name === category)) {
      setCategory("")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Please enter a valid amount greater than zero.")
      return
    }
    if (!category || !categoriesFor(type).some((c) => c.name === category)) {
      setError("Please choose a category.")
      return
    }
    if (!date) {
      setError("Please pick a date.")
      return
    }

    const input: TransactionInput = {
      type,
      amount: Math.round(parsed * 100) / 100,
      category,
      description: description.trim(),
      date,
    }

    if (isEditing && transaction) {
      updateMutation.mutate(
        { id: transaction.id, ...input },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(input, {
        onSuccess: () => onOpenChange(false),
      })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit transaction" : "Add transaction"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update the details of this transaction."
            : "Record a new income or expense entry."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Tabs value={type} onValueChange={(v) => handleTypeChange(v as TransactionType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tx-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="tx-amount"
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
          <div className="space-y-2">
            <Label htmlFor="tx-date">Date</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tx-category">Category</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger id="tx-category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
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
          <Label htmlFor="tx-description">Description</Label>
          <Textarea
            id="tx-description"
            placeholder="e.g. Grocery run at the market (optional)"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className={cn(type === "income" ? "bg-emerald-600 hover:bg-emerald-700" : "", "min-w-28")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : isEditing ? "Save changes" : "Add transaction"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
