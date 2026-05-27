import { Settings } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className ?? ""}`}
      {...props}
    />
  )
}

export default function PreferencesPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Preferences" }]}
        title="Preferences"
        description="Manage your account settings and notifications."
      />

      <main className="flex-1 p-6">
        <div className="max-w-2xl space-y-6">
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
                <Select defaultValue="system">
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
                <Select defaultValue="en">
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

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notifications</CardTitle>
              <CardDescription>Control what alerts you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Campaign completed", desc: "When an outbound campaign finishes", enabled: true },
                { label: "Agent errors", desc: "When an agent encounters critical errors", enabled: true },
                { label: "Usage alerts", desc: "When you reach 80% of a plan limit", enabled: true },
                { label: "Billing updates", desc: "Invoices and payment notifications", enabled: false },
                { label: "Product updates", desc: "New features and announcements", enabled: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Badge variant={item.enabled ? "default" : "secondary"}>
                    {item.enabled ? "on" : "off"}
                  </Badge>
                </div>
              ))}
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
                <Button variant="destructive" size="sm">Delete Account</Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
