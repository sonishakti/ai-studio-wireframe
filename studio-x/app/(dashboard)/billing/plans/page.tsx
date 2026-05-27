"use client"

import * as React from "react"
import { Check, Bot, Radio, MessageSquare, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"
import { track, Events } from "@/lib/analytics"

// Recovers the lost Figma sub-views — old AccountSidebar nested "View all
// plans" → Agent Studio · RTC Pre-paid · Signaling · Chat. We collapsed
// those into one /billing/plans destination, but the product-specific plan
// tiers still need surfacing. Filter pattern keeps the page clean while
// preserving the IA. (/evaluate Issue 12)

type Product = "all" | "agent-studio" | "rtc-prepaid" | "signaling" | "chat"

const PRODUCTS: { id: Product; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all",          label: "All Products",  icon: Bot           },
  { id: "agent-studio", label: "Agent Studio",  icon: Bot           },
  { id: "rtc-prepaid",  label: "RTC Pre-paid",  icon: Radio         },
  { id: "signaling",    label: "Signaling",     icon: MessageSquare },
  { id: "chat",         label: "Chat",          icon: MessageCircle },
]

type Plan = {
  product: Exclude<Product, "all">
  name: string
  price: string
  period: string
  description: string
  badge: string | null
  cta: string
  ctaDisabled: boolean
  features: string[]
  highlighted?: boolean
}

const PLANS: Plan[] = [
  // ── Agent Studio (the Studio_X core product) ──────────────────────────────
  { product: "agent-studio", name: "Free",      price: "$0",   period: "/ month", description: "For individuals exploring voice AI.",                badge: "Current",  cta: "Current plan",     ctaDisabled: true,  features: ["5 agents", "200 min / month", "1 phone number", "Basic metrics", "Email support"] },
  { product: "agent-studio", name: "Pro",       price: "$99",  period: "/ month", description: "For teams building production agents.",              badge: "Popular",  cta: "Upgrade to Pro",   ctaDisabled: false, highlighted: true, features: ["Unlimited agents", "10,000 min / month", "10 phone numbers", "Advanced metrics + monitor", "Telephony campaigns", "Priority support", "Audit logs"] },
  { product: "agent-studio", name: "Enterprise",price: "Custom",period: "",        description: "Large deployments with SLA requirements.",          badge: null,        cta: "Contact Sales",    ctaDisabled: false, features: ["Unlimited everything", "Custom minute pool", "Dedicated support", "SLA guarantee", "SSO / SAML", "On-premise option"] },

  // ── RTC Pre-paid (pay-as-you-go voice/video minutes) ──────────────────────
  { product: "rtc-prepaid", name: "Starter",    price: "$50",  period: "credit",  description: "Pre-pay for voice & video minutes.",                badge: null,        cta: "Buy credits",      ctaDisabled: false, features: ["~50K voice minutes", "~15K video SD minutes", "Pay-as-you-go after credit", "Email support"] },
  { product: "rtc-prepaid", name: "Volume",     price: "$500", period: "credit",  description: "Better unit pricing at higher volume.",              badge: "Best value",cta: "Buy credits",      ctaDisabled: false, highlighted: true, features: ["~600K voice minutes", "~200K video SD minutes", "Priority routing", "Slack support"] },

  // ── Signaling (presence + pub/sub messaging) ──────────────────────────────
  { product: "signaling",   name: "Free",       price: "$0",   period: "/ month", description: "Up to 100 concurrent peers.",                       badge: "Current",   cta: "Current plan",     ctaDisabled: true,  features: ["100 concurrent peers", "1M messages / month", "Email support"] },
  { product: "signaling",   name: "Scale",      price: "$199", period: "/ month", description: "Production-scale signaling.",                       badge: null,        cta: "Upgrade",          ctaDisabled: false, features: ["10K concurrent peers", "Unlimited messages", "99.99% uptime SLA", "Priority support"] },

  // ── Chat (in-app messaging) ──────────────────────────────────────────────
  { product: "chat",        name: "Free",       price: "$0",   period: "/ month", description: "1,000 MAU.",                                         badge: "Current",   cta: "Current plan",     ctaDisabled: true,  features: ["1,000 monthly active users", "Threaded conversations", "Basic moderation", "Email support"] },
  { product: "chat",        name: "Growth",     price: "$149", period: "/ month", description: "For growing communities.",                          badge: null,        cta: "Upgrade",          ctaDisabled: false, features: ["50,000 MAU", "Server-side moderation", "Translation API", "Priority support"] },
]

export default function PlansPage() {
  const [product, setProduct] = React.useState<Product>("all")

  const visible = product === "all" ? PLANS : PLANS.filter((p) => p.product === product)

  // Group plans by product when showing all, otherwise just flat
  const grouped =
    product === "all"
      ? PRODUCTS.slice(1).map((p) => ({ product: p, plans: PLANS.filter((pl) => pl.product === p.id) }))
      : [{ product: PRODUCTS.find((p) => p.id === product)!, plans: visible }]

  React.useEffect(() => { track(Events.plan_compared, { product }) }, [product])

  return (
    <main className="flex-1 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Choose a Plan</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Each Agora product has its own plans. Pick a product or browse all.
        </p>
      </div>

      {/* Product filter — recovers the lost sub-views */}
      <ToggleGroup
        type="single"
        value={product}
        onValueChange={(v) => v && setProduct(v as Product)}
        className="justify-start flex-wrap"
      >
        {PRODUCTS.map((p) => (
          <ToggleGroupItem key={p.id} value={p.id} className="gap-1.5 data-[state=on]:bg-accent">
            <p.icon className="h-3.5 w-3.5" />
            <span className="text-xs">{p.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Grouped plan cards */}
      <div className="space-y-8">
        {grouped.map(({ product: p, plans }) => (
          <section key={p.id}>
            {product === "all" && (
              <div className="flex items-center gap-2 mb-3">
                <p.icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">{p.label}</h3>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={`${plan.product}-${plan.name}`} className={plan.highlighted ? "border-primary shadow-md" : ""}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      {plan.badge && (
                        <Badge variant={plan.highlighted ? "default" : "secondary"} className="text-[10px]">
                          {plan.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tracking-tight">{plan.price}</span>
                      {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                    </div>
                    <CardDescription className="text-xs">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1.5 pb-4">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={plan.highlighted ? "default" : "outline"}
                      className="w-full"
                      disabled={plan.ctaDisabled}
                      size="sm"
                      onClick={() => {
                        track(Events.plan_upgraded, { product: plan.product, plan: plan.name } as Record<string, unknown>)
                        toast.success(`${plan.cta} — mock`, {
                          description: `In production this would open ${plan.name === "Enterprise" ? "a sales contact form" : "the upgrade checkout"}.`,
                        })
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
