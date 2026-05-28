"use client"

import * as React from "react"
import { Copy, Pencil, Terminal, RotateCw, AlertTriangle, ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import { toast } from "sonner"

export default function ProjectSettingsPage() {
  const [projectName, setProjectName] = React.useState("My First Project")
  const [editingName, setEditingName] = React.useState(false)
  // Secured mode is on by default for all new projects. The UI shows status
  // + rotation controls but does NOT expose an off-switch — disabling
  // Secured Mode is a support-only path for legacy projects.
  const securedMode = true
  const [hasSecondary, setHasSecondary] = React.useState(false)

  // Scroll to #secured-mode anchor on initial load
  React.useEffect(() => {
    if (window.location.hash === "#secured-mode") {
      document.getElementById("secured-mode")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  const handleEnableSecondary = () => {
    setHasSecondary(true)
    toast.success("Secondary certificate enabled", {
      description: "Use this for zero-downtime rotation. Switch traffic to the new cert, then regenerate primary.",
    })
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Project Settings" />

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

          {/* ─── Secured Mode Card ──────────────────────────────────── */}
          <Card className="p-6" id="secured-mode">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0 bg-emerald-500/15">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">Secured mode</h2>
                    <Badge
                      variant="outline"
                      className="text-xs border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    >
                      Active
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 max-w-lg leading-relaxed">
                    SDKs authenticate with a token signed by your App Certificate. Secured mode is
                    on by default for new projects — to disable it, contact support.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="mb-5" />

            {/* Cert management */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">App Certificate</h3>
              {(
                <DestructiveActionDialog
                  action="Regenerate"
                  resource="primary certificate"
                  resourceId="prj_123456"
                  description="Regenerating immediately invalidates the current primary certificate. Any service using it will fail until rotated. Use the Secondary Certificate first for zero-downtime rotation."
                  successMessage="New primary certificate generated"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={(e) => e.preventDefault()}
                  >
                    <RotateCw className="h-3 w-3" /> Regenerate
                  </Button>
                </DestructiveActionDialog>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="primary-cert">Primary Certificate</Label>
                <div className="relative">
                  <Input
                    id="primary-cert"
                    type="password"
                    value="••••••••••••••••"
                    readOnly
                    className="pr-9 font-mono"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => toast.success("Copied certificate")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Server-side secret. Treat like a database password.
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                  <span>Created <span className="tabular-nums">Mar 12, 2026</span></span>
                  <span>·</span>
                  <span>Last used <span className="tabular-nums">2 min ago</span></span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="secondary-cert">Secondary Certificate</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-cert"
                    value={hasSecondary ? "••••••••••••••••" : "None"}
                    readOnly
                    className={hasSecondary ? "font-mono" : "text-muted-foreground"}
                  />
                  {!hasSecondary && (
                    <Button onClick={handleEnableSecondary} className="shrink-0">
                      Enable
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enable for zero-downtime certificate rotation.
                </p>
              </div>
            </div>

            {/* Rotation tip — only show when secondary exists */}
            {hasSecondary && (
              <div className="mt-5 flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Rotation in progress.</span> Both
                  certificates are accepted right now. Once all services have switched to the new
                  one, remove the old certificate to complete the rotation.
                </p>
              </div>
            )}
          </Card>

          {/* ─── Manage with CLI Card ───────────────────────────────── */}
          <Card className="p-6">
            <h2 className="text-base font-semibold mb-1">Manage with CLI</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Switch to this project from your terminal.
            </p>
            <div className="relative">
              <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value="agora project use prj_123456"
                readOnly
                className="pl-9 pr-9 font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
