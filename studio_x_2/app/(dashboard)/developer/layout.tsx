import { DeveloperNav } from "@/components/developer-nav"

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <DeveloperNav />
      {children}
    </div>
  )
}
