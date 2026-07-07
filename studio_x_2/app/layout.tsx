import type { Metadata } from "next"
import { Instrument_Sans, Space_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { CommandPalette } from "@/components/command-palette"
import { cn } from "@/lib/utils"

// Figma Typography collection: font-sans = Instrument Sans · font-mono = Space Mono.
const fontSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Studio_X · Agora",
  description: "Design and publish voice AI agents",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(fontSans.variable, fontMono.variable)}
    >
      <body className="antialiased font-sans">
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <CommandPalette />
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
