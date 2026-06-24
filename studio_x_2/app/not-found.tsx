import Link from "next/link"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FileQuestion className="h-7 w-7 text-muted-foreground" />
          </div>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">404</p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Page not found</h1>
          <p className="text-sm text-muted-foreground mt-2">
            The page you're looking for has moved, was renamed, or never existed.
            Try the home page or use ⌘K to search.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/agents">
              <Home className="h-4 w-4" /> Home
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" /> View all projects
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
