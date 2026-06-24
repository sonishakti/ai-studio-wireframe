import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from 'studio-x'

export const Default = () => (
  <Card className="w-80">
    <CardHeader>
      <CardTitle>Aria — Inbound Support</CardTitle>
      <CardDescription>Handles billing and account questions 24/7.</CardDescription>
    </CardHeader>
    <CardContent className="text-muted-foreground">
      Live since Mar 4 · 1,284 calls this week · 92% resolved without a transfer.
    </CardContent>
    <CardFooter className="gap-2">
      <Button size="sm">Open</Button>
      <Button size="sm" variant="outline">
        Configure
      </Button>
    </CardFooter>
  </Card>
)

export const WithAction = () => (
  <Card className="w-80">
    <CardHeader>
      <CardTitle>Monthly usage</CardTitle>
      <CardDescription>Voice minutes across all deployments</CardDescription>
      <CardAction>
        <Badge variant="secondary">Pro</Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold text-foreground">
        12,480
        <span className="ml-1 text-sm font-normal text-muted-foreground">/ 20,000 min</span>
      </div>
    </CardContent>
  </Card>
)

export const Compact = () => (
  <Card size="sm" className="w-72">
    <CardHeader>
      <CardTitle>Compact card</CardTitle>
      <CardDescription>The sm size tightens padding and gaps for dense dashboards.</CardDescription>
    </CardHeader>
    <CardContent className="text-muted-foreground">Useful in tables and side panels.</CardContent>
  </Card>
)
