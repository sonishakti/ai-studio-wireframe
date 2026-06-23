"use client"

import Link from "next/link"
import { AlertTriangle, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { credentialsAtRiskForAgent } from "@/lib/campaign-data"
import { recordRemediation, remediationKey } from "@/lib/analytics"

/**
 * CredentialRiskBanner — shown on a deployment's header when its backing agent's
 * stack depends on an expiring/expired vendor key. Names the vendor and routes to
 * the credentials tab; records the remediation so the Diagnostics queue re-checks
 * on return (closing the loop). Renders nothing when there's no risk.
 */
export function CredentialRiskBanner({
  deploymentId,
  agentId,
}: {
  deploymentId: string
  agentId: string
}) {
  const atRisk = credentialsAtRiskForAgent(agentId)
  if (atRisk.length === 0) return null

  return (
    <div className="space-y-2">
      {atRisk.map((c) => {
        const ruleId = c.status === "expired" ? "credential_expired" : "credential_expiring"
        return (
          <Card key={c.id} className="border-destructive/40">
            <CardContent className="flex flex-wrap items-center gap-3 p-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-medium">
                  {c.vendor} key {c.status === "expired" ? "has expired" : `expires ${c.expiresOn ?? "soon"}`}.
                </span>{" "}
                <span className="text-muted-foreground">
                  This deployment runs on it — calls {c.status === "expired" ? "are failing" : "will fail"} until it&apos;s rotated.
                </span>
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
                onClick={() => recordRemediation(remediationKey(ruleId, deploymentId))}
              >
                <Link href="/integrations?tab=credentials">
                  Rotate key <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
