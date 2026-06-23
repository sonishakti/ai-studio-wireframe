"use client"

import * as React from "react"
import Link from "next/link"
import {
  Code2, Copy, ExternalLink, Smartphone, Monitor, Cpu, Frame, Bot,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AGENTS } from "@/lib/campaign-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { markActivationStep } from "@/components/activation-checklist"

// ─── Code — the single export surface (2026-06-11, replaces Embed/Code) ──────
//
// Industry-grounded platform set (Vapi: Web/React/iOS/Flutter/React Native
// clients + TS/Python/Go/Java servers; LiveKit: Python/Node agents + Browser/
// Swift/Android/Flutter/RN clients). The iframe embed is ONE snippet here,
// not a peer surface — per user direction, Deploy offers "Code", full stop.

type PlatformId =
  | "web" | "react" | "swift" | "kotlin" | "flutter" | "reactnative"
  | "curl" | "node" | "python" | "go"

const CLIENT_PLATFORMS: { id: PlatformId; label: string }[] = [
  { id: "web", label: "Web (JS)" },
  { id: "react", label: "React" },
  { id: "swift", label: "iOS · Swift" },
  { id: "kotlin", label: "Android · Kotlin" },
  { id: "flutter", label: "Flutter" },
  { id: "reactnative", label: "React Native" },
]

const SERVER_PLATFORMS: { id: PlatformId; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
]

function snippetsFor(agentId: string): Record<PlatformId, { language: string; install: string; code: string }> {
  return {
    web: {
      language: "JavaScript",
      install: "npm install agora-rtc-sdk-ng agora-studio-x",
      code: `import { connectAgent } from "agora-studio-x"

const session = await connectAgent({
  appId:   process.env.AGORA_APP_ID,
  agentId: "${agentId}",
  token:   await fetchToken(),  // your token server
})

session.on("transcript", (text) => console.log("Agent:", text))
session.on("end",        () => console.log("Call ended"))`,
    },
    react: {
      language: "TypeScript · React",
      install: "npm install @agora/studio-x-react",
      code: `import { useAgent } from "@agora/studio-x-react"

export function SupportCall() {
  const { start, stop, transcript, status } = useAgent({
    agentId: "${agentId}",
    token:   fetchToken,
  })

  return (
    <button onClick={status === "idle" ? start : stop}>
      {status === "idle" ? "Talk to agent" : "End call"}
    </button>
  )
}`,
    },
    swift: {
      language: "Swift",
      install: "pod 'AgoraRtcEngine_iOS'\npod 'AgoraStudioX'",
      code: `import AgoraStudioX

let session = try await StudioX.connectAgent(
  appId:   "YOUR_APP_ID",
  agentId: "${agentId}",
  token:   try await fetchToken()
)

session.onTranscript = { text in print("Agent:", text) }`,
    },
    kotlin: {
      language: "Kotlin",
      install: `implementation("io.agora:rtc-sdk:4.3.2")
implementation("io.agora:studio-x:1.0.0")`,
      code: `val session = StudioX.connectAgent(
  appId   = BuildConfig.AGORA_APP_ID,
  agentId = "${agentId}",
  token   = fetchToken(),
)

session.onTranscript { text -> Log.d("Agent", text) }`,
    },
    flutter: {
      language: "Dart · Flutter",
      install: "flutter pub add agora_studio_x",
      code: `final session = await StudioX.connectAgent(
  appId:   const String.fromEnvironment('AGORA_APP_ID'),
  agentId: '${agentId}',
  token:   await fetchToken(),
);

session.onTranscript.listen((text) => debugPrint('Agent: \$text'));`,
    },
    reactnative: {
      language: "TypeScript · React Native",
      install: "npm install @agora/studio-x-react-native",
      code: `import { useAgent } from "@agora/studio-x-react-native"

const { start, stop, status } = useAgent({
  agentId: "${agentId}",
  token:   fetchToken,
})`,
    },
    curl: {
      language: "cURL · REST",
      install: "# No SDK — direct HTTP",
      code: `curl -X POST https://api.agora.io/studio/v2/calls \\
  -H "Authorization: Bearer $AGORA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "${agentId}",
    "to":       "+14155550199"
  }'`,
    },
    node: {
      language: "TypeScript · Node",
      install: "npm install @agora/studio-x-server",
      code: `import { StudioX } from "@agora/studio-x-server"

const studio = new StudioX({ token: process.env.AGORA_TOKEN })

const call = await studio.calls.create({
  agentId: "${agentId}",
  to:      "+14155550199",
})`,
    },
    python: {
      language: "Python",
      install: "pip install agora-studio-x",
      code: `from agora_studio_x import StudioX

studio = StudioX(token=os.environ["AGORA_TOKEN"])

call = studio.calls.create(
    agent_id="${agentId}",
    to="+14155550199",
)`,
    },
    go: {
      language: "Go",
      install: "go get github.com/agora/studio-x-go",
      code: `studio := studiox.New(os.Getenv("AGORA_TOKEN"))

call, err := studio.Calls.Create(ctx, &studiox.CallParams{
    AgentID: "${agentId}",
    To:      "+14155550199",
})`,
    },
  }
}

const iframeSnippet = (agentId: string) =>
  `<iframe
  src="https://studio.agora.io/embed/${agentId}?token=PUBLIC_TOKEN"
  width="400" height="600"
  allow="microphone"
></iframe>`

export default function DeployCodePage() {
  const [agentId, setAgentId] = React.useState(AGENTS[0].id)
  const [platform, setPlatform] = React.useState<PlatformId>("web")

  // Pre-fill the agent when arriving from the Deploy chooser (?agent=…).
  React.useEffect(() => {
    const a = new URLSearchParams(window.location.search).get("agent")
    if (a && AGENTS.some((x) => x.id === a)) setAgentId(a)
  }, [])

  const snippets = snippetsFor(agentId)
  const s = snippets[platform]

  const handleCopy = (text: string, what = "Copied to clipboard") => {
    navigator.clipboard?.writeText(text)
    toast.success(what)
  }

  return (
    <div className="flex flex-col flex-1">
      <main className="flex-1 p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Code</h2>
          <p className="text-sm text-muted-foreground">
            Export your agent to any stack — client SDKs for in-app voice, server SDKs
            to start and control calls.
          </p>
        </div>

        {/* Agent + quick actions (Figma 04_Deploy_Future_scope pattern) */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5 w-64">
            <Label className="text-sm font-medium">Agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENTS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => handleCopy(iframeSnippet(agentId), "iframe snippet copied")}
          >
            <Frame className="h-3.5 w-3.5" /> Copy as iframe
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => handleCopy(agentId, "Agent ID copied")}
          >
            <Bot className="h-3.5 w-3.5" /> Copy agent ID
          </Button>
        </div>

        {/* Platform pills — Client vs Server groups */}
        <div className="space-y-3">
          <PlatformGroup
            icon={Monitor}
            label="Client — your UI, the agent talks in-app"
            platforms={CLIENT_PLATFORMS}
            active={platform}
            onPick={setPlatform}
          />
          <PlatformGroup
            icon={Cpu}
            label="Server — start & control calls from your backend"
            platforms={SERVER_PLATFORMS}
            active={platform}
            onPick={setPlatform}
          />
        </div>

        {/* Snippets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">1. Install</CardTitle>
            <CardDescription>{s.language}</CardDescription>
          </CardHeader>
          <CardContent>
            <SnippetBlock text={s.install} onCopy={() => handleCopy(s.install)} />
          </CardContent>
        </Card>

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
            <SnippetBlock text={s.code} onCopy={() => handleCopy(s.code)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">3. Credentials</CardTitle>
            <CardDescription>
              App ID + Certificate in Project Settings · Service Accounts for server-to-server auth.
            </CardDescription>
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
              Shipped your integration? Mark this deployment as done.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                markActivationStep("deploy")
                toast.success("Marked as deployed via code")
              }}
            >
              Mark deployed
            </Button>
          </CardContent>
        </Card>

        {/* References */}
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

// ─── subcomponents ───────────────────────────────────────────────────────────

function PlatformGroup({
  icon: Icon,
  label,
  platforms,
  active,
  onPick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  platforms: { id: PlatformId; label: string }[]
  active: PlatformId
  onPick: (p: PlatformId) => void
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground w-64 shrink-0">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 overflow-x-auto">
        {platforms.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.id)}
            className={cn(
              "rounded px-2.5 h-7 text-xs font-medium transition-colors whitespace-nowrap",
              active === p.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SnippetBlock({ text, onCopy }: { text: string; onCopy: () => void }) {
  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 h-7 px-2 text-xs"
        onClick={onCopy}
      >
        <Copy className="h-3 w-3 mr-1" /> Copy
      </Button>
      <pre className="font-mono text-xs bg-muted/50 rounded-md p-4 pr-16 overflow-x-auto whitespace-pre-wrap">
        <code>{text}</code>
      </pre>
    </div>
  )
}
