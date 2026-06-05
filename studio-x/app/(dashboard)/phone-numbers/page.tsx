"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Search, MoreHorizontal, Phone, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import { PageHeader } from "@/components/page-header"
import { AddPhoneNumberSheet } from "@/components/add-phone-number-sheet"
import { DeployNav } from "@/components/deploy-nav"
import { PHONE_NUMBERS, CAMPAIGNS } from "@/lib/campaign-data"

export default function PhoneNumbersPage() {
  const [query, setQuery] = React.useState("")

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return PHONE_NUMBERS.filter((n) => {
      if (!q) return true
      return (
        n.number.toLowerCase().includes(q) ||
        n.label.toLowerCase().includes(q) ||
        n.vendor.toLowerCase().includes(q)
      )
    })
  }, [query])

  const assignedCount = PHONE_NUMBERS.filter((n) => n.assignedTo.length > 0 || !!n.assignedAgent).length
  const availableCount = PHONE_NUMBERS.length - assignedCount

  return (
    <div className="flex flex-col flex-1">
      <DeployNav />
      <PageHeader
        title="Phone Numbers"
        description="SIP numbers, agent assignment, and routing for inbound and outbound."
      />

      <main className="flex-1 p-6 pt-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground tabular-nums">{PHONE_NUMBERS.length}</span> total
            </span>
            <span>·</span>
            <span>
              <span className="font-medium text-foreground tabular-nums">{assignedCount}</span> assigned
            </span>
            <span>·</span>
            <span>
              <span className="font-medium text-foreground tabular-nums">{availableCount}</span> available
            </span>
          </div>

          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search number, label, vendor…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <AddPhoneNumberSheet>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Phone Number
            </Button>
          </AddPhoneNumberSheet>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[48px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono text-sm">
                      <Link href={`/phone-numbers/${n.id}`} className="hover:text-primary transition-colors">{n.number}</Link>
                    </TableCell>
                    <TableCell className="text-sm">{n.label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{n.vendor}</TableCell>
                    <TableCell>
                      {n.assignedTo.length === 0 ? (
                        n.assignedAgent ? (
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <Bot className="h-3 w-3 text-muted-foreground" /> {n.assignedAgent.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Available</span>
                        )
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {n.assignedTo.slice(0, 2).map((cid) => {
                            const campaign = CAMPAIGNS.find((c) => c.id === cid)
                            return (
                              <Link
                                key={cid}
                                href={`/campaigns/${cid}`}
                                className="text-xs text-primary hover:underline"
                              >
                                {campaign?.name ?? cid}
                              </Link>
                            )
                          })}
                          {n.assignedTo.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{n.assignedTo.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {n.status === "active" ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/phone-numbers/${n.id}`}>Edit configuration</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Assign to campaign</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DestructiveActionDialog
                            action="Release"
                            resource="phone number"
                            resourceId={n.id}
                            resourceName={n.number}
                            description="Releasing this number returns it to the vendor pool. You cannot reclaim this exact number."
                          >
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              Release
                            </DropdownMenuItem>
                          </DestructiveActionDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      No phone numbers match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
