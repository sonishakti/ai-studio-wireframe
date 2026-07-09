"use client"

// F-Eval eval-lab — THROWAWAY variant harness (?v=1|2|3, ?s=<scenario id>).
// Judged, winner folded into the builder Test step + Monitor + call-detail
// "save as test", then this route + components/eval-lab/* are DELETED.

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
import { SCENARIOS } from "@/components/eval-lab/spec"
import { Variant1 } from "@/components/eval-lab/variant-1"
import { Variant2 } from "@/components/eval-lab/variant-2"
import { Variant3 } from "@/components/eval-lab/variant-3"

const VARIANTS = {
  "1": { label: "1 · Suite table + drawer", Component: Variant1 },
  "2": { label: "2 · Conversation-first", Component: Variant2 },
  "3": { label: "3 · Confidence dashboard", Component: Variant3 },
} as const

type VariantKey = keyof typeof VARIANTS

function EvalLab() {
  const router = useRouter()
  const params = useSearchParams()

  const v = (params.get("v") ?? "1") as VariantKey
  const variant = VARIANTS[v] ?? VARIANTS["1"]
  const sId = params.get("s") ?? SCENARIOS[0].id
  const scenario = SCENARIOS.find((s) => s.id === sId) ?? SCENARIOS[0]

  function setParam(key: "v" | "s", value: string) {
    const next = new URLSearchParams(params.toString())
    next.set(key, value)
    router.replace(`/agents/eval-lab?${next.toString()}`)
  }

  return (
    <>
      <PageHeader
        title="Eval lab"
        description="F-Eval variant harness — judge round only, not a product surface."
      />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">throwaway harness</Badge>
            <span className="text-xs text-muted-foreground">{scenario.label}</span>
          </div>

          <variant.Component key={`${v}-${scenario.id}`} scenario={scenario} />

          <div className="rounded-lg border bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Must communicate in this scenario
            </p>
            <ul className="mt-1.5 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
              {scenario.must.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card px-3 py-2 shadow-lg">
        {(Object.keys(VARIANTS) as VariantKey[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={key === v ? "default" : "ghost"}
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => setParam("v", key)}
          >
            {key}
          </Button>
        ))}
        <Select value={scenario.id} onValueChange={(val) => setParam("s", val)}>
          <SelectTrigger className="h-7 w-80 rounded-full text-xs">
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

export default function EvalLabPage() {
  return (
    <Suspense>
      <EvalLab />
    </Suspense>
  )
}
