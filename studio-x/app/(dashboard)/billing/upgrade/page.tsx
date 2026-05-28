"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle2, ChevronRight, CreditCard, Lock, ArrowLeft, ArrowRight, Sparkles,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { track, Events } from "@/lib/analytics"
import { cn } from "@/lib/utils"

// ─── Plan catalog — single source of truth for upgrade pricing ─────────────

type Plan = {
  id: string
  name: string
  price: number   // monthly USD
  description: string
  highlights: string[]
  recommended?: boolean
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 19,
    description: "For individuals scaling a side project.",
    highlights: ["10 agents", "500 min / month", "3 phone numbers", "All deployment channels"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    description: "For teams building production agents.",
    highlights: ["Unlimited agents", "10,000 min / month", "10 phone numbers", "Priority support", "Audit logs"],
    recommended: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 499,
    description: "For high-volume production workloads.",
    highlights: ["Unlimited everything", "100,000 min / month", "50 phone numbers", "24×7 support", "SSO / SAML"],
  },
]

const STEPS = [
  { id: "plan",    label: "Choose plan" },
  { id: "payment", label: "Add payment" },
  { id: "review",  label: "Review" },
  { id: "confirm", label: "Confirmed" },
] as const
type StepId = (typeof STEPS)[number]["id"]

// ─── component ───────────────────────────────────────────────────────────────

export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPlan = (searchParams.get("plan") as Plan["id"] | null) ?? "pro"

  const [step, setStep] = React.useState<StepId>(initialPlan ? "plan" : "plan")
  const [planId, setPlanId] = React.useState<Plan["id"]>(initialPlan)

  // Payment fields
  const [cardName, setCardName] = React.useState("")
  const [cardNumber, setCardNumber] = React.useState("")
  const [expiry, setExpiry] = React.useState("")
  const [cvc, setCvc] = React.useState("")
  const [country, setCountry] = React.useState("US")
  const [zip, setZip] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const plan = PLANS.find((p) => p.id === planId)!
  const stepIndex = STEPS.findIndex((s) => s.id === step)

  const goNext = () => {
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next.id)
  }
  const goBack = () => {
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev.id)
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    track(Events.plan_upgraded, { plan: plan.name, price: plan.price } as Record<string, unknown>)
    await new Promise((r) => setTimeout(r, 1200))
    setSubmitting(false)
    setStep("confirm")
    toast.success(`Upgraded to ${plan.name}`, {
      description: "Your new quota is active. Welcome!",
    })
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Step indicator */}
        <nav className="flex items-center gap-2 text-sm">
          {STEPS.map((s, i) => {
            const isDone = i < stepIndex || step === "confirm"
            const isCurrent = s.id === step
            return (
              <React.Fragment key={s.id}>
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isCurrent ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs font-mono tabular-nums",
                      isDone
                        ? "bg-emerald-500/15 text-emerald-600"
                        : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                )}
              </React.Fragment>
            )
          })}
        </nav>

        {/* ─── Step 1: Choose plan ─────────────────────────────────────── */}
        {step === "plan" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Choose your plan</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Cancel any time. Annual billing saves 20%.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map((p) => {
                const isSelected = p.id === planId
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlanId(p.id)}
                    className={cn(
                      "rounded-lg border bg-card p-5 text-left transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 shadow-md"
                        : "hover:border-foreground/30",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-base font-semibold">{p.name}</p>
                      {p.recommended && <Badge className="text-xs">Recommended</Badge>}
                    </div>
                    <p className="text-2xl font-bold tracking-tight mt-2">
                      ${p.price}<span className="text-xs text-muted-foreground font-normal">/mo</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                    <Separator className="my-3" />
                    <ul className="space-y-1.5">
                      {p.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-1.5 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" asChild>
                <Link href="/billing"><ArrowLeft className="h-4 w-4" /> Cancel</Link>
              </Button>
              <Button onClick={goNext}>
                Continue with {plan.name} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Payment ────────────────────────────────────────── */}
        {step === "payment" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Add payment method</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Charged ${plan.price}.00 today. Renews monthly until cancelled.
              </p>
            </div>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Card details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="card-name">Name on card</Label>
                  <Input id="card-name" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Shakti Soni" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card-number">Card number</Label>
                  <Input
                    id="card-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input id="expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM / YY" className="font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123" className="font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="zip">ZIP / Postcode</Label>
                    <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="94103" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/40 border-dashed">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  We use Stripe for payments. Your card details never touch our servers and are
                  PCI-DSS Level 1 protected.
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={goNext} disabled={!cardName || !cardNumber || !expiry || !cvc || !zip}>
                Review order <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Review ─────────────────────────────────────────── */}
        {step === "review" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Review your order</h1>
              <p className="text-sm text-muted-foreground mt-1">
                One last look before we charge your card.
              </p>
            </div>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Order summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{plan.name} plan</p>
                    <p className="text-xs text-muted-foreground">Monthly subscription · cancel any time</p>
                  </div>
                  <p className="text-base font-semibold tabular-nums">${plan.price}.00</p>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">${plan.price}.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax (estimated)</span>
                  <span className="tabular-nums">$0.00</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total due today</span>
                  <span className="text-xl font-semibold tabular-nums">${plan.price}.00</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Payment method</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{cardName}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    •••• •••• •••• {cardNumber.slice(-4) || "4242"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={goBack}>Edit</Button>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleConfirm} disabled={submitting} className="gap-2">
                {submitting ? "Charging card…" : (<><Lock className="h-4 w-4" /> Confirm and pay ${plan.price}</>)}
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Confirmation ───────────────────────────────────── */}
        {step === "confirm" && (
          <Card className="border-emerald-500/40 bg-emerald-500/5">
            <CardContent className="text-center py-12 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 mx-auto">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">You're on {plan.name} 🎉</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Your new quotas are active. We've emailed a receipt.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                <Button asChild>
                  <Link href="/usage">View new quota</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/billing/invoices">See receipt</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
