"use client"

import { type LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "src/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "src/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
import { Factory, Library, BookOpen, Settings2 } from "lucide-react"
import { usePathname } from "next/navigation";
const items = [
    {
      title: "Production",
      url: "/production",
      icon: Factory,      
    },
    {
      title: "Parts",
      url: "/parts",
      icon: Library,
      isActive: true,
      items: [
        {
          title: "Library",
          url: "/parts/library",
        },
        {
          title: "Inventory",
          url: "/parts/inventory",
        },
      ],
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

export function NavMain() {
  const pathname = usePathname();  

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) => {
          const containsItems = item.items && item.items.length > 0;

          if(containsItems){
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
            >
              <SidebarMenuItem key={item.title}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <a href={item.url}>{item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
      })}
      </SidebarMenu>
    </SidebarGroup>
  )
}