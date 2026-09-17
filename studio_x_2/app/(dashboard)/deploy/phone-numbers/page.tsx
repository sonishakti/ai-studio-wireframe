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
import { AddPhoneNumberSheet } from "@/components/add-phone-number-sheet"
import { PageHeader } from "@/components/page-header"
import { DeployContextBar } from "@/components/deploy-context-bar"
import { PHONE_NUMBERS, DEPLOYMENTS, deploymentHref, type PhoneNumber } from "@/lib/campaign-data"
import { readSessionNumbers, removeSessionNumber, subscribeNumberStore } from "@/lib/number-store"
import { toast } from "sonner"

/** A seed row has a detail page; a row this session produced does not. */
const isSeed = (n: PhoneNumber) => PHONE_NUMBERS.some((p) => p.id === n.id)

/** What the From cell prints: where the number came from, which `vendor` cannot
 *  answer on its own (Bandwidth is both a carrier customers bring and the one
 *  Agora resells through). */
function fromLabel(n: PhoneNumber): string {
  if (n.origin === "agora") return "Agora"
  if (n.origin === "sandbox") return "Agora sandbox"
  return n.vendor
}

export default function PhoneNumbersPage() {
  const [query, setQuery] = React.useState("")

  // Numbers this session produced, above the seeded inventory. Read in an
  // effect: sessionStorage is not there on the server, and without this merge
  // a number you just got never appears on the page it belongs to.
  const [session, setSession] = React.useState<PhoneNumber[]>([])
  React.useEffect(() => {
    const sync = () => setSession(readSessionNumbers())
    sync()
    return subscribeNumberStore(sync)
  }, [])

  const all = React.useMemo(() => [...session, ...PHONE_NUMBERS], [session])

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((n) => {
      if (!q) return true
      return (
        n.number.toLowerCase().includes(q) ||
        n.label.toLowerCase().includes(q) ||
        fromLabel(n).toLowerCase().includes(q)
      )
    })
  }, [query, all])

  const assignedCount = all.filter((n) => n.assignedTo.length > 0 || !!n.assignedAgent).length
  const turningUpCount = all.filter((n) => n.status === "turning-up").length
  const availableCount = all.length - assignedCount - turningUpCount
  const hasNumbers = all.length > 0

  if (!hasNumbers) {
    return (
      <div className="flex flex-col flex-1">
        <DeployContextBar channelLabel="Phone numbers" />
        <PageHeader
          title="Phone numbers"
          actions={
            <AddPhoneNumberSheet>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add phone number
              </Button>
            </AddPhoneNumberSheet>
          }
        />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
          <Phone className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">No phone numbers yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Bring a SIP number from your carrier to take inbound calls or run outbound batches.
            </p>
          </div>
          <AddPhoneNumberSheet>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add phone number
            </Button>
          </AddPhoneNumberSheet>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <DeployContextBar channelLabel="Phone numbers" />
      <PageHeader
        title="Phone numbers"
        actions={
          <AddPhoneNumberSheet>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add phone number
            </Button>
          </AddPhoneNumberSheet>
        }
      />

      <main className="flex-1 p-6 pt-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground tabular-nums">{all.length}</span> total
            </span>
            <span>·</span>
            <span>
              <span className="font-medium text-foreground tabular-nums">{assignedCount}</span> assigned
            </span>
            {turningUpCount > 0 && (
              <>
                <span>·</span>
                <span>
                  <span className="font-medium text-foreground tabular-nums">{turningUpCount}</span> turning up
                </span>
              </>
            )}
            <span>·</span>
            <span>
              <span className="font-medium text-foreground tabular-nums">{availableCount}</span> available
            </span>
          </div>

          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search number, label, source…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[48px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono text-sm">
                      {/* The detail page is a SIP configuration form for an
                          imported number, and this route pre-generates seed ids
                          only: a number acquired this session has nothing to
                          open. */}
                      {isSeed(n) ? (
                        <Link href={`/deploy/phone-numbers/${n.id}`} className="hover:text-primary transition-colors">{n.number}</Link>
                      ) : (
                        n.number
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{n.label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        {fromLabel(n)}
                        {n.origin === "agora" && (
                          <Badge variant="outline" className="text-xs">Requires Engine</Badge>
                        )}
                      </span>
                    </TableCell>
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
                            const campaign = DEPLOYMENTS.find((c) => c.id === cid)
                            return (
                              <Link
                                key={cid}
                                href={campaign ? deploymentHref(campaign) : "/deploy"}
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
                      ) : n.status === "turning-up" ? (
                        <Badge variant="outline">Turning up</Badge>
                      ) : (
                        <Badge variant="secondary">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${n.number}`}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/deploy/phone-numbers/${n.id}`}>Edit configuration</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/deploy/batch-calls/new">Assign to batch</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {/* Two verbs, because they are two events: giving the
                              digits back, and telling Agora to stop routing a
                              number your carrier still owns. */}
                          <DestructiveActionDialog
                            action={n.origin === "agora" ? "Release" : "Remove from Agora"}
                            resource="phone number"
                            resourceId={n.id}
                            resourceName={n.number}
                            description={
                              n.origin === "agora"
                                ? "These digits go back to the carrier and you cannot get this exact number again."
                                : "Agora stops routing this number. Your carrier still owns it and still bills you."
                            }
                            onConfirm={() => {
                              removeSessionNumber(n.id)
                              toast.success(
                                n.origin === "agora" ? `${n.number} released` : `${n.number} removed from Agora`,
                              )
                            }}
                          >
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              {n.origin === "agora" ? "Release" : "Remove from Agora"}
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
