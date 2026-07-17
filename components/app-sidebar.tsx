"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FolderKanban, LayoutDashboard, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="top-14 h-[calc(100svh-3.5rem)]"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={label}
                    render={<Link href={href} />}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
