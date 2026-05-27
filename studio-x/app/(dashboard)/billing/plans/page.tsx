import { Check, Zap } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/ month",
    description: "For individuals exploring voice AI.",
    badge: "Current",
    cta: "Current plan",
    ctaDisabled: true,
    features: ["5 agents", "200 min / month", "1 phone number", "Basic analytics", "Email support"],
  },
  {
    name: "Pro",
    price: "$99",
    period: "/ month",
    description: "For teams building production agents.",
    badge: "Popular",
    cta: "Upgrade to Pro",
    ctaDisabled: false,
    features: ["Unlimited agents", "10,000 min / month", "10 phone numbers", "Advanced analytics", "Telephony campaigns", "Priority support", "Audit logs"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large deployments with SLA requirements.",
    badge: null,
    cta: "Contact Sales",
    ctaDisabled: false,
    features: ["Unlimited everything", "Custom minute pool", "Dedicated support", "SLA guarantee", "SSO / SAML", "Custom contracts", "On-premise option"],
  },
]

export default function PlansPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Billing", href: "/billing" }, { label: "Plans" }]}
        title="Choose a Plan"
        description="Upgrade to unlock more agents, minutes, and features."
      />
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={plan.name === "Pro" ? "border-primary shadow-md" : ""}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {plan.badge && (
                    <Badge variant={plan.name === "Pro" ? "default" : "secondary"}>{plan.badge}</Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                </div>
                <CardDescription className="text-xs">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button
                  variant={plan.name === "Pro" ? "default" : "outline"}
                  className="w-full"
                  disabled={plan.ctaDisabled}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
