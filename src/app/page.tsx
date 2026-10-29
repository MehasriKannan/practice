"use client"

import { useState } from "react"
import { Plus, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { TransactionDialog } from "@/components/transaction-dialog"
import { DashboardPanel } from "@/components/dashboard-panel"
import { TransactionsPanel } from "@/components/transactions-panel"
import { BudgetPanel } from "@/components/budget-panel"
import { AnalysisPanel } from "@/components/analysis-panel"
import { useBudgets, useTransactions } from "@/hooks/use-finance"
import type { Transaction } from "@/lib/types"

type TabKey = "dashboard" | "transactions" | "budgets" | "analysis"

export default function Home() {
  const { data: transactions, isLoading: txLoading } = useTransactions()
  const { data: budgets } = useBudgets()

  const [tab, setTab] = useState<TabKey>("dashboard")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  function openAdd() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(t: Transaction) {
    setEditing(t)
    setDialogOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white"
              aria-hidden="true"
            >
              <Wallet className="size-5" />
            </span>
            <div className="leading-tight">
              <h1 className="text-base font-bold tracking-tight sm:text-lg">Expense Tracker</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Track income, expenses and budgets — saved locally
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openAdd} size="sm" className="h-9">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add transaction</span>
              <span className="sr-only sm:hidden">Add transaction</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="space-y-6">
          <TabsList className="h-auto w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <DashboardPanel
              transactions={transactions}
              budgets={budgets}
              onEdit={openEdit}
              onViewAll={() => setTab("transactions")}
              onGoToBudgets={() => setTab("budgets")}
            />
          </TabsContent>

          <TabsContent value="transactions" className="mt-0">
            <TransactionsPanel
              transactions={transactions}
              onEdit={openEdit}
              onAdd={openAdd}
            />
          </TabsContent>

          <TabsContent value="budgets" className="mt-0">
            <BudgetPanel budgets={budgets} transactions={transactions} />
          </TabsContent>

          <TabsContent value="analysis" className="mt-0">
            <AnalysisPanel transactions={transactions} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-1 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>Expense Tracker — your data is saved locally and persists across restarts.</p>
          <p>
            {txLoading ? "Loading…" : `${transactions?.length ?? 0} transactions stored`}
          </p>
        </div>
      </footer>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editing}
      />
    </div>
  )
}
