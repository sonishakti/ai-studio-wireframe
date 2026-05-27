"use client"

import * as React from "react"
import { useForm, type SubmitErrorHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Phone, Mail, Calendar, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { track, Events } from "@/lib/analytics"
import { cn } from "@/lib/utils"

// ─── Validation schema ──────────────────────────────────────────────────────
// Single source of truth for what "valid" means. /evaluate Issue 7 fix.
//
// This is the canonical pattern for forms across the app — zod schema +
// react-hook-form + per-field error display. Other forms (Project Settings,
// Agent editor, etc.) should follow this shape.

const schema = z.object({
  firstName: z.string().min(1, "Required").max(50),
  lastName:  z.string().min(1, "Required").max(50),
  email:     z.string().min(1, "Required").email("Use a valid email address"),
  phone:     z.string().regex(/^[+\d\s()-]{7,}$/, "Use a valid phone number").or(z.literal("")),
  company:   z.string().min(2, "Tell us your company name").max(80),
  size:      z.string().min(1, "Pick a size"),
  volume:    z.string().min(1, "Pick a volume"),
  usecase:   z.string().min(20, "Give us at least a sentence (20+ chars)").max(2000),
})
type FormValues = z.infer<typeof schema>

const SELLING_POINTS = [
  "Volume pricing for >100K agent minutes / month",
  "SSO / SAML and SCIM provisioning",
  "Dedicated CSM and 24×7 priority support",
  "Custom MSA, BAA, DPA — including HIPAA",
  "On-prem and air-gapped deployment options",
  "Custom voice models and language coverage",
]

// ─── component ──────────────────────────────────────────────────────────────

export default function ContactSalesPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",   // validate when leaving a field — feels like the
                      // pattern users expect (not too eager, not too late)
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "",
      company: "", size: "", volume: "", usecase: "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    await new Promise((r) => setTimeout(r, 800))
    toast.success("Request sent", {
      description: `Thanks ${values.firstName}, our sales team will follow up within 1 business day.`,
    })
    form.reset()
  }

  const onInvalid: SubmitErrorHandler<FormValues> = (errors) => {
    // Tell the analytics layer which field failed — counts toward
    // /measure form_validation_failed counter-metric.
    for (const [field, err] of Object.entries(errors)) {
      const message = typeof err === "object" && err && "message" in err ? String(err.message ?? "") : ""
      const type    = typeof err === "object" && err && "type" in err    ? String(err.type ?? "")    : ""
      track(Events.form_validation_failed, { form: "contact-sales", field, error: message || type || "unknown" })
    }
    toast.error("Check the highlighted fields", { description: "Some required info is missing or invalid." })
  }

  const errs = form.formState.errors

  return (
    <main className="flex-1 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Talk to Sales</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tell us about your use case — we'll get back within 1 business day.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tell us about your project</CardTitle>
            <CardDescription>The more detail you share, the better we can route your conversation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <FieldText form={form} name="firstName" label="First name" error={errs.firstName?.message} />
                <FieldText form={form} name="lastName"  label="Last name"  error={errs.lastName?.message} />
                <FieldText form={form} name="email"     label="Work email" type="email" error={errs.email?.message} />
                <FieldText form={form} name="phone"     label="Phone (optional)" type="tel" error={errs.phone?.message} />
                <div className="col-span-2">
                  <FieldText form={form} name="company" label="Company" error={errs.company?.message} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldSelect
                  form={form} name="size" label="Company size" error={errs.size?.message}
                  options={[
                    { v: "1-10",     l: "1–10 employees" },
                    { v: "11-50",    l: "11–50 employees" },
                    { v: "51-200",   l: "51–200 employees" },
                    { v: "201-1000", l: "201–1000 employees" },
                    { v: "1000+",    l: "1000+ employees" },
                  ]}
                />
                <FieldSelect
                  form={form} name="volume" label="Expected monthly volume" error={errs.volume?.message}
                  options={[
                    { v: "under-10k", l: "< 10k minutes" },
                    { v: "10k-100k",  l: "10k–100k minutes" },
                    { v: "100k-1m",   l: "100k–1M minutes" },
                    { v: "1m+",       l: "1M+ minutes" },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usecase" className={errs.usecase ? "text-destructive" : ""}>
                  Describe your use case
                </Label>
                <Textarea
                  id="usecase"
                  rows={5}
                  placeholder="What are you building? What languages / regions / volumes are you targeting?"
                  className={errs.usecase ? "border-destructive focus-visible:ring-destructive" : ""}
                  {...form.register("usecase")}
                />
                {errs.usecase
                  ? <p className="text-xs text-destructive">{errs.usecase.message}</p>
                  : <p className="text-xs text-muted-foreground">Minimum 20 characters.</p>}
              </div>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Sending…" : "Submit"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By submitting you agree to be contacted by Agora's sales team.
              </p>
            </form>
          </CardContent>
        </Card>

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
  )
}

// ─── small field components ─────────────────────────────────────────────────

function FieldText({
  form, name, label, type = "text", error,
}: {
  form: ReturnType<typeof useForm<FormValues>>
  name: keyof FormValues
  label: string
  type?: string
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className={error ? "text-destructive" : ""}>{label}</Label>
      <Input
        id={name}
        type={type}
        className={cn(error && "border-destructive focus-visible:ring-destructive")}
        {...form.register(name)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function FieldSelect({
  form, name, label, error, options,
}: {
  form: ReturnType<typeof useForm<FormValues>>
  name: keyof FormValues
  label: string
  error?: string
  options: Array<{ v: string; l: string }>
}) {
  const value = form.watch(name)
  return (
    <div className="space-y-1.5">
      <Label className={error ? "text-destructive" : ""}>{label}</Label>
      <Select
        value={value || undefined}
        onValueChange={(v) => form.setValue(name, v, { shouldValidate: true, shouldDirty: true })}
      >
        <SelectTrigger className={cn(error && "border-destructive focus:ring-destructive")}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
