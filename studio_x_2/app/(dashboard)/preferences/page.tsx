"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function PreferencesPage() {
  const [theme, setTheme] = React.useState("system")
  const [language, setLanguage] = React.useState("en")
  const [dirty, setDirty] = React.useState(false)

  const markDirty = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setDirty(true)
  }

  const handleSave = () => {
    setDirty(false)
    toast.success("Preferences saved")
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Preferences" }]}
        title="Preferences"
        description="Manage your account settings and notifications."
        actions={
          <Button onClick={handleSave} disabled={!dirty}>
            Save Changes
          </Button>
        }
      />

      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Appearance</CardTitle>
              <CardDescription>Customize the visual experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Theme</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Press <kbd className="rounded border px-1 font-mono text-xs">d</kbd> to toggle
                  </p>
                </div>
                <Select value={theme} onValueChange={markDirty(setTheme)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Language</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Console display language</p>
                </div>
                <Select value={language} onValueChange={markDirty(setLanguage)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="ko">한국어</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications — managed per-project; link out, don't fake toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notifications</CardTitle>
              <CardDescription>
                Channel and event preferences are configured per project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Manage notification preferences</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose which events reach Email, In-app, Slack, and Webhook.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="gap-1.5 shrink-0">
                  <Link href="/notifications">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Delete account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove your account and all data.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes your account, all projects, agents, and
                        usage data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => toast.info("Confirmation email sent to your account owner")}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
