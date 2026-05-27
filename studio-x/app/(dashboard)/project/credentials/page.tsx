"use client"

import { Plus, Copy, Eye, EyeOff, KeyRound, MoreHorizontal } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"

const CREDENTIALS = [
  {
    id: "cred_01",
    name: "Production Key",
    type: "App ID + Certificate",
    appId: "a1b2c3d4e5f67890",
    environment: "production",
    created: "Mar 12, 2026",
    lastUsed: "2 min ago",
  },
  {
    id: "cred_02",
    name: "Staging Key",
    type: "App ID + Certificate",
    appId: "f9e8d7c6b5a43210",
    environment: "staging",
    created: "Jan 8, 2026",
    lastUsed: "3 days ago",
  },
  {
    id: "cred_03",
    name: "Dev Key",
    type: "App ID + Token",
    appId: "0a1b2c3d4e5f6789",
    environment: "development",
    created: "Nov 15, 2025",
    lastUsed: "1 week ago",
  },
]

export default function ProjectCredentialsPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[
          { label: "Project" },
          { label: "Project Credentials" },
        ]}
        title="Project Credentials"
        description="App IDs and certificates for Agora SDK integration."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> New Credential
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Info banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Project credentials</span> authenticate your
              app with Agora services. Keep your certificate secret — never expose it client-side.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>App ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {CREDENTIALS.map((cred) => (
                  <TableRow key={cred.id}>
                    <TableCell className="font-medium">{cred.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {cred.appId.slice(0, 8)}••••••••
                        </span>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <Copy className="h-3 w-3" />
                          <span className="sr-only">Copy App ID</span>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cred.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          cred.environment === "production"
                            ? "default"
                            : cred.environment === "staging"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {cred.environment}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cred.lastUsed}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cred.created}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Certificate</DropdownMenuItem>
                          <DropdownMenuItem>Regenerate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DestructiveActionDialog
                            action="Revoke"
                            resource="project credential"
                            resourceId={cred.id}
                            resourceName={cred.name}
                            description="Revoking will immediately invalidate this credential. All apps using it will fail until rotated."
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
      </main>
    </div>
  )
}
