/**
 * What the law actually asks an AI voice agent to say, per hosting region.
 *
 * Owner ask (2026-09-15): "if I'm in EU region selection pre-load what the
 * compliance needs me to enter here from the respective government sources."
 *
 * One caveat is load-bearing and is printed in the product, not just here: the
 * hosting region is where the AGENT RUNS. The law follows the CALLER. So this
 * is a prompt with a primary source attached, never a determination — and the
 * copy says so.
 *
 * Every entry links the primary source. Checked 2026-09-15.
 */

import type { HostingArea, HostingSelection } from "@/lib/hosting-regions"

export interface DisclosureGuidance {
  /** Does a binding rule require the disclosure in this region? */
  binding: boolean
  /** One or two sentences a person can act on. */
  requirement: string
  /** A sentence that satisfies it. */
  sentence: string
  sourceLabel: string
  sourceUrl: string
  /** Extra duty that lands only when the agent dials out. */
  outbound?: string
}

const EU_SOURCE = {
  sourceLabel: "EU AI Act, Article 50",
  sourceUrl: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50",
}

const UNPINNED: DisclosureGuidance = {
  binding: false,
  requirement:
    "No single country's rule applies, because the agent can run anywhere. Follow the strictest rule your callers live under, which is the EU's.",
  sentence: "Before we start, you're speaking with an AI assistant, not a person.",
  outbound: "If you dial US numbers, the caller's prior express written consent is required before the call.",
  ...EU_SOURCE,
}

export const DISCLOSURE_BY_AREA: Record<HostingArea, DisclosureGuidance> = {
  GLOBAL: {
    ...UNPINNED,
    requirement:
      "No single country's rule applies. Global allows every Agora region, so assume your callers include the EU and keep this on.",
  },
  EUROPE: {
    binding: true,
    requirement:
      "Required. Article 50 says the caller must be told they are dealing with an AI, unless that is already obvious, and it must be clear at the latest on the first exchange.",
    sentence: "Before we start, you're speaking with an AI assistant, not a person.",
    outbound:
      "No extra EU line is required for outbound, but recording or transcribing the call is its own duty under the GDPR.",
    ...EU_SOURCE,
  },
  NORTH_AMERICA: {
    binding: false,
    requirement:
      "Not required by US federal or Canadian law. Utah requires you to say so if the caller asks, and up front in licensed fields like health, legal and finance. California's bot law covers online chat, not phone calls.",
    sentence: "You're speaking with an AI assistant, not a human.",
    outbound:
      "This is the strictest US rule in the product. The FCC ruled in February 2024 that an AI voice counts as an artificial voice under the TCPA, so every outbound AI call needs the called party's prior express written consent.",
    sourceLabel: "Utah Code 13-77-104",
    sourceUrl: "https://le.utah.gov/xcode/Title13/Chapter77/13-77-S104.html",
  },
  ASIA: {
    binding: true,
    requirement:
      "Required if you call South Korea. Article 31 of Korea's AI Framework Act, in force since 22 January 2026, says the user must be told in advance that the service uses AI. No equivalent rule in Singapore or Japan.",
    sentence: "Before we start, you're speaking with an AI assistant, not a person.",
    sourceLabel: "Korea AI Framework Act, Article 31",
    sourceUrl:
      "https://www.loc.gov/item/global-legal-monitor/2026-02-20/south-korea-comprehensive-ai-legal-framework-takes-effect",
  },
  INDIA: {
    binding: false,
    requirement:
      "Not required. No Indian rule makes you tell a caller they are speaking to an AI. The February 2026 IT Rules cover labelling synthetic media, and that duty falls on whoever provides the voice synthesis.",
    sentence: "You're talking to an AI assistant.",
    outbound:
      "Commercial calling into India follows TRAI's rules on sender registration, headers and consent, whether or not the caller is an AI.",
    sourceLabel: "MeitY FAQs on the IT Rules amendment",
    sourceUrl: "https://www.meity.gov.in/static/uploads/2025/10/065b6deb585441b5ccdf8be42502a49c.pdf",
  },
  JAPAN: {
    binding: false,
    requirement:
      "Not required. Japan's AI Promotion Act sets principles and best-efforts duties with no penalties and no mandatory disclosure. Leaving this on is good practice, not compliance.",
    sentence: "You're talking to an AI assistant.",
    sourceLabel: "Act on Promotion of Research, Development and Utilization of AI-Related Technologies",
    sourceUrl:
      "https://oecd.ai/en/dashboards/policy-initiatives/act-on-promotion-of-research,-development,-and-utilization-of-artificial-intelligence-related-technologies",
  },
}

/** Guidance for the region the agent is pinned to, or the unpinned default. */
export function disclosureFor(area: HostingSelection | undefined): DisclosureGuidance {
  if (!area || area === "AUTO") return UNPINNED
  return DISCLOSURE_BY_AREA[area as HostingArea] ?? UNPINNED
}
