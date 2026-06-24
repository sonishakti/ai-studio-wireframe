// MetricCard — single metric in the LiveKit overview pattern: label, value with
// unit, optional delta + sparkline, and a muted empty state.
import { MetricCard, Sparkline } from 'studio-x'

const minutes = [820, 910, 880, 1010, 1240, 1180, 1340, 1290, 1480, 1520, 1610, 1735]

export const Default = () => (
  <MetricCard
    className="w-64"
    label="Voice minutes"
    value="12,480"
    unit="min"
    delta="+18%"
    deltaPositive
    sub="vs. previous 7 days"
  />
)

export const WithChart = () => (
  <MetricCard
    className="w-64"
    label="Calls handled"
    value="1,284"
    delta="+9%"
    deltaPositive
    chart={<Sparkline data={minutes} height={40} className="text-primary" />}
  />
)

export const NoData = () => (
  <MetricCard
    className="w-64"
    label="P95 latency"
    value="No calls in this window yet"
    mute
  />
)
