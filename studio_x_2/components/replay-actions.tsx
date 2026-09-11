"use client"

import * as React from "react"
import { Link as LinkIcon, Download, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Header actions for a replay surface (Design Tracker 10 — verdict A + E + D):
 * `Copy link` gives the pasteable URL without deciding the IA, and the
 * `Download ▾` menu owns every file — recording, transcript, trace — so no
 * tab grows its own download button.
 */

/** Copies an absolute URL built from the current origin. */
export function CopyLinkButton({ path, className }: { path: string; className?: string }) {
  return (
    <Button
      variant="outline" size="sm" className={className ?? "gap-1.5"}
      onClick={() => {
        const href = `${window.location.origin}${path}`
        navigator.clipboard?.writeText(href)
        toast.success("Link copied")
      }}
    >
      <LinkIcon className="h-3.5 w-3.5" /> Copy link
    </Button>
  )
}

export interface DownloadItem {
  label: string
  onSelect: () => void
  disabled?: boolean
  /** Why the item is disabled — stated, never a silent grey. */
  reason?: string
}

export function DownloadMenu({ items, className }: { items: DownloadItem[]; className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className ?? "gap-1.5"}>
          <Download className="h-3.5 w-3.5" /> Download <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {items.map((item) => (
          <React.Fragment key={item.label}>
            <DropdownMenuItem disabled={item.disabled} onSelect={item.onSelect}>
              {item.label}
            </DropdownMenuItem>
            {item.disabled && item.reason && (
              <p className="px-2 pb-1.5 -mt-1 text-xs text-muted-foreground">{item.reason}</p>
            )}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Hands the browser a file built in memory. */
export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
