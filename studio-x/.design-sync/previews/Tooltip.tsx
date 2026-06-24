import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Button,
} from 'studio-x'
import { RotateCw, Info } from 'lucide-react'

// Default tooltip — open over a button. Wrapped in a provider for the open state.
export const Default = () => (
  <TooltipProvider>
    <div className="h-32 flex items-center justify-center">
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline">
            <RotateCw />
            Restart
          </Button>
        </TooltipTrigger>
        <TooltipContent>Restart this deployment</TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
)

// Explanatory tooltip on an icon affordance.
export const OnIcon = () => (
  <TooltipProvider>
    <div className="h-32 flex items-center justify-center">
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <Info />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Billed per minute of live audio</TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
)
