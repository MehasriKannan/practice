"use client"

import {
  Briefcase,
  Building2,
  Car,
  Clapperboard,
  Ellipsis,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  MoreHorizontal,
  Plane,
  Plug,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Utensils,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { categoryMeta } from "@/lib/types"

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  car: Car,
  "shopping-bag": ShoppingBag,
  home: Home,
  plug: Plug,
  clapperboard: Clapperboard,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  plane: Plane,
  ellipsis: Ellipsis,
  briefcase: Briefcase,
  laptop: Laptop,
  "building-2": Building2,
  "trending-up": TrendingUp,
  gift: Gift,
}

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const meta = categoryMeta(category)
  const Icon = ICONS[meta.icon] ?? MoreHorizontal
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        className
      )}
      style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
    >
      <Icon className="size-4" />
    </span>
  )
}

export function categoryColor(name: string): string {
  return categoryMeta(name).color
}
