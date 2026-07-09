"use client"

// X1 spend-lab — THROWAWAY variant harness (the /agents/proto convention:
// build N variants on one ?param= route + a floating switcher, judge, fold the
// winner into /billing, then DELETE this route and components/spend-lab/*).
// ?v=a|b|c picks the variant; ?s=<scenario id> picks the money-lifecycle state.

import * as React from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FlaskConical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { SCENARIOS } from "@/components/spend-lab/spec"
import { VariantA } from "@/components/spend-lab/variant-a"
import { VariantB } from "@/components/spend-lab/variant-b"
import { VariantC } from "@/components/spend-lab/variant-c"

const VARIANTS = {
  a: { label: "A · Consolidated card", Component: VariantA },
  b: { label: "B · Meter band + controls row", Component: VariantB },
  c: { label: "C · Compact meter + setup sheet", Component: VariantC },
} as const

type VariantKey = keyof typeof VARIANTS

function SpendLab() {
  const router = useRouter()
  const params = useSearchParams()

  const v = (params.get("v") ?? "a") as VariantKey
  const variant = VARIANTS[v] ?? VARIANTS.a
  const sId = params.get("s") ?? SCENARIOS[0].id
  const scenario = SCENARIOS.find((s) => s.id === sId) ?? SCENARIOS[0]

  function setParam(key: "v" | "s", value: string) {
    const next = new URLSearchParams(params.toString())
    next.set(key, value)
    router.replace(`/billing/spend-lab?${next.toString()}`)
  }

  return (
    <>
      <PageHeader
        title="Spend lab"
        description="X1 variant harness — judge round only, not a product surface."
      />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">throwaway harness</Badge>
            <span className="text-xs text-muted-foreground">{scenario.label}</span>
          </div>

          <variant.Component scenario={scenario} />

          {/* What a correct rendering of this state must communicate (from the SPEC) */}
          <div className="rounded-lg border bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Must communicate in this state
            </p>
            <ul className="mt-1.5 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
              {scenario.must.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Floating switcher — variant + lifecycle state */}
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card px-3 py-2 shadow-lg">
        {(Object.keys(VARIANTS) as VariantKey[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={key === v ? "default" : "ghost"}
            className="h-7 rounded-full px-3 text-xs uppercase"
            onClick={() => setParam("v", key)}
          >
            {key}
          </Button>
        ))}
        <Select value={scenario.id} onValueChange={(val) => setParam("s", val)}>
          <SelectTrigger className="h-7 w-64 rounded-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCENARIOS.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

export default function SpendLabPage() {
  return (
    <Suspense>
      <SpendLab />
    </Suspense>
  )
}
