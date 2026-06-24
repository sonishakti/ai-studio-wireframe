"use client"

import * as React from "react"
import {
  Copy,
  Pencil,
  Terminal,
  AlertTriangle,
  ShieldCheck,
  ArrowLeftRight,
  Mail,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"

// In production this comes from the project/session record. Kept here as the
// single source so the disable-cert flow doesn't hardcode an address inline.
const PROJECT = {
  id: "prj_123456",
  ownerEmail: "owner@my-first-project.com",
}
const MASKED = "••••••••••••••••"

export default function ProjectSettingsPage() {
  const [projectName, setProjectName] = React.useState("My First Project")
  const [editingName, setEditingName] = React.useState(false)

  // Secured mode is on by default for all new projects. Disabling is a
  // support-only path for legacy projects — no toggle exposed here.
  const securedMode = true

  // Rotation state — secondary off by default. Primary cert always exists.
  const [hasSecondary, setHasSecondary] = React.useState(true)

  // Dialog open state
  const [swapOpen, setSwapOpen] = React.useState(false)
  const [disableOpen, setDisableOpen] = React.useState(false)

  React.useEffect(() => {
    if (window.location.hash === "#secured-mode") {
      document.getElementById("secured-mode")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  const handleEnableSecondary = () => {
    setHasSecondary(true)
    track(Events.cert_secondary_enabled, { project_id: "prj_123456" })
    toast.success("Secondary certificate enabled", {
      description: "Use this for zero-downtime rotation. Swap when your services are ready.",
    })
  }

  const handleConfirmSwap = () => {
    setSwapOpen(false)
    track(Events.cert_swap_confirmed, { project_id: "prj_123456" })
    toast.success("Certificates swapped", {
      description: "What was the secondary is now the primary. Update any services still signing with the old key.",
    })
  }

  const handleConfirmDisable = () => {
    setDisableOpen(false)
    track(Events.cert_secondary_disable_requested, { project_id: "prj_123456" })
    toast.info("Confirmation email sent", {
      description: `Open the link sent to ${PROJECT.ownerEmail} to finish disabling the secondary certificate.`,
      icon: <Mail className="h-4 w-4" />,
    })
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader crumbs={[{ label: "Project Settings" }]} title="Project Settings" />

      <main className="flex-1 p-6">
        <div className="space-y-5">
          {/* ─── Project Info Card ──────────────────────────────────── */}
          <Card className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="project-name">Project Name</Label>
                <div className="relative">
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    disabled={!editingName}
                    className="pr-9"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setEditingName((v) => !v)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit name</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="app-id">App ID</Label>
                <div className="relative">
                  <Input
                    id="app-id"
                    value="prj_123456"
                    readOnly
                    className="pr-9 font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => {
                      void navigator.clipboard.writeText("prj_123456")
                      toast.success("App ID copied")
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="sr-only">Copy App ID</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Public identifier for this project. Safe to share.
                </p>
              </div>
            </div>
          </Card>

          {/* ─── Security / Secured Mode Card ───────────────────────── */}
          <Card className="p-6" id="secured-mode">
            {/* Header row */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0 bg-success/15">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">Security</h2>
                  <Badge
                    variant="outline"
                    className="text-xs border-success/40 bg-success/10 text-success"
                  >
                    Secured mode active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 max-w-lg leading-relaxed">
                  SDKs authenticate with a token signed by your App Certificate. To disable
                  Secured mode entirely, contact support.
                </p>
              </div>
            </div>

            <Separator className="mb-5" />

            {/* Certificate rotation pair */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
              {/* Primary cert */}
              <CertCard
                label="Primary Certificate"
                masked={MASKED}
                meta="Created Mar 12, 2026 · Last used 2 min ago"
                helper="Server-side secret. Treat like a database password."
              />

              {/* Swap control */}
              <div className="flex sm:flex-col items-center justify-center sm:py-2">
                <AlertDialog open={swapOpen} onOpenChange={setSwapOpen}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full shrink-0"
                    onClick={() => setSwapOpen(true)}
                    disabled={!hasSecondary}
                    title={
                      hasSecondary
                        ? "Swap primary and secondary"
                        : "Enable a secondary certificate to swap"
                    }
                  >
                    <ArrowLeftRight className="h-4 w-4 text-primary" />
                    <span className="sr-only">Swap certificates</span>
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Swap primary and secondary?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The current secondary certificate becomes the new primary. Make sure every
                        service signing tokens has been updated, or new joins will start failing.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirmSwap}>
                        Swap
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Secondary cert */}
              <CertCard
                label="Secondary Certificate"
                masked={hasSecondary ? MASKED : null}
                meta={
                  hasSecondary
                    ? "Created Mar 12, 2026 · Last used 1 hr ago"
                    : "Enable to start a zero-downtime rotation."
                }
                helper={
                  hasSecondary
                    ? "Used as fallback during rotation. Disable when you no longer need it."
                    : undefined
                }
                toggle={
                  <Switch
                    checked={hasSecondary}
                    onCheckedChange={(next) => {
                      if (next) {
                        handleEnableSecondary()
                      } else {
                        setDisableOpen(true)
                      }
                    }}
                    aria-label="Toggle secondary certificate"
                  />
                }
                onEnable={!hasSecondary ? handleEnableSecondary : undefined}
              />
            </div>

            {/* Rotation tip */}
            {hasSecondary && (
              <div className="mt-5 flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/5 p-3">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Rotation in progress.</span> Both
                  certificates sign valid tokens right now. Once every service has switched, swap
                  them and disable the old one.
                </p>
              </div>
            )}
          </Card>

          {/* ─── Manage with CLI Card ───────────────────────────────── */}
          <Card className="p-6">
            <h2 className="text-base font-semibold mb-1">Manage with CLI</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Switch projects, rotate certificates, and generate temp tokens from your terminal.
            </p>

            <div className="space-y-3">
              <CliCommand
                label="Use this project"
                command="agora project use prj_123456"
              />
              <CliCommand
                label="Generate a temp token for testing"
                command="agora token create --channel demo-channel --expires 24h"
                hint="Temp tokens are CLI-only. For production, run a token server in your own infrastructure."
              />
            </div>
          </Card>
        </div>
      </main>

      {/* ─── Disable Secondary Certificate confirmation ───────────── */}
      <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Secondary Certificate</AlertDialogTitle>
            <AlertDialogDescription>
              This will fail all requests to join a channel signed by this certificate. Make sure
              every client has the latest install with tokens generated by the primary certificate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/40 p-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              For safety, we&apos;ll email a confirmation link to{" "}
              <span className="font-medium text-foreground">{PROJECT.ownerEmail}</span>. The certificate
              stays active until you click the link.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisable}>Verify</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── CliCommand subcomponent ─────────────────────────────────────────────────

function CliCommand({
  label,
  command,
  hint,
}: {
  label: string
  command: string
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={command}
          readOnly
          className="pl-9 pr-9 font-mono text-sm"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => {
            void navigator.clipboard.writeText(command)
            toast.success("Command copied")
          }}
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="sr-only">Copy command</span>
        </Button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ─── CertCard subcomponent ───────────────────────────────────────────────────

interface CertCardProps {
  label: string
  masked: string | null
  meta: string
  helper?: string
  toggle?: React.ReactNode
  onEnable?: () => void
}

function CertCard({ label, masked, meta, helper, toggle, onEnable }: CertCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">{label}</Label>
        {toggle}
      </div>

      {masked ? (
        <div className="relative">
          <Input
            type="password"
            value={masked}
            readOnly
            className="pr-9 font-mono"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => {
              void navigator.clipboard.writeText("mock-certificate-value")
              toast.success(`${label} copied`)
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="sr-only">Copy {label.toLowerCase()}</span>
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value="Not enabled"
            readOnly
            className="text-muted-foreground"
          />
          {onEnable && (
            <Button onClick={onEnable} className="shrink-0">
              Enable
            </Button>
          )}
        </div>
      )}

      <div className="space-y-1">
        {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
        <p className="text-xs text-muted-foreground tabular-nums">{meta}</p>
      </div>
    </div>
  )
}
