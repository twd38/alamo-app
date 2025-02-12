"use client"

import * as React from "react"
import {
  BookOpen,
  Settings2,
  Factory,
  Library
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenu,
} from "src/components/ui/sidebar"
import { useUser } from "src/hooks/use-user"
import Image from "next/image"
import Link from "next/link"
import { Command } from "lucide-react"
// This is sample data.
const data = {
  navMain: [
    {
      title: "Production",
      url: "/production",
      icon: Factory,
      isActive: true
    },
    {
      title: "Parts",
      url: "/parts",
      icon: Library,
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  if (!user) return null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/" className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-secondary text-sidebar-primary-foreground">
          {/* <Command className="size-8 max-w-4" /> */}
          <Image src="/american-flag.png" alt="Logo" width={32} height={32} className="" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
