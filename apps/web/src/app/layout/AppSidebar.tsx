import { Link, useMatchRoute, type LinkProps } from "@tanstack/react-router"
import { LayoutDashboardIcon, SettingsIcon, type LucideIcon } from "lucide-react"

import { m } from "@/shared/i18n"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@repo/ui/components/sidebar"

type NavItem = { to: LinkProps["to"]; label: () => string; icon: LucideIcon }

// Signed-in pages only; public pages (home, todos) live in the public header.
const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: m.nav_dashboard, icon: LayoutDashboardIcon },
  { to: "/settings", label: m.nav_settings, icon: SettingsIcon },
]

export function AppSidebar() {
  const matchRoute = useMatchRoute()
  const { isMobile, setOpenMobile } = useSidebar()
  // On mobile the sidebar is a sheet: close it once a link is chosen.
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" onClick={closeOnMobile} />}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                F
              </span>
              <span className="truncate font-semibold">FSD Boilerplate</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    render={<Link to={to} onClick={closeOnMobile} />}
                    isActive={Boolean(matchRoute({ to, fuzzy: true }))}
                    tooltip={label()}
                  >
                    <Icon />
                    <span>{label()}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail aria-label={m.sidebar_toggle()} title={m.sidebar_toggle()} />
    </Sidebar>
  )
}
