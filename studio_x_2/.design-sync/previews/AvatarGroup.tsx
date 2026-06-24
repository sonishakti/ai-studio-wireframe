import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from 'studio-x'

// Stacked teammates — AvatarGroup overlaps members (-space-x-2) and ring-separates them.
export const Stacked = () => (
  <AvatarGroup>
    <Avatar>
      <AvatarFallback>AR</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>NV</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>SK</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>MJ</AvatarFallback>
    </Avatar>
  </AvatarGroup>
)

// Overflow — a few faces plus an AvatarGroupCount "+N" pill for the rest.
export const WithOverflow = () => (
  <AvatarGroup>
    <Avatar>
      <AvatarFallback>AR</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>NV</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>SK</AvatarFallback>
    </Avatar>
    <AvatarGroupCount>+5</AvatarGroupCount>
  </AvatarGroup>
)

// Larger stack — set size="lg" on members; the count pill follows the group size.
export const LargeStack = () => (
  <AvatarGroup>
    <Avatar size="lg">
      <AvatarFallback>AR</AvatarFallback>
    </Avatar>
    <Avatar size="lg">
      <AvatarFallback>NV</AvatarFallback>
    </Avatar>
    <Avatar size="lg">
      <AvatarFallback>SK</AvatarFallback>
    </Avatar>
    <AvatarGroupCount>+12</AvatarGroupCount>
  </AvatarGroup>
)
