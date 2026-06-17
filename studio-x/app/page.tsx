import { redirect } from "next/navigation"

// 2026-06-17 activation-revenue realignment: root lands on the Go Live home
// (the deploy hub Overview), not the Agents list. Getting a live deployment that
// carries traffic — not publishing an agent — is the activation north star.
export default function Root() {
  redirect("/deploy")
}
