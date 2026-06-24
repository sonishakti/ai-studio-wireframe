// MetricSection + MetricCard — LiveKit-style grouped block of metric cards.
// Section header (chevron + title) over a stack/grid of MetricCard rows.
import { MetricSection, MetricCard, Sparkline } from 'studio-x'

const minutes = [820, 910, 880, 1010, 1240, 1180, 1340, 1290, 1480, 1520, 1610, 1735]

export const Overview = () => (
  <div className="w-[560px]">
    <MetricSection title="This week">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Voice minutes"
          value="12,480"
          unit="min"
          delta="+18%"
          deltaPositive
          chart={<Sparkline data={minutes} height={40} className="text-primary" />}
        />
        <MetricCard
          label="Calls handled"
          value="1,284"
          delta="+9%"
          deltaPositive
          sub="92% resolved without a transfer"
        />
      </div>
    </MetricSection>
  </div>
)

export const Empty = () => (
  <div className="w-[560px]">
    <MetricSection title="Latency breakdown">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Median latency" value="940" unit="ms" />
        <MetricCard
          label="P95 latency"
          value="No calls in this window yet"
          mute
        />
      </div>
    </MetricSection>
  </div>
)
