// Shown in context — AlertDialogHeader stacks title + description (centered on
// small screens, left-aligned in the default size). Featured inside a full open dialog.
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from 'studio-x'

export const Header = () => (
  <div className="h-96">
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Release phone number?</AlertDialogTitle>
          <AlertDialogDescription>
            +1 (415) 555-0142 will be returned to your SIP trunk and detached from
            “Aria — Inbound Support.” Inbound calls will no longer reach this agent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep number</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Release number</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
)
