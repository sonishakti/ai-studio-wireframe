// Shown in context — SheetFooter pins the actions to the bottom of the panel
// (mt-auto). Featured inside a full open sheet docked to the right edge.
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Label,
  Input,
  Button,
} from 'studio-x'

export const Footer = () => (
  <div className="relative h-[600px] overflow-hidden">
    <Sheet open modal={false}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add concurrency</SheetTitle>
          <SheetDescription>
            Raise the number of simultaneous calls “Aria — Inbound Support” can handle.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="concurrency">Max concurrent calls</Label>
            <Input id="concurrency" type="number" defaultValue="25" />
          </div>
        </div>
        <SheetFooter>
          <Button>Apply</Button>
          <Button variant="outline">Cancel</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </div>
)
