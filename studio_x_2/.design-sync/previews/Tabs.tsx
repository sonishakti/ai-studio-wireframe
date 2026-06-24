import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from 'studio-x'
import { LayoutDashboard, Phone, Settings } from 'lucide-react'

export const Default = () => (
  <Tabs defaultValue="overview" className="w-96">
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="calls">Calls</TabsTrigger>
      <TabsTrigger value="config">Configuration</TabsTrigger>
    </TabsList>
    <TabsContent value="overview" className="text-muted-foreground">
      1,284 calls this week · 92% resolved · avg handle time 2m 14s.
    </TabsContent>
    <TabsContent value="calls" className="text-muted-foreground">
      Recent call log appears here.
    </TabsContent>
    <TabsContent value="config" className="text-muted-foreground">
      Stack, persona, and routing settings.
    </TabsContent>
  </Tabs>
)

export const LineVariant = () => (
  <Tabs defaultValue="calls" className="w-96">
    <TabsList variant="line">
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="calls">Call History</TabsTrigger>
      <TabsTrigger value="chats">Chat History</TabsTrigger>
      <TabsTrigger value="sessions">Sessions</TabsTrigger>
    </TabsList>
    <TabsContent value="calls" className="text-muted-foreground">
      342 inbound calls · underlined active tab (line variant).
    </TabsContent>
  </Tabs>
)

export const WithIcons = () => (
  <Tabs defaultValue="overview" className="w-96">
    <TabsList>
      <TabsTrigger value="overview">
        <LayoutDashboard />
        Overview
      </TabsTrigger>
      <TabsTrigger value="numbers">
        <Phone />
        Numbers
      </TabsTrigger>
      <TabsTrigger value="settings">
        <Settings />
        Settings
      </TabsTrigger>
    </TabsList>
    <TabsContent value="overview" className="text-muted-foreground">
      Deployment health, live traffic, and channel mix.
    </TabsContent>
  </Tabs>
)
