// Sparkline — tiny inline SVG trend line (no recharts). The line inherits the
// token-driven text color set via className.
import { Sparkline } from 'studio-x'

const minutes = [820, 910, 880, 1010, 1240, 1180, 1340, 1290, 1480, 1520, 1610, 1735]
const latency = [640, 610, 690, 720, 700, 760, 880, 940, 910, 1020, 980, 1140]

export const Trend = () => (
  <div className="w-72">
    <Sparkline data={minutes} className="text-primary" />
  </div>
)

export const WithAxis = () => (
  <div className="w-72">
    <Sparkline data={minutes} axisLabels={["Jun 1", "Jun 12"]} height={72} className="text-primary" />
  </div>
)

export const Muted = () => (
  <div className="w-72">
    <Sparkline data={latency} className="text-muted-foreground" />
  </div>
)
