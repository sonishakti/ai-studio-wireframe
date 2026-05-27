"use client"

import * as React from "react"
import Link from "next/link"
import {
  KeyRound, Bot, Mic, Phone, ArrowRight, RefreshCw, X,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Sparkline } from "@/components/sparkline"
import { MetricCard, MetricSection } from "@/components/metric-section"
import { cn } from "@/lib/utils"

// ─── "Get started" callouts (replaces ActivationChecklist) ──────────────────
// LiveKit pattern: small dismissible link cards instead of a commitment widget.
// Less psychologically heavy — the user picks one path, ignores the rest.

const GET_STARTED = [
  {
    id: "project-keys",
    title: "Project API keys",
    description: "Create and manage access keys to integrate the SDK into your app.",
    href: "/project/settings",
    icon: KeyRound,
  },
  {
    id: "agents",
    title: "AI Agents",
    description: "Build and deploy multimodal and voice AI agents.",
    href: "/agents",
    icon: Bot,
  },
  {
    id: "voice-quickstart",
    title: "Voice AI quickstart",
    description: "Build your first voice AI agent in under 10 minutes.",
    href: "/agents",
    icon: Mic,
  },
  {
    id: "telephony",
    title: "Telephony integration",
    description: "Let your voice AI agent make and receive phone calls.",
    href: "/deploy/telephony",
    icon: Phone,
  },
]

const DISMISS_KEY = "sx:home:get-started-dismissed"

// ─── component ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const [dismissed, setDismissed] = React.useState(false)
  const [period, setPeriod] = React.useState("7d")

  // Read dismissed state from localStorage on mount
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
        {/* ─── Get started callouts (replaces checklist widget) ─────────── */}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {GET_STARTED.map((g) => (
                <Link
                  key={g.id}
                  href={g.href}
                  className="group rounded-lg border bg-card p-4 hover:border-foreground/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
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

        {/* ─── Activation banner — Connection metrics ───────────────────── */}
        <MetricSection title="Activation">
          <MetricCard label="Connection success" value="No data for the selected time range." mute />
          <MetricCard label="Platforms" value="No data for the selected time range." mute />
          <MetricCard label="Connection type" value="No data for the selected time range." mute />
          <MetricCard label="Top countries" value="No data for the selected time range." mute />
        </MetricSection>

        {/* ─── Participants ────────────────────────────────────────────── */}
        <MetricSection title="Participants">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard
              label="WebRTC Participant Minutes"
              value="0"
              unit="secs"
              chart={<Sparkline data={[0, 0, 0, 0, 0, 0, 0]} />}
            />
            <MetricCard
              label="Participant Minutes by Kind"
              value="No data for the selected time range."
              mute
            />
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Participants
              </p>
              <Sparkline
                data={[0.2, 0.5, 0.4, 0.8, 0.6, 0.9, 0.7]}
                axisLabels={["20 May", "21 May", "22 May", "23 May", "24 May", "25 May", "26 May"]}
                height={120}
              />
            </CardContent>
          </Card>
        </MetricSection>

        {/* ─── Agents ──────────────────────────────────────────────────── */}
        <MetricSection title="Agents">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard
              label="Agent Session Minutes"
              value="18,420"
              unit="mins"
              delta="+12%"
              deltaPositive
              chart={<Sparkline data={[120, 240, 380, 510, 820, 1290, 2150]} stroke="hsl(var(--primary))" />}
            />
            <MetricCard
              label="Concurrent Agent Sessions"
              value="12"
              delta="peak 28"
              chart={<Sparkline data={[3, 5, 4, 8, 6, 9, 12]} stroke="hsl(var(--primary))" />}
            />
          </div>
        </MetricSection>

        {/* ─── Telephony ────────────────────────────────────────────────── */}
        <MetricSection title="Telephony">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Minutes"
              value="0"
              unit="secs"
              sub="Inbound · Outbound · Total"
              chart={<Sparkline data={[0, 0, 0, 0, 0, 0, 0]} />}
            />
            <MetricCard label="Total Inbound" value="0" unit="secs" />
            <MetricCard label="Total Outbound" value="0" unit="secs" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_280px]">
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  SIP Sessions
                </p>
                <Sparkline
                  data={[0, 0, 0, 0, 0, 0, 0]}
                  axisLabels={["20 May", "22 May", "24 May", "26 May"]}
                  height={120}
                />
              </CardContent>
            </Card>
            <MetricCard label="Total SIP Sessions" value="0" />
          </div>
        </MetricSection>

        {/* ─── Data transfer ────────────────────────────────────────────── */}
        <MetricSection title="Data transfer">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard label="Total Upstream" value="0" unit="byte" />
            <MetricCard label="Total Downstream" value="0" unit="byte" />
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Data transfer
              </p>
              <Sparkline
                data={[0, 0, 0, 0, 0, 0, 0]}
                axisLabels={["20 May", "22 May", "24 May", "26 May"]}
                height={120}
              />
            </CardContent>
          </Card>
        </MetricSection>

        {/* ─── Rooms ────────────────────────────────────────────────────── */}
        <MetricSection title="Rooms">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Total Room Sessions"   value="0" />
            <MetricCard label="Average Room Size"     value="0" />
            <MetricCard label="Average Room Duration" value="0" unit="secs" />
          </div>
        </MetricSection>

        {/* ─── Egress ───────────────────────────────────────────────────── */}
        <MetricSection title="Egress">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Total Egress Count"           value="0" />
            <MetricCard label="Total Billable Egress Duration" value="0" unit="secs" />
            <MetricCard label="Total Track Egress Duration"    value="0" unit="secs" />
          </div>
        </MetricSection>

        {/* ─── Ingress ──────────────────────────────────────────────────── */}
        <MetricSection title="Ingress">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Total Ingress Count"             value="0" />
            <MetricCard label="Total Billable Ingress Duration"  value="0" unit="secs" />
            <MetricCard label="Total Non-Billable Ingress Duration" value="0" unit="secs" />
          </div>
        </MetricSection>
      </main>
    </div>
  )
}
