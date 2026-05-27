import { CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const LICENSES = [
  { feature: "Voice Agent (Basic)", description: "Up to 5 agents, 200 min/mo", included: true, plan: "Free" },
  { feature: "Voice Agent (Pro)", description: "Unlimited agents, 10,000 min/mo", included: false, plan: "Pro" },
  { feature: "Cloud Recording", description: "Record all channels to cloud", included: false, plan: "Add-on" },
  { feature: "Telephony (Outbound)", description: "Outbound campaign dialing", included: false, plan: "Pro" },
  { feature: "AI Noise Cancellation", description: "Deep learning noise removal", included: false, plan: "Add-on" },
  { feature: "Real-Time Transcription", description: "Live speech-to-text", included: true, plan: "Free (limited)" },
]

export default function LicensingPage() {
  return (
    <main className="flex-1 p-6 space-y-4 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Feature entitlements for your current plan.
      </p>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Current Plan: Free</CardTitle>
              <Button size="sm">Upgrade to Pro</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            {LICENSES.map((lic, i) => (
              <div key={lic.feature}>
                <div className="flex items-center gap-3 py-3">
                  {lic.included
                    ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${!lic.included ? "text-muted-foreground" : ""}`}>{lic.feature}</p>
                    <p className="text-xs text-muted-foreground">{lic.description}</p>
                  </div>
                  <Badge variant={lic.included ? "default" : "outline"}>{lic.plan}</Badge>
                </div>
                {i < LICENSES.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
    </main>
  )
}
