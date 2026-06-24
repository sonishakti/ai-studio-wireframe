import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from 'studio-x'
import { Phone, MessageSquare, Globe, Code } from 'lucide-react'

// NavigationMenuItem is the per-item wrapper. Controlled value forces the
// "Deploy" item open so its content panel renders in the capture.
export const Item = () => (
  <div className="h-80">
    <NavigationMenu value="deploy" viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem value="deploy">
          <NavigationMenuTrigger>Deploy</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-72 gap-1">
              <li>
                <NavigationMenuLink href="#">
                  <Phone />
                  Phone Numbers
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">
                  <MessageSquare />
                  Batch Calls
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">
                  <Globe />
                  Web Widget
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">
                  <Code />
                  API & SDK
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </div>
)
