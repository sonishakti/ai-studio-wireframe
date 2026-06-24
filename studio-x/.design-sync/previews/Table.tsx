import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from 'studio-x'

const calls = [
  { id: 'CL-8842', agent: 'Aria', number: '+1 (415) 555-0142', minutes: '4:12', status: 'Completed' },
  { id: 'CL-8841', agent: 'Nova', number: '+1 (628) 555-0199', minutes: '1:48', status: 'Completed' },
  { id: 'CL-8840', agent: 'Aria', number: '+44 20 7946 0321', minutes: '0:36', status: 'Dropped' },
  { id: 'CL-8839', agent: 'Nova', number: '+1 (212) 555-0177', minutes: '6:55', status: 'Completed' },
]

export function CallLog() {
  return (
    <div className="w-full max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Call ID</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Caller</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.id}</TableCell>
              <TableCell>{c.agent}</TableCell>
              <TableCell className="text-muted-foreground">{c.number}</TableCell>
              <TableCell className="text-right">{c.minutes}</TableCell>
              <TableCell className="text-right">{c.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total minutes today</TableCell>
            <TableCell className="text-right" colSpan={2}>
              13:31
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

export function DeploymentTable() {
  const rows = [
    { name: 'Inbound Support', channel: 'Phone', agent: 'Aria', live: 'Live' },
    { name: 'Renewal Outreach', channel: 'Batch Calls', agent: 'Nova', live: 'Paused' },
    { name: 'Web Concierge', channel: 'Web Widget', agent: 'Aria', live: 'Live' },
  ]
  return (
    <div className="w-full max-w-2xl">
      <Table>
        <TableCaption>Active deployments across the Acme project.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Deployment</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead className="text-right">State</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.name}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-muted-foreground">{r.channel}</TableCell>
              <TableCell>{r.agent}</TableCell>
              <TableCell className="text-right">{r.live}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
