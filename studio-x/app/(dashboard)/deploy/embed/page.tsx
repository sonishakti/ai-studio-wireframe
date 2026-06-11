import Link from "next/link"
import { Globe, Terminal, ArrowRight } from "lucide-react"
import { DeployNav } from "@/components/deploy-nav"

export const metadata = {
  title: "Embed / Code — Deploy",
}

// Embed / Code — the non-telephony placement surface. Folds the old standalone
// Web Widget + API & SDK tabs into one intent: "put the agent somewhere".
const OPTIONS = [
  {
    href: "/deploy/embed/widget",
    icon: Globe,
    title: "Web widget",
    description: "Drop a chat/voice widget into your site with one snippet.",
    bullets: ["iFrame embed", "Appearance & greeting", "Allowed domains"],
  },
  {
    href: "/deploy/embed/api",
    icon: Terminal,
    title: "API & SDK",
    description: "Server-to-server or in-app integration with token auth.",
    bullets: ["REST API", "Web / iOS / Android SDKs", "Service credentials"],
  },
]

export default function EmbedHubPage() {
  return (
    <div className="flex flex-col flex-1">
      <DeployNav />
      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Put your agent in your product</h2>
            <p className="text-sm text-muted-foreground">
              Self-serve placement — no phone number required.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <Link
                  key={opt.href}
                  href={opt.href}
                  className="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">{opt.title}</h3>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                  <ul className="space-y-1 pt-1">
                    {opt.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
