"use client"

import * as React from "react"
import { use } from "react"
import Link from "next/link"
import { ExternalLink, Copy, Download, ChevronDown } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

// ─── Extension detail — ONE scroll (2026-06-12 simplification) ───────────────
//
// Was: User Guide | Activation tabs (Figma 448:37619 / 466:17852) on top of a
// page that itself had Documentation/API/Changelog + Plans/Projects tab
// clusters — activation was buried. Now everything reads top-to-bottom:
// overview → plan & pricing → projects → installation guide, with a sticky
// "More info" rail. No tabs.

const EXTENSION_INFO = {
  name: "Face AR Effects",
  vendor: "Deepar.ai",
  description: "Add 3D face masks, filters, background removal and other AR experiences to your app via Agora's Video SDK.",
  initials: "AR",
  color: "bg-red-700",
  version: "1.0.4",
  updated: "2025-10-14",
  platforms: ["Web", "macOS", "iOS"],
  features: [
    "Real-time 3D face mask and filter overlays",
    "Background removal and virtual background replacement",
    "Face beautification (smoothing, tone correction)",
    "Emotion detection and pose estimation",
    "Low-latency GPU pipeline — <2 ms processing overhead",
  ],
  gallery: [
    { label: "Face Masks", tone: "bg-violet-500/20 text-violet-700 dark:text-violet-300" },
    { label: "AR Filters", tone: "bg-sky-500/20 text-sky-700 dark:text-sky-300" },
    { label: "AI Touch-Up", tone: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" },
  ],
  changelog: [
    { version: "1.0.4", date: "2025-10-14", text: "Performance improvements; reduced GPU memory footprint by 30%." },
    { version: "1.0.3", date: "2025-08-01", text: "Added virtual background replacement. Fixed crash on Safari 17." },
    { version: "1.0.0", date: "2025-04-12", text: "Initial release." },
  ],
}

const INSTALL_STEPS = [
  {
    title: "Install the packages",
    body: "Download and install the extension alongside the Agora RTC SDK:",
    code: "npm install agora-extension-face-ar agora-rtc-sdk-ng",
  },
  {
    title: "Register the extension",
    body: "Initialise the SDK in your application and register the extension:",
    code: `import FaceARExtension from 'agora-extension-face-ar';
AgoraRTC.registerExtensions([new FaceARExtension()]);`,
  },
]

export default function ExtensionDetailPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  use(params)
  const ext = EXTENSION_INFO

  const [projects, setProjects] = React.useState([
    { name: "My first project", enabled: true },
    { name: "Acme Production", enabled: true },
    { name: "Acme Staging", enabled: false },
    { name: "Q3 Pilot", enabled: false },
  ])
  const [changelogOpen, setChangelogOpen] = React.useState(false)

  const toggleProject = (name: string, on: boolean) => {
    setProjects((ps) => ps.map((p) => (p.name === name ? { ...p, enabled: on } : p)))
    toast.success(`${ext.name} ${on ? "enabled" : "disabled"} for ${name}`)
  }

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title={ext.name}
        description={`by ${ext.vendor}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Go to Docs <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Button>
            <Button variant="outline" size="sm">
              Partner Website <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Button>
            <Button size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download for Web
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          {/* ─── ONE SCROLL ─────────────────────────────────────── */}
          <div className="space-y-5 min-w-0">
            {/* 1 · Overview */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white font-semibold shrink-0 ${ext.color}`}>
                    {ext.initials}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{ext.description}</p>
                </div>

                {/* Gallery strip */}
                <div className="grid grid-cols-3 gap-3">
                  {ext.gallery.map((g) => (
                    <div
                      key={g.label}
                      className={`flex h-24 items-end rounded-lg p-3 text-sm font-semibold ${g.tone}`}
                    >
                      {g.label}
                    </div>
                  ))}
                </div>

                <ul className="text-sm space-y-1.5 pl-5 list-disc text-muted-foreground">
                  {ext.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </CardContent>
            </Card>

            {/* 2 · Plan & pricing — the action, no longer behind a tab */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Plan &amp; pricing
                </p>
                <p className="text-sm text-muted-foreground">
                  Start with pay-as-you-go pricing, or contact support for volume discounts
                  and billing options.
                </p>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-medium">Pay as you go</p>
                    <p className="text-base font-bold mt-0.5">
                      $1.50 <span className="text-xs text-muted-foreground font-normal">/ 1000 mins</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/help/contact">Contact Support</Link>
                    </Button>
                    <Button size="sm" onClick={() => toast.success(`${ext.name} activated`, { description: "Enable it per project below." })}>
                      Buy and Activate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3 · Projects — toggles, in the same scroll */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Projects
                </p>
                <p className="text-sm text-muted-foreground">
                  Enable {ext.name} for the following projects:
                </p>
                <div>
                  {projects.map((p, i) => (
                    <React.Fragment key={p.name}>
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-sm">{p.name}</span>
                        <Switch checked={p.enabled} onCheckedChange={(on) => toggleProject(p.name, on)} />
                      </div>
                      {i < projects.length - 1 && <Separator />}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 4 · Installation guide */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Installation guide
                </p>
                {INSTALL_STEPS.map((step, i) => (
                  <div key={step.title} className="space-y-2">
                    <p className="text-sm font-semibold">Step {i + 1} · {step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.body}</p>
                    <div className="relative rounded-lg border bg-muted/50 p-3 font-mono text-xs whitespace-pre">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7"
                        onClick={() => copy(step.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <code>{step.code}</code>
                    </div>
                  </div>
                ))}

                {/* Changelog — collapsed, not a tab */}
                <button
                  type="button"
                  onClick={() => setChangelogOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium">Changelog</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${changelogOpen ? "rotate-180" : ""}`} />
                </button>
                {changelogOpen && (
                  <div className="space-y-3 pl-1">
                    {ext.changelog.map((c) => (
                      <div key={c.version} className="text-sm">
                        <p className="font-medium">
                          v{c.version} <span className="text-muted-foreground font-normal">· {c.date}</span>
                        </p>
                        <p className="text-muted-foreground mt-0.5">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── STICKY RAIL — More info ─────────────────────────── */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardContent className="p-4 space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  More info
                </p>
                <div>
                  <p className="text-xs text-muted-foreground">Version</p>
                  <p className="text-sm font-medium mt-0.5 tabular-nums">v{ext.version}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Supported Platforms</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ext.platforms.map((p) => (
                      <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium mt-0.5 tabular-nums">{ext.updated}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vendor</p>
                  <p className="text-sm font-medium mt-0.5">{ext.vendor}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
