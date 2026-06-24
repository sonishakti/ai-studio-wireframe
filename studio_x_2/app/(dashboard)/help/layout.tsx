import { HelpNav } from "@/components/help-nav"

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <HelpNav />
      {children}
    </div>
  )
}
