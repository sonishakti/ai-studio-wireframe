"use client"

import { Plus, Shield, Eye, EyeOff, MoreHorizontal, AlertTriangle } from "lucide-react"
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

const VENDORS = [
  {
    id: "vc_01",
    vendor: "OpenAI",
    category: "LLM",
    name: "Production API Key",
    keyHint: "sk-proj-••••••••••••xK3a",
    status: "valid",
    usedBy: 3,
    added: "Feb 2, 2026",
  },
  {
    id: "vc_02",
    vendor: "ElevenLabs",
    category: "TTS",
    name: "Voice API Key",
    keyHint: "el_••••••••••••8f2b",
    status: "valid",
    usedBy: 3,
    added: "Feb 2, 2026",
  },
  {
    id: "vc_03",
    vendor: "Deepgram",
    category: "STT",
    name: "STT API Key",
    keyHint: "dg_••••••••••••c91e",
    status: "valid",
    usedBy: 2,
    added: "Mar 8, 2026",
  },
  {
    id: "vc_04",
    vendor: "Twilio",
    category: "Telephony",
    name: "Account SID + Auth Token",
    keyHint: "AC••••••••••••7d4f",
    status: "valid",
    usedBy: 0,
    added: "Jan 15, 2026",
  },
  {
    id: "vc_05",
    vendor: "Anthropic",
    category: "LLM",
    name: "Claude API Key",
    keyHint: "sk-ant-••••••••••••f812",
    status: "expiring",
    usedBy: 1,
    added: "Apr 10, 2026",
  },
]

export default function VendorCredentialsPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[
          { label: "Project" },
          { label: "Vendor Credentials" },
        ]}
        title="Vendor Credentials"
        description="Third-party API keys used by your agents — LLM, TTS, STT, Telephony."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Add Credential
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Expiry warning */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <span className="font-medium">1 credential expiring soon.</span> Rotate your Anthropic key before
              May 31 to avoid service interruption.
            </p>
          </CardContent>
        </Card>

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
                {VENDORS.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.vendor}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {v.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{v.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{v.keyHint}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          v.status === "valid"
                            ? "default"
                            : v.status === "expiring"
                            ? "outline"
                            : "destructive"
                        }
                      >
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
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Rotate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DestructiveActionDialog
                            action="Delete"
                            resource="vendor credential"
                            resourceId={v.id}
                            resourceName={`${v.vendor} — ${v.name}`}
                            description="Agents using this vendor key will fail until you add a replacement. This cannot be undone."
                          >
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
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
      </main>
    </div>
  )
}
