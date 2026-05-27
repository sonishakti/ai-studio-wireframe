"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Save, Play, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { track, Events, timeSinceSignup, markSignup } from "@/lib/analytics"

interface Props {
  agentId: string
  isNew: boolean
}

export function AgentEditActions({ agentId, isNew }: Props) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const [publishing, setPublishing] = React.useState(false)
  const [testing, setTesting] = React.useState(false)

  // Demo: pretend a signup happened so TTFA has a starting point
  React.useEffect(() => {
    markSignup()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    track(isNew ? Events.agent_created : Events.agent_published, {
      agent_id: agentId,
      template_id: undefined,
      time_to_first_agent_ms: timeSinceSignup(),
    })
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    toast.success(isNew ? "Agent created" : "Changes saved", {
      description: isNew
        ? "Your new agent is in draft. Publish when ready."
        : "Configuration saved (mock).",
    })
  }

  const handlePublish = async () => {
    setPublishing(true)
    track(Events.agent_published, {
      agent_id: agentId,
      time_to_first_agent_ms: timeSinceSignup(),
    })
    await new Promise((r) => setTimeout(r, 800))
    setPublishing(false)
    toast.success("Agent published 🎉", {
      description: "Your agent is live and ready to take calls.",
      action: { label: "View calls", onClick: () => router.push("/calls") },
    })
  }

  const handleTest = () => {
    setTesting(true)
    track(Events.agent_test_started, { agent_id: agentId })
    setTimeout(() => {
      setTesting(false)
      toast("Test call started", {
        description: "A simulated call is ringing — answer to talk to your agent.",
      })
    }, 400)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleTest} disabled={testing}>
        <Play className="h-3.5 w-3.5" /> {testing ? "Starting…" : "Test"}
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
        <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
      </Button>
      <Button size="sm" className="gap-1.5" onClick={handlePublish} disabled={publishing}>
        <Rocket className="h-3.5 w-3.5" /> {publishing ? "Publishing…" : isNew ? "Publish" : "Republish"}
      </Button>
    </div>
  )
}
