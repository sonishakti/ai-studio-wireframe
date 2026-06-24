"use client"

import { Plus, MoreHorizontal, AlertTriangle, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import {
  VENDOR_CREDENTIALS,
  expiringCredentials,
  deploymentsAtRiskFromCredential,
} from "@/lib/campaign-data"

/**
 * VendorCredentialsPanel — third-party vendor API keys (LLM/TTS/STT/Telephony).
 * Shared body so the same content renders both at /integrations?tab=credentials
 * AND wherever the credentials module is surfaced. Data lives in campaign-data so
 * the diagnostics engine can flag an expiring key as a critical issue naming the
 * live deployments it puts at risk (2026-06-24 error-remediation loop).
 */

export function VendorCredentialsPanel({ showHeader = false }: { showHeader?: boolean }) {
  const atRisk = expiringCredentials()

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Vendor Credentials</h2>
            <p className="text-xs text-muted-foreground">
              Third-party API keys your agents&apos; stacks use — LLM, TTS, STT, Telephony.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => toast.info("Mock: Add credential")}>
            <Plus className="h-4 w-4" /> Add Credential
          </Button>
        </div>
      )}

      {/* Expiry warning — dynamic, and it names the live deployments at risk so
          the urgency is concrete (this is the same signal the Monitor card and
          Diagnostics queue surface). */}
      {atRisk.map((c) => {
        const deps = deploymentsAtRiskFromCredential(c.vendor)
        return (
          <Card key={c.id} className="border-warning/40 bg-warning/10">
            <CardContent className="py-3 px-4 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-warning">
                <span className="font-medium">
                  {c.vendor} key {c.status === "expired" ? "has expired" : `expires ${c.expiresOn ?? "soon"}`}.
                </span>{" "}
                {deps.length > 0 ? (
                  <>
                    Rotate it to keep{" "}
                    <span className="font-medium">
                      {deps.map((d) => d.name).join(", ")}
                    </span>{" "}
                    running.
                  </>
                ) : (
                  <>Rotate it to avoid service interruption.</>
                )}
              </p>
            </CardContent>
          </Card>
        )
      })}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Used by</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[48px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {VENDOR_CREDENTIALS.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <KeyRound className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm font-medium">No vendor credentials yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Add your first LLM, TTS, STT, or telephony key so your agents&apos; stacks can run.
                      </p>
                      <Button
                        size="sm"
                        className="gap-1.5 mt-2"
                        onClick={() => toast.info("Mock: Add credential")}
                      >
                        <Plus className="h-4 w-4" /> Add Credential
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {VENDOR_CREDENTIALS.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.vendor}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{v.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{v.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{v.keyHint}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === "valid" ? "default" : v.status === "expiring" ? "outline" : "destructive"}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {v.usedBy} {v.usedBy === 1 ? "agent" : "agents"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.added}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${v.vendor} — ${v.name}`}>
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => toast.info(`Mock: Edit ${v.vendor} — ${v.name}`)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toast.info(`Mock: Rotate ${v.vendor} — ${v.name}`)}>Rotate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DestructiveActionDialog
                          action="Delete"
                          resource="vendor credential"
                          resourceId={v.id}
                          resourceName={`${v.vendor} — ${v.name}`}
                          description="Agents using this vendor key will fail until you add a replacement. This cannot be undone."
                        >
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                            Delete
                          </DropdownMenuItem>
                        </DestructiveActionDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
