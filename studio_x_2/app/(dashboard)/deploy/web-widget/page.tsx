import { WidgetStudio } from "@/components/widget-studio"

// Deploy › Web Widget — the standalone widget studio (Figma 847-17167): the
// post-build MANAGE surface, with an agent picker. The builder no longer links
// out here — Step 4 (web mode) embeds the same studio inline
// (WidgetStudioEmbedded), and both read one per-agent store (lib/widget-config)
// so they can never disagree.
export default function DeployWebWidgetPage() {
  return <WidgetStudio />
}
