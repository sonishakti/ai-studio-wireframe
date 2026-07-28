"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "@/lib/utils"

/**
 * RadioCardGroup / RadioCard — the builder's one selection-card idiom (Figma
 * direction 2026-07-14: lean cards, title + support line, a REAL radio circle
 * top-right). Replaces the ad-hoc aria-pressed buttons and ToggleGroup cards
 * that each restyled selection their own way. Radix RadioGroup gives radio
 * semantics + arrow-key navigation; the visible circle is decorative (the
 * Item itself carries role=radio).
 */

export function RadioCardGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-card-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

/** Multi-select sibling of RadioCard — same card anatomy, checkbox semantics
 *  (aria-pressed + a check indicator instead of the radio circle). Used by the
 *  Channel section's multi-select grid (2026-07-28 IA). */
export function ToggleCard({
  title,
  description,
  hint,
  pressed,
  onPressedChange,
  badge,
  disabled,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  hint?: string
  pressed: boolean
  onPressedChange: (on: boolean) => void
  /** Small trailing chip (e.g. "Soon") — renders beside the title. */
  badge?: React.ReactNode
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      title={hint}
      onClick={() => onPressedChange(!pressed)}
      data-state={pressed ? "on" : "off"}
      className={cn(
        "group relative flex min-w-0 flex-col items-start gap-1.5 rounded-lg border border-border bg-card p-4 pr-12 text-left shadow-xs outline-none transition-colors",
        "hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[state=on]:border-primary disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
          pressed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50",
        )}
      >
        <svg viewBox="0 0 12 12" className={cn("h-3 w-3 transition-transform", pressed ? "scale-100" : "scale-0")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6.5 4.5 9 10 3.5" />
        </svg>
      </span>
      <span className="flex items-center gap-2 text-sm font-medium leading-none">{title}{badge}</span>
      {description ? (
        <span className="text-sm leading-snug text-muted-foreground">{description}</span>
      ) : null}
    </button>
  )
}

export function RadioCard({
  title,
  description,
  hint,
  className,
  ...props
}: Omit<React.ComponentProps<typeof RadioGroupPrimitive.Item>, "title"> & {
  title: React.ReactNode
  description?: React.ReactNode
  /** Native tooltip (the HTML title attribute) — prose that didn't earn a line. */
  hint?: string
}) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-card"
      title={hint}
      className={cn(
        "group relative flex min-w-0 flex-col items-start gap-1.5 rounded-lg border border-border bg-card p-4 pr-12 text-left shadow-xs outline-none transition-colors",
        "hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[state=checked]:border-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/50 transition-colors group-data-[state=checked]:border-primary"
      >
        <span className="h-2.5 w-2.5 scale-0 rounded-full bg-primary transition-transform group-data-[state=checked]:scale-100 motion-reduce:transition-none" />
      </span>
      <span className="text-sm font-medium leading-none">{title}</span>
      {description ? (
        <span className="text-sm leading-snug text-muted-foreground">{description}</span>
      ) : null}
    </RadioGroupPrimitive.Item>
  )
}
