"use client"

/**
 * Tiny inline sparkline — no recharts, just SVG. Matches the LiveKit
 * overview pattern where each metric card has a minimal trend line.
 */
export function Sparkline({
  data,
  axisLabels,
  height = 56,
  stroke = "hsl(var(--muted-foreground))",
  fill = "transparent",
}: {
  data: number[]
  axisLabels?: string[]
  height?: number
  stroke?: string
  fill?: string
}) {
  if (data.length === 0) return null

  const padding = { top: 4, right: 4, bottom: axisLabels ? 16 : 4, left: 4 }
  const width = 320
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = padding.left + (i / (data.length - 1 || 1)) * innerW
      const y = padding.top + innerH - ((v - min) / range) * innerH
      return `${x},${y}`
    })
    .join(" ")

  // Area fill underneath the line
  const areaPath =
    `M ${padding.left},${padding.top + innerH} ` +
    data
      .map((v, i) => {
        const x = padding.left + (i / (data.length - 1 || 1)) * innerW
        const y = padding.top + innerH - ((v - min) / range) * innerH
        return `L ${x},${y}`
      })
      .join(" ") +
    ` L ${padding.left + innerW},${padding.top + innerH} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Subtle gridlines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={padding.left}
          x2={padding.left + innerW}
          y1={padding.top + innerH * t}
          y2={padding.top + innerH * t}
          stroke="currentColor"
          strokeOpacity={0.06}
          strokeDasharray="2 3"
          className="text-foreground"
        />
      ))}
      {/* Area */}
      <path d={areaPath} fill={stroke} opacity={0.06} />
      {/* Line */}
      <polyline
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Last-point dot */}
      <circle
        cx={padding.left + innerW}
        cy={padding.top + innerH - ((data[data.length - 1] - min) / range) * innerH}
        r={2.5}
        fill={stroke}
      />
      {/* Axis labels */}
      {axisLabels?.map((l, i) => (
        <text
          key={l}
          x={padding.left + (i / (axisLabels.length - 1 || 1)) * innerW}
          y={height - 2}
          textAnchor={i === 0 ? "start" : i === axisLabels.length - 1 ? "end" : "middle"}
          className="fill-muted-foreground text-xs font-mono"
        >
          {l}
        </text>
      ))}
    </svg>
  )
}
