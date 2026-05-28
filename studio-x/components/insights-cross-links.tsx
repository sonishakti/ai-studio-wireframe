import Link from "next/link"
import { Activity, PhoneCall, Gauge, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Cross-link surface for the Insights group — Monitor, Calls, Usage.
// Reinforces the "what happened in this project?" mental model by giving
// each page a wayfinding footer to its two siblings.

const ALL = [
  {
    id: "monitor",
    href: "/monitor",
    label: "Monitor",
    description: "Live performance — completion rate, latency, errors",
    icon: Activity,
  },
  {
    id: "calls",
    href: "/calls",
    label: "Calls",
    description: "Drill into individual call & session history",
    icon: PhoneCall,
  },
  {
    id: "usage",
    href: "/usage",
    label: "Usage",
    description: "Consumption against quotas — Agent Minutes, Video, Audio",
    icon: Gauge,
  },
] as const

type Source = (typeof ALL)[number]["id"]

export function InsightsCrossLinks({ source }: { source: Source }) {
  const siblings = ALL.filter((s) => s.id !== source)
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Related views
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {siblings.map((s) => (
          <Card key={s.id} className="hover:border-foreground/30 transition-colors">
            <Link href={s.href}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
