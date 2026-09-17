"use client"

import * as React from "react"
import { Plus, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  createTool, updateTool, runCheck, saveToolCheck, validateTool, checkLabel,
  TOOL_METHODS, TOOL_TIMEOUT_DEFAULT, TOOL_PARAMETERS_SEED, SECRET_HEADER_NAMES,
  type AgentTool, type ToolCheck,
} from "@/lib/agent-tools"

/**
 * Create an HTTP tool, and the two display parts the builder row and Resources
 * both reuse. Design Tracker 19 · Tools & connectors, direction C.
 *
 * It sits in its own file rather than inside step-build.tsx beside
 * KnowledgeCreateForm and McpCreateForm on scope grounds only: nine features
 * land through one integrator and step-build.tsx is already the most-edited
 * file. Both surfaces still import the form from ONE place, which is the
 * property the comment at integrations/page.tsx :21-23 asserts.
 *
 * Two decisions carry the form:
 *  1. ONE primary, "Create and test". The test endpoint is keyed on a saved
 *     toolId, so there is nothing to call before the tool exists; a second fill
 *     beside it would be two primaries in one fold. The first press creates,
 *     tests and attaches. Later presses save what changed and re-run, and never
 *     create a second tool.
 *  2. The result stays on screen. The raw body IS the diagnosis: swapping
 *     straight back to the roster throws away the only thing that says why a
 *     404 came back.
 */

/** A header whose name Agora treats as a secret. There is no stored reference
 *  behind the value yet, so the row states what is true of the NAME. */
const isSecret = (key: string) => SECRET_HEADER_NAMES.includes(key.trim().toLowerCase())

type Pair = { key: string; value: string }

export function ToolCreateForm({ onCreated }: { onCreated: (id: string) => void }) {
  // General
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [status, setStatus] = React.useState<AgentTool["status"]>("available")
  // Request
  const [method, setMethod] = React.useState<AgentTool["method"]>("GET")
  const [url, setUrl] = React.useState("")
  const [headers, setHeaders] = React.useState<Pair[]>([{ key: "", value: "" }])
  const [queryParams, setQueryParams] = React.useState<Pair[]>([{ key: "", value: "" }])
  const [bodyTemplate, setBodyTemplate] = React.useState("")
  const [timeoutMs, setTimeoutMs] = React.useState(String(TOOL_TIMEOUT_DEFAULT))
  // Agent function
  const [fnName, setFnName] = React.useState("")
  const [parameters, setParameters] = React.useState(TOOL_PARAMETERS_SEED)
  const [fnDescription, setFnDescription] = React.useState("")
  const [fnInput, setFnInput] = React.useState("{}")

  // The id is held after the first press, so the button stops creating.
  const [createdId, setCreatedId] = React.useState<string | null>(null)
  const [check, setCheck] = React.useState<ToolCheck | undefined>(undefined)

  const draft = {
    name,
    description,
    status,
    method,
    url,
    headers,
    queryParams,
    // A GET carries no body, so a hidden field never fails the form.
    bodyTemplate: method === "POST" ? bodyTemplate : "",
    timeoutMs: Number(timeoutMs),
    fn: { name: fnName, description: fnDescription, parameters },
  }
  const { ok, errors } = validateTool(draft)

  const createAndTest = () => {
    const id = createdId ?? createTool(draft).id
    if (createdId) updateTool(id, draft)
    const result = runCheck({ url, method, body: fnInput })
    saveToolCheck(id, result)
    setCheck(result)
    if (!createdId) {
      setCreatedId(id)
      onCreated(id)
    }
  }

  return (
    <div className="space-y-5">
      <GroupHeading title="General" />

      <div className="space-y-1.5">
        <Label htmlFor="tool-name" className="text-sm font-medium">Name</Label>
        <Input id="tool-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. lookup_order" />
        <p className="text-xs text-muted-foreground">Only you read this name.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tool-desc" className="text-sm font-medium">Description</Label>
        <Input
          id="tool-desc" value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Reads one order from the orders API"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as AgentTool["status"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />
      <GroupHeading title="Request" />

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Method</Label>
        <ToggleGroup
          type="single"
          value={method}
          onValueChange={(v) => v && setMethod(v as AgentTool["method"])}
          variant="outline"
          size="sm"
          className="grid grid-cols-2"
          aria-label="HTTP method"
        >
          {TOOL_METHODS.map((m) => (
            <ToggleGroupItem key={m} value={m} className="text-xs">{m}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tool-url" className="text-sm font-medium">URL</Label>
        <Input
          id="tool-url" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/orders/{{order_id}}"
          className="font-mono text-sm"
        />
        {url.trim() && errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">HTTP headers</Label>
        <PairRows
          rows={headers}
          onChange={setHeaders}
          keyPlaceholder="Authorization"
          valuePlaceholder="Bearer …"
          removeLabel="Remove header"
          addLabel="Add header"
          secretByName
        />
        <p className="text-xs text-muted-foreground">The IP we call from is not published yet.</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Query parameters</Label>
        <PairRows
          rows={queryParams}
          onChange={setQueryParams}
          keyPlaceholder="status"
          valuePlaceholder="{{status}}"
          removeLabel="Remove query parameter"
          addLabel="Add query parameter"
        />
      </div>

      {method === "POST" && (
        <div className="space-y-1.5">
          <Label htmlFor="tool-body" className="text-sm font-medium">Body template</Label>
          <Textarea
            id="tool-body" value={bodyTemplate} onChange={(e) => setBodyTemplate(e.target.value)}
            placeholder={`{\n  "order_id": "{{order_id}}"\n}`}
            className="min-h-24 font-mono text-xs"
          />
          {bodyTemplate.trim() && errors.bodyTemplate && (
            <p className="text-xs text-destructive">{errors.bodyTemplate}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="tool-timeout" className="text-sm font-medium">Timeout</Label>
        <div className="flex items-center gap-2">
          <Input
            id="tool-timeout" value={timeoutMs} onChange={(e) => setTimeoutMs(e.target.value)}
            inputMode="numeric" className="max-w-40 tabular-nums"
          />
          <span className="text-sm text-muted-foreground">ms</span>
        </div>
        {errors.timeoutMs ? (
          <p className="text-xs text-destructive">{errors.timeoutMs}</p>
        ) : (
          <p className="text-xs text-muted-foreground">How long the agent waits for your endpoint.</p>
        )}
      </div>

      <Separator />
      <GroupHeading title="Agent function" />

      <div className="space-y-1.5">
        <Label htmlFor="tool-fn" className="text-sm font-medium">Function name</Label>
        <Input
          id="tool-fn" value={fnName} onChange={(e) => setFnName(e.target.value)}
          placeholder="lookup_order" className="font-mono text-sm"
        />
        {fnName.trim() && errors.fnName && <p className="text-xs text-destructive">{errors.fnName}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tool-params" className="text-sm font-medium">Parameters (JSON)</Label>
        <Textarea
          id="tool-params" value={parameters} onChange={(e) => setParameters(e.target.value)}
          className="min-h-32 font-mono text-xs"
        />
        {errors.parameters && <p className="text-xs text-destructive">{errors.parameters}</p>}
        <p className="text-xs text-muted-foreground">
          What the agent may fill in. Every placeholder in the request is declared here.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tool-fn-desc" className="text-sm font-medium">Function description</Label>
        <Textarea
          id="tool-fn-desc" value={fnDescription} onChange={(e) => setFnDescription(e.target.value)}
          placeholder="Look up an order's status. Call this when the caller asks where their order is."
          className="min-h-20 text-sm"
        />
        <p className="text-xs text-muted-foreground">The agent reads this to decide when to call the tool.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tool-fn-input" className="text-sm font-medium">Function input (JSON)</Label>
        <Textarea
          id="tool-fn-input" value={fnInput} onChange={(e) => setFnInput(e.target.value)}
          className="min-h-20 font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">The test sends these values in place of the placeholders.</p>
      </div>

      <Button className="w-full" disabled={!name.trim() || !ok} onClick={createAndTest}>
        {createdId ? "Test again" : "Create and test"}
      </Button>

      <ToolCheckResult check={check} />
    </div>
  )
}

/** The state chip, the status code where there is one, and the endpoint's own
 *  answer. No duration: the test result carries none. */
export function ToolCheckResult({ check }: { check?: ToolCheck }) {
  if (!check) return null
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <ToolStateChip check={check} />
        {check.statusCode !== undefined && (
          <span className="text-xs text-muted-foreground">HTTP {check.statusCode}</span>
        )}
      </div>
      {check.body !== undefined ? (
        <pre className="max-h-64 overflow-auto px-3 py-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
          {check.body}
        </pre>
      ) : (
        <p className="px-3 py-2.5 text-sm">{check.error}</p>
      )}
    </div>
  )
}

/**
 * Test passed · Test failed · Not tested yet. An attached tool that has never
 * answered must not look identical to one that has, the same way an
 * unavailable item already does not (step-build.tsx :281-284, whose
 * destructive treatment the failed state reuses).
 *
 * `checkedAt` renders only where the contract has a last-checked time:
 * `GET /mcp/{id}/status` returns `lastDetectedAt`, and the custom-tool
 * envelope has no equivalent.
 */
export function ToolStateChip({ check, checkedAt }: { check?: ToolCheck; checkedAt?: number }) {
  const failed = !!check && !check.ok
  return (
    <div className="shrink-0">
      <Badge
        variant={failed ? "outline" : "secondary"}
        className={cn(
          "gap-1 text-xs",
          check?.ok && "bg-success/15 text-success",
          failed && "border-destructive/40 text-destructive",
          !check && "bg-warning/15 text-warning",
        )}
      >
        {failed && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
        {checkLabel(check)}
      </Badge>
      {checkedAt !== undefined && (
        <p className="mt-0.5 text-xs text-muted-foreground">{checkedLabel(checkedAt)}</p>
      )}
    </div>
  )
}

// ─── Small parts ──────────────────────────────────────────────────────────────

function GroupHeading({ title }: { title: string }) {
  return <p className="text-sm font-medium text-balance">{title}</p>
}

/** "Checked 2 days ago", from a stored timestamp. A time in the future, or one
 *  that is not a number, reads as just now rather than as nonsense. */
function checkedLabel(at: number): string {
  const mins = Math.floor((Date.now() - at) / 60000)
  if (!Number.isFinite(mins) || mins < 1) return "Checked just now"
  const plural = (n: number, unit: string) => `Checked ${n} ${unit}${n === 1 ? "" : "s"} ago`
  if (mins < 60) return plural(mins, "minute")
  const hours = Math.floor(mins / 60)
  if (hours < 24) return plural(hours, "hour")
  return plural(Math.floor(hours / 24), "day")
}

/** Repeatable key/value rows, the shape McpCreateForm already uses for its
 *  headers (step-build.tsx :577-598). */
function PairRows({
  rows, onChange, keyPlaceholder, valuePlaceholder, removeLabel, addLabel, secretByName,
}: {
  rows: Pair[]
  onChange: (rows: Pair[]) => void
  keyPlaceholder: string
  valuePlaceholder: string
  removeLabel: string
  addLabel: string
  /** Mask the value once the name is one Agora treats as a secret. */
  secretByName?: boolean
}) {
  const setRow = (idx: number, patch: Partial<Pair>) =>
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const secret = !!secretByName && isSecret(r.key)
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <Input
                value={r.key} onChange={(e) => setRow(i, { key: e.target.value })}
                placeholder={keyPlaceholder} className="text-sm"
              />
              <Input
                value={r.value} onChange={(e) => setRow(i, { value: e.target.value })}
                placeholder={valuePlaceholder} className="text-sm"
                type={secret ? "password" : "text"}
                autoComplete={secret ? "new-password" : "off"}
              />
              <Button
                variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground"
                aria-label={removeLabel}
                onClick={() => onChange(rows.filter((_, x) => x !== i))}
                disabled={rows.length === 1}
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            {secret && <p className="text-xs text-muted-foreground">Stored as a secret</p>}
          </div>
        )
      })}
      <Button
        variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
        onClick={() => onChange([...rows, { key: "", value: "" }])}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden /> {addLabel}
      </Button>
    </div>
  )
}
