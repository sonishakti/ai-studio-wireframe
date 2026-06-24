import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from 'studio-x'

export const Open = () => (
  <div className="h-96">
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete deployment?</DialogTitle>
          <DialogDescription>
            This stops all live traffic to “Aria — Inbound Support” and releases its phone
            number. This can’t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete deployment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
)
