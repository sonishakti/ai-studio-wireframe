import { ExtensionClient } from "./extension-client"

/**
 * Server wrapper: pre-generates every known extension slug so this route
 * builds STATIC. Dynamic rendering left client pages under dynamic segments
 * un-hydrated in this app (see /agents/[id]/edit, 2026-07-07). Keys are
 * duplicated here (not imported from the client file: client-module exports
 * are references, unusable in generateStaticParams) — keep in sync with
 * EXTENSIONS in extension-client.tsx.
 */
export function generateStaticParams() {
  return [
    "ext_cloud_recording", "ext_active_fence", "ext_spatial_audio",
    "ext_transcription", "ext_noise_cancel", "ext_sentiment", "face-ar",
  ].map((name) => ({ name }))
}

export default async function ExtensionDetailPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  return <ExtensionClient name={name} />
}
