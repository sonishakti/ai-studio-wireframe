import { BillingNav } from "@/components/billing-nav"

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <BillingNav />
      {children}
    </div>
  )
}
