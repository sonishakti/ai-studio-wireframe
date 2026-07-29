"use client"

import * as React from "react"
import { Check, Loader2, TriangleAlert, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import {
  RETRIEVAL_PROVIDERS, MOCK_RESOURCES, EGRESS_IP, mockRetrieval,
  type RetrievalProvider, type RetrievedChunk,
} from "@/lib/agent-resources"

/**
 * Connect an existing vector index as agent knowledge.
 *
 * Q3 roadmap "[UI] Integrate Couchbase as a RAG provider" (P1, 2026-07),
 * deliberately built as a GENERIC external-retrieval form with Couchbase as
 * the first provider — a Couchbase-branded page would be a fourth
 * connect-an-external-thing door beside KB upload, MCP servers, and
 * Connectors, and no user asked for Couchbase by name.
 *
 * Three decisions carry the design:
 *  1. The resource path CASCADES. Couchbase needs Bucket → Scope → Collection
 *     → Index; four free-text boxes are four chances to typo something the
 *     user cannot verify, and are the single likeliest source of "it says
 *     connected but returns nothing". They populate after credentials verify.
 *  2. TWO tests, because RAG has two independent failure modes. "Test
 *     connection" proves auth and that the index exists. "Test retrieval"
 *     proves the index actually answers — a wrong embedding field yields a
 *     perfectly healthy connection that retrieves nothing.
 *  3. Secrets are write-only. Once saved the field reads "configured" with a
 *     Reset — mirroring how Couchbase, Pinecone, Qdrant, and Weaviate all
 *     behave, none of which can show you a password twice.
 */

type ConnState =
  | { phase: "idle" }
  | { phase: "testing" }
  | { phase: "ok"; summary: string }
  | { phase: "error"; kind: "auth" | "network" | "notfound"; message: string }

export function ExternalRetrievalForm({
  onCreated,
}: {
  onCreated: (input: { name: string; externalSource: string }) => void
}) {
  const [providerId, setProviderId] = React.useState<RetrievalProvider>("couchbase")
  const provider = RETRIEVAL_PROVIDERS.find((p) => p.id === providerId)!

  const [name, setName] = React.useState("")
  const [endpoint, setEndpoint] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [secret, setSecret] = React.useState("")
  const [secretSaved, setSecretSaved] = React.useState(false)

  const [conn, setConn] = React.useState<ConnState>({ phase: "idle" })
  const [levels, setLevels] = React.useState<Record<string, string>>({})

  // Advanced — the two field names that silently break retrieval when wrong.
  const [textKey, setTextKey] = React.useState("text")
  const [embeddingKey, setEmbeddingKey] = React.useState("embedding")
  const [topK, setTopK] = React.useState(3)
  const [threshold, setThreshold] = React.useState(0.6)

  const [query, setQuery] = React.useState("")
  const [retrieval, setRetrieval] = React.useState<{ chunks: RetrievedChunk[]; ms: number } | null>(null)
  const [retrieving, setRetrieving] = React.useState(false)

  // Switching provider invalidates everything downstream of it.
  React.useEffect(() => {
    setConn({ phase: "idle" })
    setLevels({})
    setRetrieval(null)
  }, [providerId])

  const credsFilled = endpoint.trim() && (providerId === "custom" || username.trim()) && (secret.trim() || secretSaved)
  const connected = conn.phase === "ok"
  const pathComplete = provider.levels.every((l) => levels[l])

  const testConnection = () => {
    setConn({ phase: "testing" })
    setRetrieval(null)
    window.setTimeout(() => {
      // Mock: an endpoint that doesn't look like the provider's scheme fails
      // in a *specific* way — "Connection failed" is useless because every
      // distinguishable failure here has a different fix.
      if (providerId === "couchbase" && !endpoint.trim().startsWith("couchbase")) {
        setConn({
          phase: "error",
          kind: "network",
          message: "Couldn't reach that host. Check the connection string, and confirm our IP is allowlisted.",
        })
        return
      }
      if (secret.trim().length > 0 && secret.trim().length < 8) {
        setConn({ phase: "error", kind: "auth", message: "Authentication failed. Check the username and password." })
        return
      }
      setSecretSaved(true)
      setSecret("")
      setConn({
        phase: "ok",
        summary: "Credentials verified — 3 buckets visible.",
      })
    }, 900)
  }

  const testRetrieval = () => {
    setRetrieving(true)
    window.setTimeout(() => {
      setRetrieval(mockRetrieval(query))
      setRetrieving(false)
    }, 700)
  }

  const externalSource = `${provider.label} · ${provider.levels.map((l) => levels[l]).filter(Boolean).join(" / ") || endpoint}`

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="ext-name" className="text-sm font-medium">Name</Label>
        <Input
          id="ext-name" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Support docs (Couchbase)"
        />
        <p className="text-xs text-muted-foreground">
          What your agent will see when you attach this. Only you read this name.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Provider</Label>
        <Select value={providerId} onValueChange={(v) => setProviderId(v as RetrievalProvider)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {RETRIEVAL_PROVIDERS.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          We query your index — we never copy or re-index your documents.
        </p>
      </div>

      <Separator />

      {/* ── Step 1: credentials ── */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ext-endpoint" className="text-sm font-medium">{provider.endpointLabel}</Label>
          <Input
            id="ext-endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
            placeholder={provider.endpointPlaceholder} className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Copy this from your {provider.label} console.{" "}
            <a
              href={provider.docsUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-0.5 underline underline-offset-4"
            >
              Where to find it <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        {providerId !== "custom" && (
          <div className="space-y-1.5">
            <Label htmlFor="ext-user" className="text-sm font-medium">Username</Label>
            <Input id="ext-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="ext-secret" className="text-sm font-medium">
            {providerId === "pinecone" ? "API key" : "Password"}
          </Label>
          <div className="flex gap-2">
            <Input
              id="ext-secret" type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
              placeholder={secretSaved ? "configured" : ""}
              disabled={secretSaved}
              autoComplete="new-password"
              className="flex-1"
            />
            {secretSaved && (
              <Button variant="outline" onClick={() => { setSecretSaved(false); setConn({ phase: "idle" }) }}>
                Reset
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Stored encrypted and never shown again — the same way {provider.label} treats it.
          </p>
        </div>

        <Button onClick={testConnection} disabled={!credsFilled || conn.phase === "testing"} className="gap-1.5">
          {conn.phase === "testing" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Test connection
        </Button>

        {conn.phase === "ok" && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm">{conn.summary}</p>
          </div>
        )}
        {conn.phase === "error" && (
          <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm">{conn.message}</p>
            </div>
            {conn.kind === "network" && provider.networkNote && (
              <div className="space-y-1.5 rounded border border-border bg-card p-2.5">
                <p className="text-xs text-muted-foreground">{provider.networkNote}</p>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{EGRESS_IP}</code>
                  <Button
                    variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs"
                    onClick={() => { navigator.clipboard?.writeText(EGRESS_IP); toast.success("IP copied") }}
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Step 2: the resource path, populated from the connection ── */}
      {provider.levels.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Where the vectors live</p>
              <p className="text-xs text-muted-foreground">
                {connected
                  ? "Pick the index to query."
                  : "Test the connection first — we'll list these instead of asking you to type them."}
              </p>
            </div>
            {provider.levels.map((level, i) => {
              // Each level unlocks only once the one above it is chosen, so the
              // path can't be assembled out of order.
              const prevChosen = i === 0 || Boolean(levels[provider.levels[i - 1]])
              return (
                <div key={level} className="space-y-1.5">
                  <Label className="text-sm font-medium">{level}</Label>
                  <Select
                    value={levels[level] ?? ""}
                    onValueChange={(v) => {
                      // Choosing a level invalidates everything below it.
                      const next: Record<string, string> = { ...levels, [level]: v }
                      provider.levels.slice(i + 1).forEach((l) => delete next[l])
                      setLevels(next)
                      setRetrieval(null)
                    }}
                    disabled={!connected || !prevChosen}
                  >
                    <SelectTrigger><SelectValue placeholder={connected ? `Select a ${level.toLowerCase()}` : "—"} /></SelectTrigger>
                    <SelectContent>
                      {(MOCK_RESOURCES[level] ?? []).map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Step 3: does it actually retrieve? ── */}
      {connected && pathComplete && (
        <>
          <Separator />
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Test retrieval</p>
              <p className="text-xs text-muted-foreground">
                Connected isn&apos;t the same as working. Ask something your docs should answer.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="When will my order ship?"
                onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) testRetrieval() }}
              />
              <Button variant="outline" onClick={testRetrieval} disabled={!query.trim() || retrieving} className="gap-1.5">
                {retrieving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Run
              </Button>
            </div>

            {retrieval && (
              retrieval.chunks.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {retrieval.chunks.length} chunks in {retrieval.ms} ms · retrieval adds this to every turn&apos;s latency
                  </p>
                  {retrieval.chunks.map((c, i) => (
                    <div key={i} className="rounded-lg border border-border p-2.5">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{c.source}</span>
                        <Badge variant={c.score >= threshold ? "default" : "secondary"} className="tabular-nums text-xs">
                          {c.score.toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
                  Connected, but nothing came back. Usually the text or embedding field name under
                  Advanced doesn&apos;t match your documents, or the similarity threshold is too high.
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* ── Advanced ── */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-2 h-7 text-xs text-muted-foreground">
            Advanced
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ext-textkey" className="text-sm font-medium">Text field</Label>
              <Input id="ext-textkey" value={textKey} onChange={(e) => setTextKey(e.target.value)} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Which document field holds the readable chunk.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ext-embkey" className="text-sm font-medium">Embedding field</Label>
              <Input id="ext-embkey" value={embeddingKey} onChange={(e) => setEmbeddingKey(e.target.value)} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Which field holds the vector.</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Chunks to retrieve — {topK}</Label>
            <Slider value={[topK]} min={1} max={10} step={1} onValueChange={([v]) => setTopK(v)} aria-label="Chunks to retrieve" />
            <p className="text-xs text-muted-foreground">More context, slower turns.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Similarity threshold — {threshold.toFixed(2)}</Label>
            <Slider
              value={[threshold * 100]} min={0} max={100} step={5}
              onValueChange={([v]) => setThreshold(v / 100)} aria-label="Similarity threshold"
            />
            <p className="text-xs text-muted-foreground">Higher is stricter — fewer but more relevant chunks.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button
        className="w-full"
        disabled={!name.trim() || !connected || !pathComplete}
        onClick={() => onCreated({ name, externalSource })}
      >
        Add knowledge base
      </Button>
      {connected && pathComplete && !retrieval && (
        <p className={cn("text-center text-xs text-muted-foreground")}>
          Tip: run a test retrieval first — that&apos;s what proves it works.
        </p>
      )}
    </div>
  )
}
