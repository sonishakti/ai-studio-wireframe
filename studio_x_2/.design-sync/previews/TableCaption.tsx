import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from 'studio-x'

const numbers = [
  { number: '+1 (415) 555-0142', region: 'US · CA', agent: 'Aria' },
  { number: '+44 20 7946 0321', region: 'UK · London', agent: 'Nova' },
  { number: '+1 (212) 555-0177', region: 'US · NY', agent: 'Aria' },
]

export function CaptionedTable() {
  return (
    <div className="w-full max-w-xl">
      <Table>
        <TableCaption>Phone numbers routed to live agents (BYO SIP).</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Region</TableHead>
            <TableHead className="text-right">Routed to</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {numbers.map((n) => (
            <TableRow key={n.number}>
              <TableCell className="font-medium">{n.number}</TableCell>
              <TableCell className="text-muted-foreground">{n.region}</TableCell>
              <TableCell className="text-right">{n.agent}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
