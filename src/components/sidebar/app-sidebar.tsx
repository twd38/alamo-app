'use client';

import * as React from 'react';
import { NavMain } from '@/components/sidebar/nav-main';
import { NavUser } from '@/components/sidebar/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from 'src/components/ui/sidebar';
import { useQuery } from '@tanstack/react-query';
import { useUser } from 'src/hooks/use-user';
import Image from 'next/image';
import Link from 'next/link';
import { getUserAccessBadge } from 'src/lib/queries';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { data: badge } = useQuery({
    queryKey: ['badge', user?.id],
    queryFn: () => (user?.id ? getUserAccessBadge(user?.id) : null)
  });
  const badgeId = badge?.id || '';

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          href="/"
          className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-secondary text-sidebar-primary-foreground"
        >
          {/* <Command className="size-8 max-w-4" /> */}
          <Image
            src="/images/alamo_logo.svg"
            alt="Logo"
            width={32}
            height={32}
            className=""
            unoptimized
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} badgeId={badgeId} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
