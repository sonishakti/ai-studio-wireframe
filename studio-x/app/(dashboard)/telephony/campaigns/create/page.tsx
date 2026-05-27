import Link from "next/link"
import { ArrowLeft, Upload } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className ?? ""}`}
      {...props}
    />
  )
}

export default function CreateCampaignPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[
          { label: "Telephony" },
          { label: "Campaigns", href: "/telephony/campaigns" },
          { label: "New Campaign" },
        ]}
        title="New Campaign"
        description="Configure a new outbound dialing campaign."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/telephony/campaigns">Cancel</Link>
            </Button>
            <Button variant="outline">Save as Draft</Button>
            <Button>Create Campaign</Button>
          </div>
        }
      />

      <main className="flex-1 p-6">
        <div className="max-w-2xl space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Campaign Details</CardTitle>
              <CardDescription>Name and assign an agent to this campaign.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input id="campaign-name" placeholder="e.g. Q3 Win-Back" />
              </div>
              <div className="space-y-1.5">
                <Label>Agent</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agt_01">Support Bot v2</SelectItem>
                    <SelectItem value="agt_03">Appointment Setter</SelectItem>
                    <SelectItem value="agt_04">Collections Outreach</SelectItem>
                    <SelectItem value="agt_05">Survey Bot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a number…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pn_01">+1 (415) 555-0101 — Support Line</SelectItem>
                    <SelectItem value="pn_02">+1 (628) 555-0188 — Sales Inbound</SelectItem>
                    <SelectItem value="pn_04">+1 (800) 555-0199 — Toll-Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Schedule</CardTitle>
              <CardDescription>When to run this campaign.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="start-time">Daily Start Time</Label>
                  <Input id="start-time" type="time" defaultValue="09:00" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end-time">Daily End Time</Label>
                  <Input id="end-time" type="time" defaultValue="17:00" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select defaultValue="America/New_York">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contact List</CardTitle>
              <CardDescription>Upload a CSV with phone numbers to dial.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 gap-3 text-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drop a CSV here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Required columns: <span className="font-mono">phone_number</span>. Optional:{" "}
                    <span className="font-mono">name, custom_data</span>
                  </p>
                </div>
                <Button variant="outline" size="sm">Choose File</Button>
              </div>
            </CardContent>
          </Card>

          {/* Dialing settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dialing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Concurrent Calls</Label>
                  <Input type="number" defaultValue="5" min={1} max={100} />
                </div>
                <div className="space-y-1.5">
                  <Label>Retry Attempts</Label>
                  <Input type="number" defaultValue="2" min={0} max={5} />
                </div>
                <div className="space-y-1.5">
                  <Label>Retry Interval</Label>
                  <Select defaultValue="60">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="1440">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Caller ID</Label>
                  <Select defaultValue="campaign">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign">Campaign number</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
