"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"
import type { Budget, Transaction, TransactionType } from "@/lib/types"

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? "Something went wrong.")
  }
  return json as T
}

export interface TransactionInput {
  type: TransactionType
  amount: number
  category: string
  description: string
  date: string // "yyyy-MM-dd"
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const data = await fetchJson<{ transactions: Transaction[] }>("/api/transactions")
      return data.transactions
    },
  })
}

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const data = await fetchJson<{ budgets: Budget[] }>("/api/budgets")
      return data.budgets
    },
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TransactionInput) =>
      fetchJson<{ transaction: Transaction }>("/api/transactions", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] })
      toast({ title: "Transaction added", description: "Your transaction has been saved." })
    },
    onError: (e: Error) => toast({ title: "Could not add transaction", description: e.message, variant: "destructive" }),
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: TransactionInput & { id: string }) =>
      fetchJson<{ transaction: Transaction }>(`/api/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] })
      toast({ title: "Transaction updated", description: "Changes have been saved." })
    },
    onError: (e: Error) => toast({ title: "Could not update transaction", description: e.message, variant: "destructive" }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] })
      toast({ title: "Transaction deleted" })
    },
    onError: (e: Error) => toast({ title: "Could not delete transaction", description: e.message, variant: "destructive" }),
  })
}

export interface BudgetInput {
  month: string
  category: string
  amount: number
}

export function useUpsertBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BudgetInput) =>
      fetchJson<{ budget: Budget }>("/api/budgets", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] })
      toast({ title: "Budget saved" })
    },
    onError: (e: Error) => toast({ title: "Could not save budget", description: e.message, variant: "destructive" }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchJson<{ ok: boolean }>(`/api/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] })
      toast({ title: "Budget removed" })
    },
    onError: (e: Error) => toast({ title: "Could not remove budget", description: e.message, variant: "destructive" }),
  })
}
