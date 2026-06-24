import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from 'studio-x'

const usage = [
  { agent: 'Aria', minutes: '1,204', cost: '$48.16' },
  { agent: 'Nova', minutes: '862', cost: '$34.48' },
  { agent: 'Echo', minutes: '331', cost: '$13.24' },
]

export function CellAlignment() {
  return (
    <div className="w-full max-w-xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead className="text-right">Minutes</TableHead>
            <TableHead className="text-right">Spend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usage.map((u) => (
            <TableRow key={u.agent}>
              <TableCell className="font-medium">{u.agent}</TableCell>
              <TableCell className="text-right">{u.minutes}</TableCell>
              <TableCell className="text-right text-muted-foreground">{u.cost}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
