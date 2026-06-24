import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Label,
  Input,
  Textarea,
  Button,
} from 'studio-x'

export const EditDeployment = () => (
  <div className="relative h-[600px] overflow-hidden">
    <Sheet open modal={false}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit deployment</SheetTitle>
          <SheetDescription>
            Reconfigure “Aria — Inbound Support” without taking it offline.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dep-name">Deployment name</Label>
            <Input id="dep-name" defaultValue="Aria — Inbound Support" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dep-greeting">Greeting</Label>
            <Textarea
              id="dep-greeting"
              defaultValue="Hi, thanks for calling Acme. How can I help today?"
            />
          </div>
        </div>
        <SheetFooter>
          <Button>Save changes</Button>
          <Button variant="outline">Cancel</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </div>
)
