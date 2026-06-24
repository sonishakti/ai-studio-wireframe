import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from 'studio-x'

const sessions = [
  { id: 'S-3391', turns: 14, latency: '410ms', outcome: 'Resolved' },
  { id: 'S-3390', turns: 7, latency: '380ms', outcome: 'Escalated' },
  { id: 'S-3389', turns: 22, latency: '455ms', outcome: 'Resolved' },
]

export function HeaderRow() {
  return (
    <div className="w-full max-w-xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session</TableHead>
            <TableHead>Turns</TableHead>
            <TableHead>Avg latency</TableHead>
            <TableHead className="text-right">Outcome</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.id}</TableCell>
              <TableCell>{s.turns}</TableCell>
              <TableCell className="text-muted-foreground">{s.latency}</TableCell>
              <TableCell className="text-right">{s.outcome}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
