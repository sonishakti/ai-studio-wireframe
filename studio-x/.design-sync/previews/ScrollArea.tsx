import { ScrollArea } from 'studio-x'

const calls = [
  { id: 'CL-8842', dur: '4:12' },
  { id: 'CL-8841', dur: '1:48' },
  { id: 'CL-8840', dur: '0:36' },
  { id: 'CL-8839', dur: '6:55' },
  { id: 'CL-8838', dur: '2:09' },
  { id: 'CL-8837', dur: '3:31' },
  { id: 'CL-8836', dur: '0:52' },
  { id: 'CL-8835', dur: '5:18' },
  { id: 'CL-8834', dur: '1:04' },
  { id: 'CL-8833', dur: '2:47' },
  { id: 'CL-8832', dur: '4:40' },
  { id: 'CL-8831', dur: '0:19' },
]

export function CallHistoryScroll() {
  return (
    <ScrollArea className="h-48 w-64 rounded-md border">
      <div className="flex flex-col p-3">
        <span className="mb-2 text-sm font-medium">Recent calls — Aria</span>
        {calls.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between py-2 text-sm"
          >
            <span>{c.id}</span>
            <span className="text-muted-foreground">{c.dur}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
