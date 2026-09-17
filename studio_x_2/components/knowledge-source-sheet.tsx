"use client"

import * as React from "react"
import { Upload, RefreshCw, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EngineRow } from "@/components/wizard/engine-row"
import { CrawlSourceForm } from "@/components/knowledge-crawl-form"
import {
  allKnowledgeBases, listUserKnowledgeBases, deleteKnowledgeBase,
} from "@/lib/agent-resources"
import {
  listSources, addSource, removeSource, refreshSource, setAutoRefresh,
  sourceLine, nextRunLabel, agentsUsingBase, SOURCE_STATE_LABEL,
  type KnowledgeSource, type RefreshResult, type CrawlLedger,
} from "@/lib/knowledge-sources"

/**
 * The base sheet — what one knowledge base holds, opened from the builder
 * row's per-row menu and from the Resources card (design 20, direction B).
 * Until this existed, a base created in the builder could never be opened
 * again: the menu is gated on `i.config && (onConfigure || onDelete)`
 * (step-build.tsx:395) and knowledge passed neither (Before defect 5).
 *
 * The chrome is `McpToolsSheet`'s, verbatim (step-build.tsx:612-648): a
 * `sm:max-w-xl` SheetContent, a bordered header, a scrolling body and one
 * footer button. It is a separate component because an MCP server's body is
 * one flat list of booleans, while a base's body is sources, a ledger and a
 * schedule.
 *
 * Three rules shape the body. Freshness is a PER-SOURCE stamp, because the
 * base record cannot compute one. "Refresh now" and the weekly schedule
 * appear only on a site this browser actually read, since a record with no
 * address has nothing to re-read and an uploaded file cannot be read again.
 * Delete appears only for a base made in this browser: `KNOWLEDGE_BASES` is a
 * module constant, so deleting a seed would report success and the base would
 * return on reload.
 */

type Door = "none" | "file" | "crawl"

export function KnowledgeSourceSheet({
  kbId,
  onClose,
  onSaved,
}: {
  kbId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const base = React.useMemo(
    () => (kbId ? allKnowledgeBases().find((k) => k.id === kbId) : undefined),
    [kbId],
  )
  /** Only a base this browser made can be deleted (see the header note). */
  const madeHere = React.useMemo(
    () => (kbId ? listUserKnowledgeBases().some((k) => k.id === kbId) : false),
    [kbId],
  )

  const [sources, setSources] = React.useState<KnowledgeSource[]>([])
  const [door, setDoor] = React.useState<Door>("none")
  const [fileName, setFileName] = React.useState("")
  const [refreshing, setRefreshing] = React.useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = React.useState<RefreshResult | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const reload = () => setSources(kbId ? listSources(kbId) : [])

  // A different base is a different body: read its sources and reset the
  // doors and the last report. Adjusted during render rather than in an
  // effect — the store is read on open, so an effect would paint the previous
  // base's list for a frame first.
  const [shownFor, setShownFor] = React.useState<string | null>(null)
  if (shownFor !== kbId) {
    setShownFor(kbId)
    setSources(kbId ? listSources(kbId) : [])
    setDoor("none")
    setFileName("")
    setLastRefresh(null)
  }

  /** Sites this browser read: the only rows a refresh or a schedule can act
   *  on, because they are the only ones that carry an address. */
  const sites = sources.filter((s) => s.kind === "site" && s.address)
  const lastReadAt = sites.reduce<number | undefined>(
    (acc, s) => (s.lastReadAt && (!acc || s.lastReadAt > acc) ? s.lastReadAt : acc),
    undefined,
  )

  const addFile = () => {
    if (!kbId || !fileName.trim()) return
    addSource({ kbId, kind: "file", label: fileName.trim(), state: "active", addedAt: Date.now() })
    setFileName("")
    setDoor("none")
    reload()
    onSaved()
  }

  const handleCrawled = (address: string, ledger: CrawlLedger) => {
    if (!kbId) return
    addSource({
      kbId,
      kind: "site",
      // Blank: `addSource` names a site by its host, derived from the address.
      label: "",
      address,
      pages: ledger.kept,
      state: ledger.kept > 0 ? "active" : ledger.failed > 0 ? "failed" : "empty",
      addedAt: Date.now(),
      lastReadAt: Date.now(),
    })
    // The door stays open: the ledger is the report on what just happened, and
    // closing over it would take the answer away the moment it arrived.
    reload()
    onSaved()
  }

  const refresh = (source: KnowledgeSource) => {
    setRefreshing(source.id)
    setLastRefresh(null)
    window.setTimeout(() => {
      const result = refreshSource(source.id)
      setRefreshing(null)
      setLastRefresh(result)
      reload()
      onSaved()
      toast.success("Refreshed", {
        description: `${result.pages} ${result.pages === 1 ? "page" : "pages"}, ${result.changed} changed.`,
      })
    }, 700)
  }

  const doDelete = () => {
    if (!kbId) return
    listSources(kbId).forEach((s) => removeSource(s.id))
    deleteKnowledgeBase(kbId)
    setConfirmDelete(false)
    onSaved()
    onClose()
    toast.success("Knowledge base deleted")
  }

  return (
    <Sheet open={!!kbId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle>{base?.name ?? "Knowledge base"}</SheetTitle>
          <SheetDescription>Files and sites this base reads.</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* The roster, one line per source — the same shape the attach sheet
              draws its rows in (step-build.tsx:364-418). */}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-baseline justify-between border-b border-border bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground">
              <span>Source</span>
              <span>Status</span>
            </div>
            <ul className="divide-y divide-border">
              {sources.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{sourceLine(s)}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "shrink-0 text-xs",
                      s.state === "active" && "bg-success/15 text-success",
                      s.state === "failed" && "bg-destructive/15 text-destructive",
                      (s.state === "processing" || s.state === "empty") && "text-muted-foreground",
                    )}
                  >
                    {SOURCE_STATE_LABEL[s.state]}
                  </Badge>
                  {s.kind === "site" && s.address && (
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 shrink-0 gap-1.5 px-2 text-xs text-muted-foreground"
                      onClick={() => refresh(s)}
                      disabled={refreshing === s.id}
                    >
                      {refreshing === s.id
                        ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                        : <RefreshCw className="h-3 w-3" aria-hidden />}
                      Refresh now
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {sources.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No sources yet.</p>
            )}
          </div>

          {/* A refresh that half worked says so on the surface: the toast is
              gone in four seconds and this is the part that has a consequence. */}
          {lastRefresh && lastRefresh.errors > 0 && (
            <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
              Refresh finished with {lastRefresh.errors}{" "}
              {lastRefresh.errors === 1 ? "error" : "errors"}. The pages that failed kept the
              text they had.
            </div>
          )}

          {/* Two doors, one open at a time — the IngestPicker idiom
              (step-build.tsx:454-485), so neither path is a dead end. */}
          <ToggleGroup
            type="single"
            value={door === "none" ? "" : door}
            onValueChange={(v) => setDoor((v as Door) || "none")}
            className="grid grid-cols-2 gap-2"
            aria-label="Add a source"
          >
            <ToggleGroupItem
              value="file"
              className="justify-start rounded-lg border border-border px-3 py-2.5 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-foreground"
            >
              Add a file
            </ToggleGroupItem>
            <ToggleGroupItem
              value="crawl"
              className="justify-start rounded-lg border border-border px-3 py-2.5 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-foreground"
            >
              Crawl a site
            </ToggleGroupItem>
          </ToggleGroup>

          {door === "file" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={`kb-source-file-${kbId}`} className="text-sm font-medium">File</Label>
                {/* Mock file drop — no real upload (wireframe). Typing a name
                    stands in, the same way the create form does it. */}
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4 shrink-0" aria-hidden />
                  <Input
                    id={`kb-source-file-${kbId}`}
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="docs.pdf"
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    onKeyDown={(e) => { if (e.key === "Enter") addFile() }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  PDF and DOCX, up to 20 MB each. Ten files per base.
                </p>
              </div>
              <Button variant="outline" disabled={!fileName.trim()} onClick={addFile}>
                Add file
              </Button>
            </div>
          )}

          {door === "crawl" && kbId && (
            <CrawlSourceForm kbId={kbId} onCrawled={handleCrawled} />
          )}

          {/* The schedule is a property of the sites, not of the base: one row
              sets it for every site here, because a base reads on one cadence. */}
          {sites.length > 0 && (
            <div className="rounded-lg border border-border px-3.5 py-3">
              <div className="divide-y divide-border">
                <EngineRow
                  title="Refresh weekly"
                  description="Agora reads the site again every seven days."
                  caption="Requires Engine · planned"
                  checked={sites.every((s) => s.autoRefresh)}
                  onCheckedChange={(on) => {
                    sites.forEach((s) => setAutoRefresh(s.id, on))
                    reload()
                    onSaved()
                  }}
                >
                  <p className="pt-1.5 text-xs text-muted-foreground">{nextRunLabel(lastReadAt)}</p>
                </EngineRow>
              </div>
            </div>
          )}

          {madeHere && (
            <div className="border-t border-border pt-3">
              <Button
                variant="ghost" size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
              </Button>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-5 py-3">
          <Button className="w-full" onClick={() => { onSaved(); onClose() }}>Done</Button>
        </div>
      </SheetContent>

      {/* The guard names who is attached and who actually answers, separately:
          attach takes a list and only the first id becomes the engine's
          `kb_id`, so "attached" and "answers from it" are two different facts. */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this knowledge base?</AlertDialogTitle>
            <AlertDialogDescription>{dependentsLine(kbId)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}

/** "A and B have this base attached. B answers from it." Both halves are
 *  computed: with nobody attached the dialog says so rather than implying a
 *  blast radius it cannot name. */
function dependentsLine(kbId: string | null): string {
  if (!kbId) return "No agent has this base attached."
  const { answering, attached } = agentsUsingBase(kbId)
  const everyone = [...attached, ...answering]
  if (everyone.length === 0) return "No agent has this base attached."
  const first = `${nameList(everyone)} ${everyone.length === 1 ? "has" : "have"} this base attached.`
  if (answering.length === 0) return first
  return `${first} ${nameList(answering)} ${answering.length === 1 ? "answers" : "answer"} from it.`
}

function nameList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ""
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}
