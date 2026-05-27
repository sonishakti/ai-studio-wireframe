import { MessageCircle, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={`text-sm font-medium leading-none ${className ?? ""}`} {...props} />
}
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${className ?? ""}`} {...props} />
}

export default function ContactPage() {
  return (
    <main className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 max-w-6xl">
          <div className="space-y-4">
            {[
              { icon: MessageCircle, title: "Live Chat", desc: "Mon–Fri, 9 AM–6 PM PT", cta: "Start Chat" },
              { icon: Mail, title: "Email", desc: "Response within 24 hours", cta: "Send Email" },
              { icon: Phone, title: "Phone", desc: "Enterprise customers only", cta: "Request Callback" },
            ].map((c) => (
              <Card key={c.title}>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <c.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                  <Button variant="outline" size="sm">{c.cta}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm">Submit a Request</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label>Subject</Label><Input placeholder="Brief description of your issue" /></div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select a category…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent configuration</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="telephony">Telephony</SelectItem>
                    <SelectItem value="api">API / SDK</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea rows={6} placeholder="Describe your issue in detail…" /></div>
              <Button className="w-full">Submit Request</Button>
            </CardContent>
          </Card>
      </div>
    </main>
  )
}
