"use client"

import * as React from "react"
import Link from "next/link"
import {
  Globe, ArrowRight, Copy, Sparkles, Palette, MessageSquare, Mic,
} from "lucide-react"
import { DeployNav } from "@/components/deploy-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { track, Events } from "@/lib/analytics"
import { markActivationStep } from "@/components/activation-checklist"
import { cn } from "@/lib/utils"

// ─── component ───────────────────────────────────────────────────────────────

export default function DeployWidgetPage() {
  const [agent, setAgent] = React.useState("agt_01")
  const [position, setPosition] = React.useState<"bottom-right" | "bottom-left">("bottom-right")
  const [primaryColor, setPrimaryColor] = React.useState("#0AA5E0")
  const [allowVoice, setAllowVoice] = React.useState(true)
  const [allowText, setAllowText] = React.useState(true)
  const [greeting, setGreeting] = React.useState("Hi! How can I help?")
  const [domains, setDomains] = React.useState("acme.com,app.acme.com")

  // Generated snippet — reactive to all config above
  const snippet = `<script
  src="https://widget.agora.io/v1/embed.js"
  data-agent-id="${agent}"
  data-position="${position}"
  data-primary="${primaryColor}"
  data-voice="${allowVoice}"
  data-text="${allowText}"
  data-greeting="${encodeURIComponent(greeting)}"
  defer
></script>`

  const handleCopy = () => {
    navigator.clipboard?.writeText(snippet)
    toast.success("Snippet copied", { description: "Paste before </body> on your site." })
  }

  const handleSave = () => {
    track(Events.agent_published, { agent_id: agent })
    markActivationStep("deploy")
    toast.success("Widget configured", {
      description: "Paste the snippet on your site and the widget goes live.",
    })
  }

  return (
    <div className="flex flex-col flex-1">
      <DeployNav />

      <main className="flex-1 p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Web Widget</h2>
          <p className="text-sm text-muted-foreground">
            Add a chat / voice button to your website. Drop one script tag and you&apos;re done.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_440px]">
          {/* Config column */}
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  Which agent should answer?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <Label>Agent</Label>
                <Select value={agent} onValueChange={setAgent}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agt_01">Support Bot v2 (Live)</SelectItem>
                    <SelectItem value="agt_03">Appointment Setter (Live)</SelectItem>
                    <SelectItem value="agt_05">Survey Bot (Live)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Appearance
                </CardTitle>
                <CardDescription>The widget inherits your site's typography automatically.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Position</Label>
                    <Select value={position} onValueChange={(v) => setPosition(v as typeof position)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom right</SelectItem>
                        <SelectItem value="bottom-left">Bottom left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="primary-color">Primary color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-9 w-12 p-1 cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="greeting">Greeting</Label>
                  <Input
                    id="greeting"
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder="Hi! How can I help?"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Interaction modes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Voice</p>
                      <p className="text-xs text-muted-foreground">Visitors can press a mic button to talk.</p>
                    </div>
                  </div>
                  <Switch checked={allowVoice} onCheckedChange={setAllowVoice} />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Text chat</p>
                      <p className="text-xs text-muted-foreground">Visitors can type messages.</p>
                    </div>
                  </div>
                  <Switch checked={allowText} onCheckedChange={setAllowText} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Allowed domains</CardTitle>
                <CardDescription>The widget only loads on these hostnames. Use a comma to add more.</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={domains}
                  onChange={(e) => setDomains(e.target.value)}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave}>Save & generate snippet</Button>
              <Button variant="outline" asChild>
                <Link href="/deploy">Cancel</Link>
              </Button>
            </div>
          </div>

          {/* Right rail — snippet + preview */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Tabs defaultValue="preview">
              <TabsList className="w-full">
                <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                <TabsTrigger value="snippet" className="flex-1">Snippet</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="pt-3">
                <Card>
                  <CardContent className="p-6 bg-zinc-100 dark:bg-zinc-900 min-h-[420px] relative rounded-md">
                    {/* Fake website chrome */}
                    <div className="bg-background border rounded-md h-full p-4 flex flex-col gap-2 relative">
                      <div className="h-2 bg-muted rounded w-1/3" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                      <div className="h-2 bg-muted rounded w-1/4" />
                      <div className="h-32 bg-muted/40 rounded mt-2" />
                      <div className="h-2 bg-muted rounded w-2/3" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                      {/* Widget FAB */}
                      <button
                        className={cn(
                          "absolute h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-white",
                          position === "bottom-right" ? "bottom-4 right-4" : "bottom-4 left-4",
                        )}
                        style={{ backgroundColor: primaryColor }}
                      >
                        {allowVoice ? <Mic className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                      </button>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Live preview — changes update as you type
                </p>
              </TabsContent>

              <TabsContent value="snippet" className="pt-3 space-y-2">
                <Card>
                  <CardContent className="p-0 relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-7 px-2 text-xs"
                      onClick={handleCopy}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                    <pre className="font-mono text-xs p-4 overflow-x-auto leading-relaxed pr-16">
                      <code>{snippet}</code>
                    </pre>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="py-3 px-4">
                    <p className="text-xs font-medium">Where to paste it</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Add the snippet right before <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> on any
                      page you want the widget to appear. Works with React, Next.js, Vue, vanilla HTML — anywhere
                      you can drop a script tag.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="bg-muted/40 border-dashed">
              <CardContent className="py-3 px-4 flex items-start gap-2">
                <Badge variant="secondary" className="text-xs mt-0.5 shrink-0">PRO TIP</Badge>
                <p className="text-xs text-muted-foreground leading-snug">
                  Want to embed the widget in a React component instead?{" "}
                  <Link href="/deploy/api" className="underline hover:text-foreground">
                    Use the SDK directly
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
