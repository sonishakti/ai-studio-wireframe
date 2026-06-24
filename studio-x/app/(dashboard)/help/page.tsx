"use client"

import * as React from "react"
import { HelpCircle, MessageCircle, Ticket, Sparkles, ExternalLink, Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const HELP_LINKS = [
  {
    title: "Documentation",
    description: "Full API reference, guides, and tutorials.",
    href: "https://docs.agora.io",
    icon: HelpCircle,
    external: true,
  },
  {
    title: "Contact Support",
    description: "Chat with the support team or submit a request.",
    href: "/help/contact",
    icon: MessageCircle,
    external: false,
  },
  {
    title: "My Tickets",
    description: "View and track your open support tickets.",
    href: "/help/tickets",
    icon: Ticket,
    external: false,
  },
  {
    title: "What's New",
    description: "Release notes and feature announcements.",
    href: "/help/whats-new",
    icon: Sparkles,
    external: false,
    badge: "New",
  },
]

const POPULAR_ARTICLES: { title: string; href: string }[] = [
  { title: "How to deploy your first voice agent", href: "https://docs.agora.io/en/conversational-ai/get-started/quickstart" },
  { title: "Setting up Twilio as a telephony vendor", href: "https://docs.agora.io/en/conversational-ai/voice-call/sip-twilio" },
  { title: "Connecting OpenAI GPT-4o to your agent", href: "https://docs.agora.io/en/conversational-ai/models/llm" },
  { title: "Understanding completion rate and handle time", href: "https://docs.agora.io/en/conversational-ai/best-practices/metrics" },
  { title: "Exporting call transcripts", href: "https://docs.agora.io/en/conversational-ai/develop/transcript" },
]

export default function HelpPage() {
  const [query, setQuery] = React.useState("")
  const q = query.trim().toLowerCase()
  const articles = q
    ? POPULAR_ARTICLES.filter((a) => a.title.toLowerCase().includes(q))
    : POPULAR_ARTICLES

  return (

      <main className="flex-1 p-6 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="pl-9 h-10"
          />
        </div>

        {/* Navigation cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HELP_LINKS.map((link) => (
            <Card key={link.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {link.badge && <Badge>{link.badge}</Badge>}
                </div>
                <CardTitle className="text-sm mt-2">{link.title}</CardTitle>
                <CardDescription className="text-xs">{link.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noreferrer">
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link href={link.href}>Open</Link>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Popular articles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{q ? "Articles" : "Popular Articles"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
                <Search className="h-6 w-6" />
                <p className="text-sm">No articles match &ldquo;{query}&rdquo;</p>
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <a href="https://docs.agora.io" target="_blank" rel="noreferrer">
                    Search all docs <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            ) : (
              articles.map((article, i) => (
                <div key={article.href}>
                  <a
                    href={article.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between py-2.5 text-sm hover:text-primary transition-colors"
                  >
                    <span>{article.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                  </a>
                  {i < articles.length - 1 && <Separator />}
                </div>
              ))
            )}
          </CardContent>
        </Card>
    </main>
  )
}
