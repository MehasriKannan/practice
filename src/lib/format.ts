const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatSignedCurrency(value: number, type: "income" | "expense"): string {
  return `${type === "income" ? "+" : "-"}${currencyFormatter.format(Math.abs(value))}`
}

export function formatCompact(value: number): string {
  return `$${compactFormatter.format(value)}`
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

/** Parse a "yyyy-MM-dd" string into a local Date without timezone drift. */
export function parseDayKey(dayKey: string): Date {
  const [y, m, d] = dayKey.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Format a "yyyy-MM-dd" key for display, e.g. "Oct 29, 2026". */
export function formatDayKey(dayKey: string): string {
  return parseDayKey(dayKey).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** Short label for lists: "Today", "Yesterday", or "Oct 29". */
export function formatDayKeyRelative(dayKey: string): string {
  const date = parseDayKey(dayKey)
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  if (dayKey === todayKey) return "Today"
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`
  if (dayKey === yesterdayKey) return "Yesterday"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** "yyyy-MM" for the given date, using local time. */
export function localMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

/** "yyyy-MM-dd" for the given date, using local time. */
export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export function monthLabelShort(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" })
}
