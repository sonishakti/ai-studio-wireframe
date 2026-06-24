import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from 'studio-x'
import { BookOpen, KeyRound, Plug, Webhook } from 'lucide-react'

// Open menu — controlled value forces the Resources panel open so the
// content (links) renders in the capture. viewport={false} keeps the panel
// inline beneath the trigger instead of in a portal.
export const Open = () => (
  <div className="h-80">
    <NavigationMenu value="resources" viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem value="resources">
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-72 gap-1">
              <li>
                <NavigationMenuLink href="#">
                  <BookOpen />
                  Knowledge base
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">
                  <Plug />
                  CRM connectors
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">
                  <Webhook />
                  MCP servers
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">
                  <KeyRound />
                  Vendor credentials
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </div>
)

// Closed bar — triggers rendered as a horizontal menu bar (default state).
export const MenuBar = () => (
  <NavigationMenu viewport={false}>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Deploy</NavigationMenuTrigger>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink href="#">Docs</NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
)
