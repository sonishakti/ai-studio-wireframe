"use client"

import { useForm, type SubmitErrorHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { MessageCircle, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Canonical form pattern (mirrors /help/contact-sales): zod schema +
// react-hook-form + per-field error display + success/error toast.
const schema = z.object({
  subject:     z.string().min(3, "Give your request a short subject").max(120),
  category:    z.string().min(1, "Pick a category"),
  description: z.string().min(20, "Describe your issue (20+ chars)").max(2000),
})
type FormValues = z.infer<typeof schema>

const CHANNELS = [
  { icon: MessageCircle, title: "Live Chat", desc: "Mon–Fri, 9 AM–6 PM PT", cta: "Start Chat" },
  { icon: Mail, title: "Email", desc: "Response within 24 hours", cta: "Send Email" },
  { icon: Phone, title: "Phone", desc: "Enterprise customers only", cta: "Request Callback" },
]

export default function ContactPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { subject: "", category: "", description: "" },
  })

  const onSubmit = async (values: FormValues) => {
    await new Promise((r) => setTimeout(r, 700))
    toast.success("Request submitted", {
      description: `We'll follow up by email about "${values.subject}" within 24 hours.`,
    })
    form.reset()
  }

  const onInvalid: SubmitErrorHandler<FormValues> = () => {
    toast.error("Check the highlighted fields", { description: "Some required info is missing or invalid." })
  }

  const errs = form.formState.errors
  const category = form.watch("category")

  return (
    <main className="flex-1 p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 max-w-6xl">
        <div className="space-y-4">
          {CHANNELS.map((c) => (
            <Card key={c.title}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                  <c.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info(`Mock: ${c.cta}`)}
                >
                  {c.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Submit a Request</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="subject" className={errs.subject ? "text-destructive" : ""}>Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  className={cn(errs.subject && "border-destructive focus-visible:ring-destructive")}
                  {...form.register("subject")}
                />
                {errs.subject && <p className="text-xs text-destructive">{errs.subject.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className={errs.category ? "text-destructive" : ""}>Category</Label>
                <Select
                  value={category || undefined}
                  onValueChange={(v) => form.setValue("category", v, { shouldValidate: true, shouldDirty: true })}
                >
                  <SelectTrigger className={cn(errs.category && "border-destructive focus:ring-destructive")}>
                    <SelectValue placeholder="Select a category…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent configuration</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="telephony">Telephony</SelectItem>
                    <SelectItem value="api">API / SDK</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errs.category && <p className="text-xs text-destructive">{errs.category.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className={errs.description ? "text-destructive" : ""}>Description</Label>
                <Textarea
                  id="description"
                  rows={6}
                  placeholder="Describe your issue in detail…"
                  className={cn(errs.description && "border-destructive focus-visible:ring-destructive")}
                  {...form.register("description")}
                />
                {errs.description
                  ? <p className="text-xs text-destructive">{errs.description.message}</p>
                  : <p className="text-xs text-muted-foreground">Minimum 20 characters.</p>}
              </div>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting…" : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
