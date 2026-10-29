export type TransactionType = "income" | "expense"

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  description: string
  /** ISO string — always normalized to "yyyy-MM-dd" on the client via toDayKey */
  date: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  month: string // "yyyy-MM"
  category: string
  amount: number
}

export interface CategoryMeta {
  name: string
  color: string
  icon: string
}

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { name: "Food & Dining", color: "#f97316", icon: "utensils" },
  { name: "Groceries", color: "#22c55e", icon: "shopping-cart" },
  { name: "Transport", color: "#eab308", icon: "car" },
  { name: "Shopping", color: "#ec4899", icon: "shopping-bag" },
  { name: "Housing", color: "#a855f7", icon: "home" },
  { name: "Utilities", color: "#14b8a6", icon: "plug" },
  { name: "Entertainment", color: "#f43f5e", icon: "clapperboard" },
  { name: "Health", color: "#ef4444", icon: "heart-pulse" },
  { name: "Education", color: "#8b5cf6", icon: "graduation-cap" },
  { name: "Travel", color: "#84cc16", icon: "plane" },
  { name: "Other", color: "#64748b", icon: "ellipsis" },
]

export const INCOME_CATEGORIES: CategoryMeta[] = [
  { name: "Salary", color: "#10b981", icon: "briefcase" },
  { name: "Freelance", color: "#059669", icon: "laptop" },
  { name: "Business", color: "#65a30d", icon: "building-2" },
  { name: "Investments", color: "#d946ef", icon: "trending-up" },
  { name: "Gifts", color: "#f59e0b", icon: "gift" },
  { name: "Other Income", color: "#64748b", icon: "ellipsis" },
]

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

export function categoriesFor(type: TransactionType): CategoryMeta[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

export function categoryMeta(name: string): CategoryMeta {
  return (
    ALL_CATEGORIES.find((c) => c.name === name) ?? {
      name,
      color: "#94a3b8",
      icon: "ellipsis",
    }
  )
}

/** Extract the calendar-day key "yyyy-MM-dd" from an ISO date string (UTC-stable). */
export function toDayKey(iso: string): string {
  return iso.slice(0, 10)
}

/** "yyyy-MM" month key */
export function toMonthKey(iso: string): string {
  return iso.slice(0, 7)
}

/** "yyyy" year key */
export function toYearKey(iso: string): string {
  return iso.slice(0, 4)
}
