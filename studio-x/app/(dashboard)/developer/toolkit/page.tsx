import { Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const SDKS = [
  { name: "Agora Voice SDK (Web)", lang: "JavaScript", version: "4.22.0", href: "#" },
  { name: "Agora Voice SDK (iOS)", lang: "Swift", version: "4.3.2", href: "#" },
  { name: "Agora Voice SDK (Android)", lang: "Kotlin", version: "4.3.2", href: "#" },
  { name: "Studio_X API Client", lang: "TypeScript", version: "0.5.0", href: "#" },
  { name: "Studio_X API Client", lang: "Python", version: "0.5.0", href: "#" },
]

const SAMPLES = [
  { name: "Basic Voice Call", description: "Minimal web SDK integration", href: "#" },
  { name: "AI Voice Agent Embed", description: "Embed a Studio_X agent in a web page", href: "#" },
  { name: "Outbound Campaign", description: "Server-side dialing with REST API", href: "#" },
]

export default function ToolkitPage() {
  return (
    <main className="flex-1 p-6 space-y-6">
      <p className="text-sm text-muted-foreground">
        Download SDKs, sample applications, and integration guides.
      </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">SDKs & Clients</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {SDKS.map((sdk) => (
                <div key={`${sdk.name}-${sdk.lang}`} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sdk.name}</p>
                    <p className="text-xs text-muted-foreground">{sdk.lang} · v{sdk.version}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><Download className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Sample Apps</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {SAMPLES.map((s) => (
                <div key={s.name} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><ExternalLink className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
      </div>
    </main>
  )
}
