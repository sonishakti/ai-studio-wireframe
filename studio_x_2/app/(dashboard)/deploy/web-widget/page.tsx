import { WidgetStudio } from "@/components/widget-studio"

// Deploy › Web Widget — the widget studio (Figma 847-17167). Was a redirect
// into the wizard; the full configurator (behaviour · appearance · text ·
// branding · live preview · embed) now lives here, and the wizard's web-widget
// step links out for the deep config.
export default function DeployWebWidgetPage() {
  return <WidgetStudio />
}
