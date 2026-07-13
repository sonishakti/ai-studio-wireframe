"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

/**
 * CodeBlock — standardized code-snippet display with one-click copy.
 * Use this anywhere we show code, install commands, or curl examples.
 * Replaces ad-hoc <pre><code> + copy-button combos that drift in style.
 *
 *   <CodeBlock language="bash">npm install agora-x</CodeBlock>
 *   <CodeBlock language="typescript" filename="server.ts">{snippet}</CodeBlock>
 */
export function CodeBlock({
  children,
  language,
  filename,
  className,
  variant = "default",
  onCopy,
}: {
  children: string
  language?: string
  filename?: string
  className?: string
  variant?: "default" | "inline"
  /** Hook for callers whose state tracks what was copied (e.g. the widget
   *  studio's embed-truth line). The clipboard write + toast stay here. */
  onCopy?: () => void
}) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(children)
    onCopy?.()
    setCopied(true)
    toast.success("Copied")
    setTimeout(() => setCopied(false), 1500)
  }

  if (variant === "inline") {
    return (
      <div className={cn("relative rounded-md border bg-muted/40", className)}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1.5 top-1.5 h-6 w-6 z-10"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
        </Button>
        <pre className="font-mono text-xs px-3 py-2 pr-9 overflow-x-auto leading-relaxed">
          <code>{children}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className={cn("relative rounded-lg border bg-muted/40 overflow-hidden", className)}>
      {/* Header bar — filename + language + copy */}
      {(filename || language) && (
        <div className="flex items-center justify-between border-b bg-background/60 px-3 py-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {filename && (
              <span className="font-mono text-xs text-foreground truncate">{filename}</span>
            )}
            {language && (
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                {language}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={handleCopy}>
            {copied
              ? <><Check className="h-3 w-3 text-emerald-500" /> Copied</>
              : <><Copy className="h-3 w-3" /> Copy</>}
          </Button>
        </div>
      )}
      {/* Code body */}
      <div className="relative">
        {!filename && !language && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1.5 top-1.5 h-7 w-7 z-10"
            onClick={handleCopy}
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-emerald-500" />
              : <Copy className="h-3.5 w-3.5" />}
            <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
          </Button>
        )}
        <pre className="font-mono text-xs p-4 overflow-x-auto leading-relaxed whitespace-pre">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  )
}
