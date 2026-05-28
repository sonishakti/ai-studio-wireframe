"use client"

import * as React from "react"
import Link from "next/link"
import { Bot, Mic, Phone, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Sparkline } from "@/components/sparkline"
import { MetricCard, MetricSection } from "@/components/metric-section"

// ─── Get-started callouts (LiveKit pattern, but Agora-flavored copy) ─────

const GET_STARTED = [
  {
    id: "agents",
    title: "Build an AI Agent",
    description: "Pick a template, configure your agent, and deploy it in minutes.",
    href: "/agents",
    icon: Bot,
  },
  {
    id: "voice-quickstart",
    title: "Voice Calling quickstart",
    description: "Add real-time voice to your app using the Agora Voice SDK.",
    href: "/realtime-services",
    icon: Mic,
  },
  {
    id: "telephony",
    title: "Add a phone number",
    description: "Let your agent make and receive PSTN calls via Telephony.",
    href: "/campaigns",
    icon: Phone,
  },
]

const DISMISS_KEY = "sx:home:get-started-dismissed"

// ─── component ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const [dismissed, setDismissed] = React.useState(false)
  const [period, setPeriod] = React.useState("7d")

  // STUB — in production this comes from the project record
  // Secured mode is on by default for new projects — only legacy projects
  // need the migration warning, and that path is handled elsewhere.
  const securedModeEnabled = true

  React.useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1")
  }, [])

  const dismissGetStarted = () => {
    setDismissed(true)
    window.localStorage.setItem(DISMISS_KEY, "1")
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Overview"
        actions={
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground tabular-nums hidden md:block">
              Last updated <span className="font-medium text-foreground">8 mins</span> ago
            </p>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Auto-refresh
            </Button>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Past 24 hours</SelectItem>
                <SelectItem value="7d">Past 7 days</SelectItem>
                <SelectItem value="30d">Past 30 days</SelectItem>
                <SelectItem value="90d">Past 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-8">
        {/* ─── Get started callouts ─────────────────────────────────────── */}
        {!dismissed && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold tracking-tight">Get started</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7"
                onClick={dismissGetStarted}
              >
                Dismiss
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {GET_STARTED.map((g) => (
                <Link
                  key={g.id}
                  href={g.href}
                  className="group rounded-lg border bg-card p-4 hover:border-foreground/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 bg-muted">
                      <g.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{g.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">{g.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── Project health — App Cert + connection — Agora-native ───── */}
        <MetricSection title="Project health">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Secured mode"
              value={securedModeEnabled ? "Active" : "Disabled"}
              sub={securedModeEnabled ? "App Certificate enabled" : "Required for production"}
            />
            <MetricCard
              label="Connection success rate"
              value="—"
              mute
            />
            <MetricCard
              label="SDK platforms in use"
              value="—"
              mute
            />
            <MetricCard
              label="Top regions"
              value="—"
              mute
            />
          </div>
        </MetricSection>

        {/* ─── Channels — Agora's term for "rooms" (sessions where users join) */}
        <MetricSection title="Channels">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="Total channel sessions"
              value="0"
              chart={<Sparkline data={[0, 0, 0, 0, 0, 0, 0]} />}
            />
            <MetricCard
              label="Peak concurrent users"
              value="0"
              sub="Across all channels"
            />
            <MetricCard
              label="Avg session duration"
              value="0"
              unit="secs"
            />
          </div>
        </MetricSection>

        {/* ─── Voice & Video Minutes — Agora's billable units ──────────── */}
        <MetricSection title="Voice & Video minutes">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Audio minutes"
              value="42,190"
              unit="min"
              delta="+8%"
              deltaPositive
              chart={<Sparkline data={[2100, 2800, 3900, 6100, 9500, 14000, 19000]} stroke="hsl(var(--primary))" />}
            />
            <MetricCard
              label="Video SD"
              value="72,215"
              unit="min"
              chart={<Sparkline data={[1200, 1800, 2400, 5800, 11000, 17000, 23000]} stroke="hsl(var(--primary))" />}
            />
            <MetricCard
              label="Video HD"
              value="90,112"
              unit="min"
              chart={<Sparkline data={[800, 1100, 1900, 4200, 9800, 16500, 24000]} stroke="hsl(var(--primary))" />}
            />
            <MetricCard
              label="Video Full HD"
              value="60,018"
              unit="min"
              chart={<Sparkline data={[400, 600, 1000, 2200, 5500, 10000, 16500]} stroke="hsl(var(--primary))" />}
            />
          </div>
        </MetricSection>

        {/* ─── Conversational AI — agents ──────────────────────────────── */}
        <MetricSection title="Conversational AI">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="Agent minutes"
              value="18,420"
              unit="min"
              delta="+12%"
              deltaPositive
              chart={<Sparkline data={[120, 240, 380, 510, 820, 1290, 2150]} stroke="hsl(var(--primary))" />}
            />
            <MetricCard
              label="Concurrent agent sessions"
              value="12"
              sub="Peak 28 this week"
              chart={<Sparkline data={[3, 5, 4, 8, 6, 9, 12]} stroke="hsl(var(--primary))" />}
            />
            <MetricCard
              label="Avg end-to-end latency"
              value="612"
              unit="ms"
              sub="p50 across all agents"
            />
          </div>
        </MetricSection>

        {/* ─── Telephony — Agora's word, correct ──────────────────────── */}
        <MetricSection title="Telephony">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Total inbound minutes"  value="0" unit="min" />
            <MetricCard label="Total outbound minutes" value="0" unit="min" />
            <MetricCard label="Active SIP sessions"    value="0" />
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Inbound vs Outbound
              </p>
              <Sparkline
                data={[0, 0, 0, 0, 0, 0, 0]}
                axisLabels={["20 May", "22 May", "24 May", "26 May"]}
                height={120}
              />
            </CardContent>
          </Card>
        </MetricSection>

        {/* ─── Cloud Recording — Agora's term, not "Egress" ───────────── */}
        <MetricSection title="Cloud Recording">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Recording sessions"  value="0" />
            <MetricCard label="Storage used"        value="0" unit="GB" />
            <MetricCard label="Recorded duration"   value="0" unit="hrs" />
          </div>
        </MetricSection>

        {/* ─── Media Push & Pull — Agora's RTMP push/pull ─────────────── */}
        <MetricSection title="Media Push & Pull">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Media Push streams"      value="0" />
            <MetricCard label="Media Push minutes"      value="0" unit="min" />
            <MetricCard label="Media Pull streams"      value="0" />
            <MetricCard label="Media Pull minutes"      value="0" unit="min" />
          </div>
        </MetricSection>

        {/* ─── Chat & Signaling ───────────────────────────────────────── */}
        <MetricSection title="Chat & Signaling">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Chat messages"        value="0" />
            <MetricCard label="Chat MAU"             value="0" />
            <MetricCard label="Signaling messages"   value="0" />
            <MetricCard label="Signaling peers"      value="0" />
          </div>
        </MetricSection>

        {/* ─── Bandwidth ──────────────────────────────────────────────── */}
        <MetricSection title="Bandwidth">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard label="Upstream"   value="0" unit="GB" />
            <MetricCard label="Downstream" value="0" unit="GB" />
          </div>
        </MetricSection>
      </main>
    </div>
  )
}
