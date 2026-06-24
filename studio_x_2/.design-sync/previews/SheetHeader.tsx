// Shown in context — SheetHeader holds the title + description at the top of the
// sliding panel. Featured inside a full open sheet docked to the right edge.
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Label,
  Input,
} from 'studio-x'

export const Header = () => (
  <div className="relative h-[600px] overflow-hidden">
    <Sheet open modal={false}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Connect a phone number</SheetTitle>
          <SheetDescription>
            Route inbound calls from your SIP trunk to “Aria — Inbound Support.”
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sip-uri">SIP trunk URI</Label>
            <Input id="sip-uri" defaultValue="sip:trunk@acme.pstn.twilio.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="caller-id">Caller ID</Label>
            <Input id="caller-id" defaultValue="+1 (415) 555-0142" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
)
