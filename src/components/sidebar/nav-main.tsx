'use client';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar
} from 'src/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from 'src/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import {
  Factory,
  Library,
  BookOpen,
  Settings2,
  ShoppingCart,
  Globe,
  SquareKanban,
  Wrench,
  FileText,
  Building
} from 'lucide-react';
import { usePathname } from 'next/navigation';

const items = [
  {
    title: 'Board',
    url: '/board/my-tasks', // Main board
    icon: SquareKanban
  },
  {
    title: 'Production',
    url: '/production',
    icon: Factory,
    items: [
      {
        title: 'Work Orders',
        url: '/production/work-orders'
      },
      {
        title: 'Work Centers',
        url: '/production/work-centers'
      },
      {
        title: 'Operations',
        url: '/production/operations'
      },
      {
        title: 'Procedures',
        url: '/production/procedures'
      },
      {
        title: 'Routings',
        url: '/production/routings'
      }
    ]
  },
  {
    title: 'Parts',
    url: '/parts',
    icon: Library,
    items: [
      {
        title: 'Library',
        url: '/parts/library'
      }
      // {
      //   title: "Inventory",
      //   url: "/parts/inventory",
      // },
    ]
  },
  {
    title: 'Site Explorer',
    url: '/explorer',
    icon: Globe
  }
];

export function NavMain() {
  const pathname = usePathname();
  const { state, open, setOpen } = useSidebar();

  const handleClickMenuItemWithSubItems = (item: any) => {
    setOpen(true);
  };

  const isActivePage = (item: any) => {
    return item.url === pathname;
  };

  const isActivePageWithSubItems = (item: any) => {
    return item.items.some((subItem: any) => subItem.url === pathname);
  };

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) => {
          const containsItems = item.items && item.items.length > 0;

          if (containsItems) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={true}
                className="group/collapsible"
              >
                <SidebarMenuItem key={item.title}>
                  {open ? (
                    // If the item has subitems and is open, then the subitems should be open
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  ) : (
                    // If the item has subitems and is not open, then clicking the menu button should open the menu
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActivePageWithSubItems(item)}
                      onClick={() => handleClickMenuItemWithSubItems(item)}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            isActive={isActivePage(subItem)}
                            asChild
                          >
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
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActivePage(item)}
                asChild
              >
                <a href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
