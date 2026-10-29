"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  tone?: "default" | "income" | "expense"
  className?: string
}

export function StatCard({ title, value, subtitle, icon, tone = "default", className }: StatCardProps) {
  return (
    <Card className={cn("py-5", className)}>
      <CardContent className="flex items-start justify-between gap-3 px-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          {subtitle ? (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            tone === "income" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
            tone === "expense" && "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
            tone === "default" && "bg-primary/10 text-primary"
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      </CardContent>
    </Card>
  )
}
