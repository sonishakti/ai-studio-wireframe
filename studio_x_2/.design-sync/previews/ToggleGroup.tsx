import { ToggleGroup, ToggleGroupItem } from 'studio-x'
import { AlignLeft, AlignCenter, AlignRight, Phone, MessageSquare, Globe } from 'lucide-react'

export const Single = () => (
  <ToggleGroup type="single" variant="outline" defaultValue="voice">
    <ToggleGroupItem value="voice">
      <Phone /> Voice
    </ToggleGroupItem>
    <ToggleGroupItem value="chat">
      <MessageSquare /> Chat
    </ToggleGroupItem>
    <ToggleGroupItem value="web">
      <Globe /> Web
    </ToggleGroupItem>
  </ToggleGroup>
)

export const Multiple = () => (
  <ToggleGroup type="multiple" variant="outline" defaultValue={['transcribe', 'record']}>
    <ToggleGroupItem value="transcribe">Transcribe</ToggleGroupItem>
    <ToggleGroupItem value="record">Record</ToggleGroupItem>
    <ToggleGroupItem value="sentiment">Sentiment</ToggleGroupItem>
  </ToggleGroup>
)

export const Connected = () => (
  <ToggleGroup type="single" variant="outline" spacing={0} defaultValue="center">
    <ToggleGroupItem value="left" aria-label="Align left">
      <AlignLeft />
    </ToggleGroupItem>
    <ToggleGroupItem value="center" aria-label="Align center">
      <AlignCenter />
    </ToggleGroupItem>
    <ToggleGroupItem value="right" aria-label="Align right">
      <AlignRight />
    </ToggleGroupItem>
  </ToggleGroup>
)

export const Sizes = () => (
  <div className="flex flex-col gap-3 items-start">
    <ToggleGroup type="single" size="sm" variant="outline" defaultValue="day">
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
    </ToggleGroup>
    <ToggleGroup type="single" size="lg" variant="outline" defaultValue="week">
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
    </ToggleGroup>
  </div>
)
