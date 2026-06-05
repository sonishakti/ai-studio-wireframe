"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Code2, Copy, ExternalLink, Smartphone, Monitor, Cpu } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DeployNav } from "@/components/deploy-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { markActivationStep } from "@/components/activation-checklist"

// ─── code snippets by platform ──────────────────────────────────────────────

const SNIPPETS: Record<string, { language: string; install: string; code: string }> = {
  web: {
    language: "JavaScript",
    install: "npm install agora-rtc-sdk-ng agora-studio-x",
    code: `import AgoraRTC from "agora-rtc-sdk-ng"
import { connectAgent } from "agora-studio-x"

const session = await connectAgent({
  appId:   process.env.AGORA_APP_ID,
  agentId: "agt_01",
  token:   await fetchToken(),  // your token server
})

session.on("transcript", (text) => console.log("Agent said:", text))
session.on("end",        () => console.log("Call ended"))`,
  },
  ios: {
    language: "Swift",
    install: "pod 'AgoraRtcEngine_iOS'\npod 'AgoraStudioX'",
    code: `import AgoraStudioX

let session = try await StudioX.connectAgent(
  appId:   "YOUR_APP_ID",
  agentId: "agt_01",
  token:   try await fetchToken()
)

session.onTranscript = { text in print("Agent said:", text) }
session.onEnd        = { print("Call ended") }`,
  },
  android: {
    language: "Kotlin",
    install: `implementation("io.agora:rtc-sdk:4.3.2")
implementation("io.agora:studio-x:1.0.0")`,
    code: `val session = StudioX.connectAgent(
  appId   = BuildConfig.AGORA_APP_ID,
  agentId = "agt_01",
  token   = fetchToken(),
)

session.onTranscript { text -> Log.d("Agent", text) }
session.onEnd        { Log.d("Agent", "Call ended") }`,
  },
  server: {
    language: "cURL",
    install: "# No SDK — direct HTTP",
    code: `curl -X POST https://api.agora.io/studio/v2/calls \\
  -H "Authorization: Bearer $AGORA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id":  "agt_01",
    "to":        "+14155550199",
    "metadata":  { "customer_id": "cust_42" }
  }'`,
  },
}

const PLATFORMS: { id: keyof typeof SNIPPETS; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "web",     label: "Web",          icon: Monitor    },
  { id: "ios",     label: "iOS",          icon: Smartphone },
  { id: "android", label: "Android",      icon: Smartphone },
  { id: "server",  label: "Server / API", icon: Cpu        },
]

// ─── component ───────────────────────────────────────────────────────────────

export default function DeployApiPage() {
  const [platform, setPlatform] = React.useState<keyof typeof SNIPPETS>("web")

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text)
    toast.success("Copied to clipboard")
  }

  const handleMarkDeployed = () => {
    markActivationStep("deploy")
    toast.success("Marked as deployed via API")
  }

  const s = SNIPPETS[platform]

  return (
    <div className="flex flex-col flex-1">
      <DeployNav />
      <PageHeader
        title="Deploy via Direct API"
        description="Embed your agent in your own app. Maximum flexibility, full control over the UI."
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/deploy"><ArrowRight className="h-3.5 w-3.5 rotate-180" /> All channels</Link>
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-5">
        {/* Platform picker */}
        <Tabs value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
          <TabsList>
            {PLATFORMS.map((p) => (
              <TabsTrigger key={p.id} value={p.id} className="gap-1.5">
                <p.icon className="h-3.5 w-3.5" />
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={platform} className="space-y-4 pt-4">
            {/* Step 1 — install */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">1. Install the SDK</CardTitle>
                <CardDescription>{s.language}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-7 px-2 text-xs"
                          onClick={() => handleCopy(s.install)}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <pre className="font-mono text-xs bg-muted/50 rounded-md p-4 pr-16 overflow-x-auto whitespace-pre-wrap">
                    <code>{s.install}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 — connect */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">2. Connect to your agent</CardTitle>
                <CardDescription>
                  Use a token issued from your backend.{" "}
                  <Link href="/developer/restful-api" className="underline hover:text-foreground">
                    Token API reference →
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-7 px-2 text-xs"
                          onClick={() => handleCopy(s.code)}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <pre className="font-mono text-xs bg-muted/50 rounded-md p-4 pr-16 overflow-x-auto">
                    <code>{s.code}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 — credentials */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">3. Get your credentials</CardTitle>
                <CardDescription>Use Project Settings for the App ID + Certificate. Service Accounts for server-to-server auth.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/project/settings">Project settings</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/developer/aa-credentials">Service accounts</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Mark deployed CTA */}
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground flex-1">
                  Shipped your integration? Mark this deployment as done so we can show your activation as complete.
                </p>
                <Button variant="outline" size="sm" onClick={handleMarkDeployed}>
                  Mark deployed
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reference */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">More references</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="outline" size="sm" className="justify-between" asChild>
              <Link href="/developer/restful-api">REST API reference <ExternalLink className="h-3 w-3" /></Link>
            </Button>
            <Button variant="outline" size="sm" className="justify-between" asChild>
              <Link href="/developer/webhooks">Webhooks <ExternalLink className="h-3 w-3" /></Link>
            </Button>
            <Button variant="outline" size="sm" className="justify-between" asChild>
              <Link href="/developer/toolkit">SDK downloads <ExternalLink className="h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
