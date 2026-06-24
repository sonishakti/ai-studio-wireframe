import { AgentSphere } from 'studio-x'

// The animated gradient orb that represents the agent in the test panel — a
// stylized 3D specular sphere (deep blue/cyan radial, dual specular highlights,
// ambient halo). Pure CSS; captures as a static frame. Idle vs. active (the
// connected state adds a breathing pulse). Padding leaves room for the halo,
// which scales 1.6x beyond the sphere bounds.
export const Idle = () => (
  <div className="flex items-center justify-center p-12">
    <AgentSphere size={132} />
  </div>
)

export const Active = () => (
  <div className="flex flex-col items-center gap-3 p-12">
    <p className="text-xs font-medium text-muted-foreground">Connected</p>
    <AgentSphere size={132} active />
  </div>
)
