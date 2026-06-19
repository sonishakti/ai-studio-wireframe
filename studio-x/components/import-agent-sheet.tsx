"use client"

import * as React from "react"
import { Upload, FileJson, Link2, FileUp, CheckCircle2, AlertCircle } from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
  SheetFooter, SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/code-block"
import { toast } from "sonner"
import { track } from "@/lib/analytics"

const SOURCES = ["Vapi", "Retell", "ElevenLabs", "Bland", "Generic JSON"] as const

const EXAMPLE_CONFIG = `{
  "name": "Acme Support v3",
  "language": "en-US",
  "voice": "elevenlabs:rachel",
  "llm": { "provider": "openai", "model": "gpt-4o" },
  "asr": { "provider": "deepgram", "model": "nova-3" },
  "first_message": "Hi! Thanks for calling Acme.",
  "system_prompt": "You are a helpful tier-1 support agent…",
  "tools": ["transfer_call", "check_order_status"]
}`

// ─── component ───────────────────────────────────────────────────────────────

export function ImportAgentSheet({ children }: { children: React.ReactNode }) {
  const [pasted, setPasted] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [source, setSource] = React.useState<(typeof SOURCES)[number]>("Generic JSON")
  const [validation, setValidation] = React.useState<
    { ok: boolean; agentName?: string; warnings?: string[] } | null
  >(null)

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(pasted)
      if (typeof parsed !== "object" || !parsed.name) {
        setValidation({ ok: false })
        return
      }
      setValidation({
        ok: true,
        agentName: parsed.name,
        warnings: parsed.tools?.length
          ? undefined
          : ["No tools specified — agent will rely solely on conversation."],
      })
    } catch {
      setValidation({ ok: false })
    }
  }

  const handleImport = () => {
    track("agent_imported" as never, { source } as never)
    toast.success("Agent imported", {
      description: `${validation?.agentName ?? "New agent"} is ready in your agents list as a draft.`,
    })
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Import an Agent</SheetTitle>
          <SheetDescription>
            Migrating from another platform? Bring your agent from Vapi, Retell, ElevenLabs, Bland —
            or any JSON export. We map voice, model, prompt, and tools to an Agora agent. (YAML soon.)
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 space-y-5">
          {/* Coming from — where the user is migrating from */}
          <div className="space-y-2">
            <Label>Coming from</Label>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    source === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {source === "Generic JSON"
                ? "Paste any agent config as JSON below."
                : `Export your ${source} agent and paste its config below — we'll map it to an Agora agent.`}
            </p>
          </div>

          <Tabs defaultValue="paste">
            <TabsList className="w-full">
              <TabsTrigger value="paste" className="flex-1 gap-1.5">
                <FileJson className="h-3.5 w-3.5" /> Paste JSON
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex-1 gap-1.5">
                <FileUp className="h-3.5 w-3.5" /> Upload file
              </TabsTrigger>
              <TabsTrigger value="url" className="flex-1 gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> From URL
              </TabsTrigger>
            </TabsList>

            {/* Paste */}
            <TabsContent value="paste" className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="agent-json">Agent config</Label>
                <Textarea
                  id="agent-json"
                  rows={10}
                  value={pasted}
                  onChange={(e) => { setPasted(e.target.value); setValidation(null) }}
                  placeholder={EXAMPLE_CONFIG}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Required: <code className="font-mono">name</code>. Recommended:{" "}
                  <code className="font-mono">voice</code>, <code className="font-mono">llm</code>,{" "}
                  <code className="font-mono">system_prompt</code>.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleValidate} disabled={!pasted.trim()}>
                Validate
              </Button>
            </TabsContent>

            {/* Upload */}
            <TabsContent value="upload" className="pt-3 space-y-3">
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 gap-3 text-center">
                <Upload className="h-7 w-7 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drop a .json file here</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Or click to browse — max 1 MB</p>
                </div>
                <Button variant="outline" size="sm">Choose file</Button>
              </div>
            </TabsContent>

            {/* From URL */}
            <TabsContent value="url" className="pt-3 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="agent-url">Public URL</Label>
                <Input
                  id="agent-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/agent-config.json"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  The URL must serve a JSON file with public read access.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Example */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Example config
            </p>
            <CodeBlock language="json" filename="agent-config.json">
              {EXAMPLE_CONFIG}
            </CodeBlock>
          </div>

          {/* Validation feedback */}
          {validation && (
            <div
              className={`rounded-lg border p-3 flex items-start gap-2.5 ${
                validation.ok
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-destructive/40 bg-destructive/5"
              }`}
            >
              {validation.ok
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                : <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0 text-sm">
                {validation.ok ? (
                  <>
                    <p className="font-medium">Ready to import</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Agent <span className="font-medium text-foreground">{validation.agentName}</span> will be
                      added to this project as a draft.
                    </p>
                    {validation.warnings?.map((w) => (
                      <Badge key={w} variant="outline" className="text-xs mt-2 font-normal">
                        ⚠ {w}
                      </Badge>
                    ))}
                  </>
                ) : (
                  <>
                    <p className="font-medium">Config is invalid</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Make sure it's valid JSON and includes at minimum a <code className="font-mono">name</code> field.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="px-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button onClick={handleImport} disabled={!validation?.ok}>
              Import as draft
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
