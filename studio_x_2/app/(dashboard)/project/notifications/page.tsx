"use client"

import * as React from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const CHANNELS: { key: "email" | "inApp" | "slack" | "webhook"; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "inApp", label: "In-app" },
  { key: "slack", label: "Slack" },
  { key: "webhook", label: "Webhook" },
]

const CATEGORIES = [
  { id: "campaigns", label: "Campaign events",     desc: "Start, complete, paused, failed", email: true,  inApp: true,  slack: false, webhook: false },
  { id: "calls",     label: "Call events",          desc: "Per-call outcomes and transcripts (high-volume)", email: false, inApp: false, slack: false, webhook: true  },
  { id: "agents",    label: "Agent errors",         desc: "Vendor key issues, timeouts, runtime failures",   email: true,  inApp: true,  slack: true,  webhook: true  },
  { id: "billing",   label: "Billing & usage",      desc: "Threshold alerts, invoice receipts",              email: true,  inApp: true,  slack: false, webhook: false },
  { id: "security",  label: "Security",             desc: "New API keys, credential rotation, audit events", email: true,  inApp: true,  slack: true,  webhook: false },
  { id: "product",   label: "Product announcements",desc: "Release notes, new features, deprecations",       email: false, inApp: true,  slack: false, webhook: false },
]

export default function ProjectNotificationsPage() {
  const [prefs, setPrefs] = React.useState(CATEGORIES)
  const [dirty, setDirty] = React.useState(false)

  const update = (id: string, channel: "email" | "inApp" | "slack" | "webhook", value: boolean) => {
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, [channel]: value } : p)))
    setDirty(true)
  }

  const handleSave = () => {
    setDirty(false)
    toast.success("Notification preferences saved")
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Project Notifications"
        description="Configure who receives what for this project."
        actions={
          <Button onClick={handleSave} disabled={!dirty}>
            Save Changes
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notification preferences</CardTitle>
            <CardDescription>
              Toggle channels for each event category. Project-scoped preferences override your global preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="px-6">Category</TableHead>
                  {CHANNELS.map((c) => (
                    <TableHead key={c.key} scope="col" className="w-20 text-center last:pr-6">
                      {c.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {prefs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="px-6">
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                    </TableCell>
                    {CHANNELS.map((c) => (
                      <TableCell key={c.key} className="text-center last:pr-6">
                        <Switch
                          checked={p[c.key]}
                          onCheckedChange={(v) => update(p.id, c.key, v)}
                          aria-label={`${p.label} — ${c.label}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Routing</CardTitle>
            <CardDescription>Where notifications are delivered for this project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email-list">Email recipients</Label>
                <Input id="email-list" placeholder="ops@acme.com, oncall@acme.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slack-channel">Slack channel</Label>
                <Input id="slack-channel" placeholder="#agora-alerts" />
              </div>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input id="webhook-url" placeholder="https://api.acme.com/agora-events" className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">
                Use the same secret as your project webhook. Configure in{" "}
                <a href="/developer/webhooks" className="underline hover:text-foreground">Developer Hub › Webhooks</a>.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
