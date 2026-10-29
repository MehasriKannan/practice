"use client"

import { Pie, PieChart, Bar, BarChart, Area, AreaChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { formatCurrency, formatCompact } from "@/lib/format"
import { cn } from "@/lib/utils"

/* ---------- Shared custom tooltip ---------- */

interface TipEntry {
  name?: string | number
  value?: number | string
  color?: string
  payload?: { fill?: string; color?: string }
}

interface ChartTipProps {
  active?: boolean
  payload?: TipEntry[]
  label?: string | number
  hideLabel?: boolean
}

export function ChartTip({ active, payload, label, hideLabel = false }: ChartTipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-32 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      {!hideLabel && label !== undefined ? (
        <p className="mb-1 font-medium">{label}</p>
      ) : null}
      <div className="grid gap-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: entry.color ?? entry.payload?.fill ?? "#94a3b8" }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums">
              {formatCurrency(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Category donut ---------- */

export interface CategorySlice {
  name: string
  value: number
  color: string
}

export function CategoryDonutChart({
  data,
  total,
  centerLabel = "Total spent",
}: {
  data: CategorySlice[]
  total: number
  centerLabel?: string
}) {
  if (total <= 0 || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No spending recorded for this period.
      </div>
    )
  }

  return (
    <div>
      <div className="relative mx-auto max-w-56">
        <ChartContainer config={{}} className="aspect-square max-h-56">
          <PieChart>
            <ChartTooltip content={<ChartTip hideLabel />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="95%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] leading-tight text-muted-foreground">{centerLabel}</span>
          <span className="text-lg font-bold tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>
      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
              aria-hidden="true"
            />
            <span className="truncate">{slice.name}</span>
            <span className="ml-auto shrink-0 font-medium tabular-nums">
              {formatCurrency(slice.value)}
              <span className="ml-1.5 text-muted-foreground">
                {Math.round((slice.value / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Income vs expense bars ---------- */

export interface TrendPoint {
  label: string
  income: number
  expense: number
}

export function IncomeExpenseBars({ data, className }: { data: TrendPoint[]; className?: string }) {
  return (
    <ChartContainer config={{}} className={cn("aspect-auto h-64 w-full", className)}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v: number) => formatCompact(v)}
        />
        <ChartTooltip cursor={{ fill: "rgba(128,128,128,0.12)" }} content={<ChartTip />} />
        <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  )
}

/* ---------- Daily expense area ---------- */

export interface DailyPoint {
  label: string
  amount: number
}

export function DailyExpenseArea({ data, className }: { data: DailyPoint[]; className?: string }) {
  return (
    <ChartContainer config={{}} className={cn("aspect-auto h-64 w-full", className)}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="dailyExpenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={20}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v: number) => formatCompact(v)}
        />
        <ChartTooltip cursor={{ stroke: "#f97316", strokeOpacity: 0.3 }} content={<ChartTip />} />
        <Area
          type="monotone"
          dataKey="amount"
          name="Spent"
          stroke="#f97316"
          strokeWidth={2}
          fill="url(#dailyExpenseFill)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}
