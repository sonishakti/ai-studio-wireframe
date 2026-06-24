import { ChannelBadge } from 'studio-x'

// All four deployment channels — icon-only, as they appear inside table rows.
export const AllChannels = () => (
  <div className="flex flex-wrap items-center gap-2">
    <ChannelBadge channel={{ kind: 'telephony', numbers: ['+1 (415) 555-0142'] }} />
    <ChannelBadge channel={{ kind: 'whatsapp', sender: '+1 (415) 555-0199' }} />
    <ChannelBadge channel={{ kind: 'sms', number: '+1 (415) 555-0177' }} />
    <ChannelBadge channel={{ kind: 'web', domains: ['acme.com'] }} />
  </div>
)

// Same channels with labels, at the larger "md" size — used outside dense tables.
export const Labeled = () => (
  <div className="flex flex-wrap items-center gap-2">
    <ChannelBadge channel={{ kind: 'telephony', numbers: ['+1 (415) 555-0142'] }} withLabel size="md" />
    <ChannelBadge channel={{ kind: 'whatsapp', sender: '+1 (415) 555-0199' }} withLabel size="md" />
    <ChannelBadge channel={{ kind: 'sms', number: '+1 (415) 555-0177' }} withLabel size="md" />
    <ChannelBadge channel={{ kind: 'web', domains: ['acme.com'] }} withLabel size="md" />
  </div>
)
