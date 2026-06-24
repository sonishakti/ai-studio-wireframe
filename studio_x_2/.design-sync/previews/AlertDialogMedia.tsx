// Shown in context — AlertDialogMedia is the icon slot at the top of the header
// (size-16 muted tile, auto-sizes the SVG to size-8). Featured inside a full open dialog.
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from 'studio-x'
import { AlertTriangle } from 'lucide-react'

export const WithIcon = () => (
  <div className="h-96">
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete deployment?</AlertDialogTitle>
          <AlertDialogDescription>
            This stops all live traffic to “Aria — Inbound Support” and releases its
            phone number. This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete deployment</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
)
