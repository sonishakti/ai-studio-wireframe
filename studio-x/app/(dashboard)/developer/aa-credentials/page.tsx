"use client"

import { Plus, MoreHorizontal, Copy, Key } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"

const AA_CREDS = [
  { id: "aa_01", name: "Backend Server", clientId: "studio_aa_prod_a1b2", created: "Mar 15, 2026", lastUsed: "Just now", status: "active" },
  { id: "aa_02", name: "Reporting Worker", clientId: "studio_aa_stg_c3d4", created: "Feb 4, 2026", lastUsed: "2 days ago", status: "active" },
]

function copyClientId(clientId: string) {
  navigator.clipboard?.writeText(clientId)
  toast.success("Client ID copied")
}

export default function ServiceAccountsPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Server-to-server credentials. Never expose these in client code.
        </p>
        <Button size="sm"><Plus className="h-4 w-4" /> New Service Account</Button>
      </div>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4 text-sm text-muted-foreground">
            AA (App-level Auth) credentials are for server-to-server calls only. Never expose the secret in client-side code.
          </CardContent>
        </Card>
        {AA_CREDS.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Key className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No service accounts yet</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create a service account to get a client ID and secret for server-to-server API calls.
                </p>
              </div>
              <Button size="sm"><Plus className="h-4 w-4" /> New Service Account</Button>
            </CardContent>
          </Card>
        ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[48px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {AA_CREDS.map((cred) => (
                  <TableRow key={cred.id}>
                    <TableCell className="font-medium">{cred.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{cred.clientId}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => copyClientId(cred.clientId)}
                        >
                          <Copy className="h-3 w-3" />
                          <span className="sr-only">Copy client ID for {cred.name}</span>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="default">{cred.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cred.lastUsed}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cred.created}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                            <span className="sr-only">Service account actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Rotate Secret</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DestructiveActionDialog
                            action="Revoke"
                            resource="service account credential"
                            resourceId={cred.id}
                            resourceName={cred.name}
                            description="Revoking this credential will immediately invalidate it. Any service still using these keys will start failing."
                          >
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              Revoke
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
        )}
    </main>
  )
}
