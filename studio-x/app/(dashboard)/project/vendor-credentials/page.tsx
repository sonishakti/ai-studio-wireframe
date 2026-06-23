import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { VendorCredentialsPanel } from "@/components/vendor-credentials-panel"

// 2026-06-23: vendor keys now also live as a tab inside Integrations (the modules
// hub). This standalone page is kept (deep links / Project area) and shares the
// same body via VendorCredentialsPanel.
export default function VendorCredentialsPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Integrations" }, { label: "Vendor Credentials" }]}
        title="Vendor Credentials"
        description="Third-party API keys used by your agents — LLM, TTS, STT, Telephony."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Add Credential
          </Button>
        }
      />
      <main className="flex-1 p-6">
        <VendorCredentialsPanel />
      </main>
    </div>
  )
}
