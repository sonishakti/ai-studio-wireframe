import { Progress } from 'studio-x'

export function MinuteQuotas() {
  const rows = [
    { label: 'Free minutes used', value: 25, hint: '37 of 150 min' },
    { label: 'Aria deployment ramp', value: 66, hint: 'rollout to 66% of calls' },
    { label: 'Onboarding checklist', value: 100, hint: 'all steps complete' },
  ]
  return (
    <div className="flex w-72 flex-col gap-5">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{r.label}</span>
            <span className="text-muted-foreground">{r.value}%</span>
          </div>
          <Progress value={r.value} />
          <span className="text-sm text-muted-foreground">{r.hint}</span>
        </div>
      ))}
    </div>
  )
}

export function UsageMeter() {
  return (
    <div className="flex w-72 flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Monthly minutes</span>
        <span className="text-muted-foreground">8,420 / 10,000</span>
      </div>
      <Progress value={84} />
      <span className="text-sm text-muted-foreground">84% of plan — resets Jul 1</span>
    </div>
  )
}
