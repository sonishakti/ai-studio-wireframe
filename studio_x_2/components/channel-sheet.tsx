"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet"
import { EngineRow, FlatRow } from "@/components/wizard/engine-row"
import {
  ROW_KIND_LABEL, readDemand, setDemand,
  type ChannelAsk, type ChannelRowKind,
} from "@/lib/channels"

/**
 * Channel sheet — the one place a channel's truth lives (Design Tracker 18,
 * verdict C). It is the door from the builder's Inbound fold and from every
 * inventory row whose href is null, so no row can loop back to the page it was
 * clicked from. Rows that DO have a page keep it.
 *
 * SURFACE level only: it states what each channel needs and records an ask. It
 * carries no account value — no number, no agent, no submission date — so it
 * reads identically from both entry points and cannot say something true in
 * one view and false in the other. It never becomes a form: the moment it
 * takes a WhatsApp account id, a sender or a template name it is drawing an
 * API nobody has written.
 *
 * The footer holds Close and no primary. The ask names ONE channel at its own
 * row, so there is nothing for a footer button to refer to.
 */
export function ChannelSheet({
  open,
  onOpenChange,
  focus,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Land on this block. It changes where you start, never what the sheet
   *  says — a kind with no block here (batch, code) opens at the top. */
  focus?: ChannelRowKind
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-base">See what each channel needs</SheetTitle>
          <SheetDescription>
            Phone and web work today. WhatsApp and SMS do not run on Agora yet.
          </SheetDescription>
        </SheetHeader>

        <ChannelBlocks focus={focus} />

        <SheetFooter className="shrink-0 border-t border-border px-5 py-3">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/**
 * The body, mounted with the sheet. One ask, one store: the switches here and
 * the ones in the builder's Inbound fold read the same `sx:channel_demand`, so
 * reading it lazily on mount is what keeps them from becoming two states (the
 * same lazy-read idiom as `useStoredState`, for the same reason).
 */
function ChannelBlocks({ focus }: { focus?: ChannelRowKind }) {
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const [asks, setAsks] = React.useState<ChannelAsk[]>(() => readDemand())

  const toggle = (ask: ChannelAsk) => (on: boolean) => {
    setDemand(ask, on)
    setAsks(readDemand())
  }

  // Landing: after the sheet has laid out (same wait as the advanced panel).
  React.useEffect(() => {
    if (!focus) return
    const t = window.setTimeout(() => {
      bodyRef.current?.querySelector<HTMLElement>(`#ch-${focus}`)?.scrollIntoView({ block: "start" })
    }, 60)
    return () => window.clearTimeout(t)
  }, [focus])

  return (
    <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
      <div className="divide-y divide-border">
        <Block kind="telephony">
          <FlatRow
            title={ROW_KIND_LABEL.telephony}
            description="Answer calls 24/7 on numbers you bring over SIP."
            control={
              <Button variant="outline" size="sm" asChild>
                <Link href="/deploy/phone-numbers">Manage numbers</Link>
              </Button>
            }
          />
        </Block>

        <Block kind="web">
          <FlatRow
            title={ROW_KIND_LABEL.web}
            description="A floating voice widget for your website."
            control={
              <Button variant="outline" size="sm" asChild>
                <Link href="/deploy/web-widget">Open the Widget studio</Link>
              </Button>
            }
          >
            {/* What the widget still cannot do. Both stay live controls: the
                switch records the ask, the caption states the dependency. */}
            <div className="mt-2 divide-y divide-border border-t border-border pt-3">
              <EngineRow
                title="Allowed sites"
                description="Agora has no origin check yet, so a copied snippet runs wherever it is pasted."
                checked={asks.includes("origins")}
                onCheckedChange={toggle("origins")}
              />
              <EngineRow
                title="Text only, no voice leg"
                description="Chat only still opens a voice session, and it bills the same as voice."
                checked={asks.includes("text_only")}
                onCheckedChange={toggle("text_only")}
              />
            </div>
          </FlatRow>
        </Block>

        <Block kind="whatsapp">
          <EngineRow
            title={ROW_KIND_LABEL.whatsapp}
            description="One number carries two runtimes: messages take text behaviour, calls take voice behaviour."
            checked={asks.includes("whatsapp")}
            onCheckedChange={toggle("whatsapp")}
          />
        </Block>

        <Block kind="sms">
          <EngineRow
            title={ROW_KIND_LABEL.sms}
            description="A carrier reviews the business, the brand and the campaign before the first message sends."
            checked={asks.includes("sms")}
            onCheckedChange={toggle("sms")}
          />
        </Block>
      </div>
    </div>
  )
}

/** One channel's block. The wrapper owns the rhythm so the row inside sits
 *  flush (FlatRow zeroes its own padding when it is an only child), and the id
 *  is what `focus` lands on. */
function Block({ kind, children }: { kind: ChannelRowKind; children: React.ReactNode }) {
  return (
    <div id={`ch-${kind}`} className="scroll-mt-4 py-4 first:pt-0 last:pb-0">
      {children}
    </div>
  )
}
