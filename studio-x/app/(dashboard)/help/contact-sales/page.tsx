import { Phone, Mail, Calendar, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const SELLING_POINTS = [
  "Volume pricing for >100K agent minutes / month",
  "SSO / SAML and SCIM provisioning",
  "Dedicated CSM and 24×7 priority support",
  "Custom MSA, BAA, DPA — including HIPAA",
  "On-prem and air-gapped deployment options",
  "Custom voice models and language coverage",
]

export default function ContactSalesPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Talk to Sales"
        description="Tell us about your use case — we'll get back within 1 business day."
      />

      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] max-w-5xl">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tell us about your project</CardTitle>
              <CardDescription>The more detail you share, the better we can route your conversation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="firstname">First name</Label><Input id="firstname" /></div>
                <div className="space-y-1.5"><Label htmlFor="lastname">Last name</Label><Input id="lastname" /></div>
                <div className="space-y-1.5"><Label htmlFor="email">Work email</Label><Input id="email" type="email" /></div>
                <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" /></div>
                <div className="space-y-1.5 col-span-2"><Label htmlFor="company">Company</Label><Input id="company" /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Company size</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1–10 employees</SelectItem>
                      <SelectItem value="11-50">11–50 employees</SelectItem>
                      <SelectItem value="51-200">51–200 employees</SelectItem>
                      <SelectItem value="201-1000">201–1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Expected monthly volume</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-10k">&lt; 10k minutes</SelectItem>
                      <SelectItem value="10k-100k">10k–100k minutes</SelectItem>
                      <SelectItem value="100k-1m">100k–1M minutes</SelectItem>
                      <SelectItem value="1m+">1M+ minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usecase">Describe your use case</Label>
                <Textarea
                  id="usecase"
                  rows={5}
                  placeholder="What are you building? What languages / regions / volumes are you targeting?"
                />
              </div>

              <Button className="w-full">Submit</Button>
              <p className="text-xs text-muted-foreground text-center">
                By submitting you agree to be contacted by Agora's sales team.
              </p>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Why talk to sales</CardTitle></CardHeader>
              <CardContent className="space-y-2.5">
                {SELLING_POINTS.map((p) => (
                  <div key={p} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Reach us directly</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <a href="#" className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground">
                  <Mail className="h-4 w-4" /> sales@agora.io
                </a>
                <a href="#" className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground">
                  <Phone className="h-4 w-4" /> +1 (408) 718-6483
                </a>
                <a href="#" className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground">
                  <Calendar className="h-4 w-4" /> Book a 30-min intro call
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
