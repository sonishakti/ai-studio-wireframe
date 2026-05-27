import { Plus, Phone, MoreHorizontal, Search, Upload } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NUMBERS = [
  {
    id: "pn_01",
    number: "+1 (415) 555-0101",
    label: "Support Line",
    vendor: "Twilio",
    sipDomain: "acme.sip.twilio.com",
    agent: "Support Bot v2",
    status: "active",
  },
  {
    id: "pn_02",
    number: "+1 (628) 555-0188",
    label: "Sales Inbound",
    vendor: "Twilio",
    sipDomain: "acme.sip.twilio.com",
    agent: "Sales Qualifier",
    status: "active",
  },
  {
    id: "pn_03",
    number: "+44 20 7946 0958",
    label: "UK Support",
    vendor: "Vonage",
    sipDomain: "sip.nexmo.com",
    agent: "Support Bot v2",
    status: "active",
  },
  {
    id: "pn_04",
    number: "+1 (800) 555-0199",
    label: "Toll-Free",
    vendor: "Bandwidth",
    sipDomain: "api.bandwidth.com",
    agent: "—",
    status: "unassigned",
  },
]

export default function PhoneNumbersPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[
          { label: "Telephony" },
          { label: "Phone Numbers" },
        ]}
        title="Phone Numbers"
        description="Manage DID numbers and SIP trunks for your telephony campaigns."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1.5">
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> Buy Number
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search numbers…" className="pl-8 h-8 text-sm" />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>SIP Domain</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[48px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {NUMBERS.map((num) => (
                  <TableRow key={num.id}>
                    <TableCell className="font-mono text-sm">{num.number}</TableCell>
                    <TableCell className="text-sm">{num.label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{num.vendor}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{num.sipDomain}</TableCell>
                    <TableCell className="text-sm">{num.agent}</TableCell>
                    <TableCell>
                      <Badge variant={num.status === "active" ? "default" : "secondary"}>
                        {num.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Assign Agent</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Release
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
