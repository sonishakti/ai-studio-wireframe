import { Plus, Key, MoreHorizontal, Copy } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const AA_CREDS = [
  { id: "aa_01", name: "Backend Server", clientId: "studio_aa_prod_a1b2", created: "Mar 15, 2026", lastUsed: "Just now", status: "active" },
  { id: "aa_02", name: "Analytics Worker", clientId: "studio_aa_stg_c3d4", created: "Feb 4, 2026", lastUsed: "2 days ago", status: "active" },
]

export default function AACredentialsPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Developer Hub", href: "/developer" }, { label: "AA Credentials" }]}
        title="AA Credentials"
        description="Service account credentials for server-to-server API authentication."
        actions={<Button><Plus className="h-4 w-4" /> New Credential</Button>}
      />
      <main className="flex-1 p-6 space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4 text-sm text-muted-foreground">
            AA (App-level Auth) credentials are for server-to-server calls only. Never expose the secret in client-side code.
          </CardContent>
        </Card>
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
                        <Button variant="ghost" size="icon" className="h-5 w-5"><Copy className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="default">{cred.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cred.lastUsed}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cred.created}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Rotate Secret</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">Revoke</DropdownMenuItem>
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
