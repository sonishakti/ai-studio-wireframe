"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarMenuButton } from "@/components/ui/sidebar"

/**
 * Right-side button in the sidebar footer.
 * Clicking it navigates to /preferences which is account-scoped, so the
 * layout swaps the sidebar to AccountSidebar — the "account drawer" pattern
 * from the Figma without rebuilding nav state.
 */
export function AccountAvatarButton() {
  const router = useRouter()

  return (
    <SidebarMenuButton
      size="default"
      tooltip="Account"
      className="!w-9 !h-9 shrink-0 justify-center !p-0"
      onClick={() => router.push("/preferences")}
    >
      <Avatar className="h-7 w-7 rounded-lg">
        <AvatarImage src="" alt="User" />
        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-[11px] font-medium">
          SS
        </AvatarFallback>
      </Avatar>
      <span className="sr-only">Account</span>
    </SidebarMenuButton>
  )
}
