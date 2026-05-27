import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { AgentEditActions } from "@/components/agent-edit-actions"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"


interface Props {
  params: Promise<{ id: string }>
}

export default async function AgentEditPage({ params }: Props) {
  const { id } = await params
  const isNew = id === "new"

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[
          { label: "Agents", href: "/agents" },
          { label: isNew ? "New Agent" : "Support Bot v2" },
        ]}
        title={isNew ? "New Agent" : "Support Bot v2"}
        description={isNew ? "Configure your voice AI agent." : "Edit agent configuration."}
        actions={<AgentEditActions agentId={id} isNew={isNew} />}
      />

      <main className="flex-1 p-6">
        <Tabs defaultValue="prompt" className="space-y-4">
          <TabsList>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Prompt tab */}
          <TabsContent value="prompt" className="space-y-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Agent Identity</CardTitle>
                  <CardDescription>Basic information about this agent.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue={isNew ? "" : "Support Bot v2"} placeholder="e.g. Support Bot" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="agent-prompt">System Prompt</Label>
                    <Textarea
                      id="agent-prompt"
                      rows={8}
                      defaultValue={
                        isNew
                          ? ""
                          : `You are a helpful support agent for Acme Corp. Your goal is to:
1. Greet the caller warmly
2. Identify their issue
3. Resolve tier-1 issues directly
4. Escalate complex issues to a human agent

Always be professional, concise, and empathetic.`
                      }
                      placeholder="Describe your agent's role, personality, and goals…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="first-message">First Message</Label>
                    <Input
                      id="first-message"
                      defaultValue={isNew ? "" : "Hi, thanks for calling Acme support. How can I help you today?"}
                      placeholder="What the agent says first…"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Conversation Settings</CardTitle>
                  <CardDescription>Control tone, language, and flow.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Language</Label>
                    <Select defaultValue="en-US">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="es-US">Spanish (US)</SelectItem>
                        <SelectItem value="fr-FR">French</SelectItem>
                        <SelectItem value="de-DE">German</SelectItem>
                        <SelectItem value="pt-BR">Portuguese (BR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max Duration</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-1.5">
                    <Label htmlFor="end-call-message">End-Call Message</Label>
                    <Input
                      id="end-call-message"
                      defaultValue={isNew ? "" : "Thank you for calling. Have a great day!"}
                      placeholder="Message played before hanging up…"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Models tab */}
          <TabsContent value="models" className="space-y-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[
                { label: "LLM", subtitle: "Language model", value: "gpt-4o" },
                { label: "Voice (TTS)", subtitle: "Text-to-speech", value: "eleven_multilingual_v2" },
                { label: "STT", subtitle: "Speech-to-text", value: "deepgram-nova-3" },
              ].map((m) => (
                <Card key={m.label}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{m.label}</CardTitle>
                    <CardDescription>{m.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="font-mono text-xs">{m.value}</Badge>
                    <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
                      Change
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Actions tab */}
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Agent Actions</CardTitle>
                <CardDescription>
                  Tools and integrations the agent can use during a call.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "transfer_call", type: "built-in", enabled: true },
                  { name: "hang_up", type: "built-in", enabled: true },
                  { name: "send_sms", type: "built-in", enabled: false },
                  { name: "check_order_status", type: "custom", enabled: true },
                  { name: "create_ticket", type: "custom", enabled: false },
                ].map((action) => (
                  <div
                    key={action.name}
                    className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium">{action.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{action.type}</p>
                    </div>
                    <Badge variant={action.enabled ? "default" : "secondary"}>
                      {action.enabled ? "enabled" : "disabled"}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2">
                  + Add Action
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced tab */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Advanced Configuration</CardTitle>
                <CardDescription>
                  Interruption handling, silence detection, and more.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Interruption Sensitivity</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Silence Timeout (ms)</Label>
                    <Input type="number" defaultValue="2000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max Retries</Label>
                    <Input type="number" defaultValue="3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Response Timeout (ms)</Label>
                    <Input type="number" defaultValue="10000" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
