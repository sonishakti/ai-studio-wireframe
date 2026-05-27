import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const RELEASES = [
  {
    version: "2.8.0",
    date: "May 27, 2026",
    tag: "Latest",
    changes: [
      { type: "new", text: "Studio_X Next.js app launched — full dashboard with shadcn/ui" },
      { type: "new", text: "Unified Calls view merges telephony and realtime session history" },
      { type: "improved", text: "Agent editor now shows all 4 tabs: Prompt, Models, Actions, Advanced" },
      { type: "fixed", text: "Campaign timezone calculation off-by-one on DST boundaries" },
    ],
  },
  {
    version: "2.7.0",
    date: "May 20, 2026",
    tag: null,
    changes: [
      { type: "new", text: "Vendor Credentials page — manage LLM, TTS, STT API keys in one place" },
      { type: "new", text: "Extensions Marketplace — browse and install Agora add-ons" },
      { type: "improved", text: "Monitor page (formerly Analytics) refactored with tabbed overview / by-agent view" },
      { type: "fixed", text: "Phone number import modal now validates E.164 format" },
    ],
  },
  {
    version: "2.6.0",
    date: "May 10, 2026",
    tag: null,
    changes: [
      { type: "new", text: "Realtime Services moved to top-level navigation (was under Project)" },
      { type: "new", text: "Campaign progress bars and status badges" },
      { type: "improved", text: "Sidebar now collapsible for Telephony and Project groups" },
    ],
  },
]

const TYPE_COLORS: Record<string, string> = {
  new: "bg-emerald-500/10 text-emerald-600",
  improved: "bg-blue-500/10 text-blue-600",
  fixed: "bg-amber-500/10 text-amber-600",
}

export default function WhatsNewPage() {
  return (
    <main className="flex-1 p-6">
        <div className="max-w-2xl space-y-6">
          {RELEASES.map((release) => (
            <Card key={release.version}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base font-semibold">v{release.version}</CardTitle>
                  {release.tag && <Badge>{release.tag}</Badge>}
                  <span className="text-sm text-muted-foreground ml-auto">{release.date}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {release.changes.map((c, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-3 py-2.5 text-sm">
                      <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[c.type]}`}>
                        {c.type}
                      </span>
                      <span>{c.text}</span>
                    </div>
                    {i < release.changes.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
    </main>
  )
}
