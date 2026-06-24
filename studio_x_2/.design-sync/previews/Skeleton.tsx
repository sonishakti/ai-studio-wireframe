import { Skeleton } from 'studio-x'

export function AgentCardLoading() {
  return (
    <div className="flex w-72 items-center gap-4 rounded-lg border p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

export function CallLogLoading() {
  return (
    <div className="flex w-80 flex-col gap-3 rounded-lg border p-4">
      <Skeleton className="h-5 w-40" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}
