"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { CampaignWizard } from "@/components/campaign-wizard"
import type { CampaignType } from "@/lib/campaign-data"

export default function NewCampaignPage() {
  const params = useSearchParams()
  const typeParam = params.get("type")
  const agentParam = params.get("agent") ?? undefined
  const initialType: CampaignType | undefined =
    typeParam === "inbound" || typeParam === "outbound" ? typeParam : undefined

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="New campaign"
        description="Pick a type, pick channels, configure each. You can add more channels later."
      />

      <main className="flex-1 p-6">
        <CampaignWizard initialType={initialType} initialAgentId={agentParam} />
      </main>
    </div>
  )
}
