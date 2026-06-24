"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"

interface Props {
  /** Trigger element — usually a DropdownMenuItem */
  children: React.ReactNode
  /** Short verb — Delete, Archive, Revoke, Release, Remove */
  action: string
  /** What's being acted on — used in title + telemetry */
  resource: string
  resourceId: string
  /** Specific name being acted on (e.g. "Support Bot v2") */
  resourceName?: string
  /** Override the description copy */
  description?: string
  /** Optional success toast message (defaults to "<Action> complete") */
  successMessage?: string
  /** What runs after user confirms (defaults to firing a toast) */
  onConfirm?: () => void
}

/**
 * Wraps any trigger element in a destructive confirmation dialog.
 *
 * Fires telemetry on both confirm and cancel so we can measure whether
 * the dialog is actually preventing real errors (per `references/measure.md`
 * counter-metric: AlertDialog confirm rate hitting 100% means it isn't).
 */
export function DestructiveActionDialog({
  children,
  action,
  resource,
  resourceId,
  resourceName,
  description,
  successMessage,
  onConfirm,
}: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action} {resourceName ? `"${resourceName}"` : resource}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description ??
              `This action cannot be undone. The ${resource.toLowerCase()} will be permanently removed.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() =>
              track(Events.destructive_action_canceled, {
                resource,
                resource_id: resourceId,
              })
            }
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              track(Events.destructive_action_confirmed, {
                resource,
                resource_id: resourceId,
              })
              if (onConfirm) {
                onConfirm()
              } else {
                toast.success(successMessage ?? `${action} complete`, {
                  description: `${resourceName ?? resource} was ${action.toLowerCase()}d (mock).`,
                })
              }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
