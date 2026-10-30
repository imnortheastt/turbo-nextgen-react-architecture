import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"

import { sessionQuery, useLogout } from "@/entities/session"
import { m } from "@/shared/i18n"
import { initials } from "@/shared/lib"
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar"
import { Button } from "@repo/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"

export function UserMenu() {
  const { data: user } = useQuery(sessionQuery)
  const logout = useLogout()
  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={m.user_menu_label()} />}
      >
        <Avatar size="sm">
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-foreground">{user.name}</span>
            <span className="font-normal">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to="/settings/profile" />}>
            {m.nav_profile()}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/settings/security" />}>
            {m.nav_security()}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={logout.isPending} onClick={() => logout.mutate()}>
          {m.sign_out()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
