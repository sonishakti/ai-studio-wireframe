import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from 'studio-x'

// The "+N" overflow pill, trailing a stack of faces inside an AvatarGroup.
export const Overflow = () => (
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
    <AvatarGroupCount>+8</AvatarGroupCount>
  </AvatarGroup>
)

// The count pill tracks the group's avatar size (sm · default · lg).
export const AcrossSizes = () => (
  <div className="flex items-center gap-6">
    <AvatarGroup>
      <Avatar size="sm">
        <AvatarFallback>AR</AvatarFallback>
      </Avatar>
      <Avatar size="sm">
        <AvatarFallback>NV</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>NV</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+6</AvatarGroupCount>
    </AvatarGroup>
    <AvatarGroup>
      <Avatar size="lg">
        <AvatarFallback>AR</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>NV</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+9</AvatarGroupCount>
    </AvatarGroup>
  </div>
)
