'use client';

import { Analytics } from '@vercel/analytics/react';
import Providers from '@/components/providers/providers';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { usePathname, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <DashboardContent>{children}</DashboardContent>
      <Analytics />
    </Providers>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const workOrderId = params.workOrderId;

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Hide sidebar only for work order detail pages (e.g., /production/WO-123)
  // Only check after hydration to avoid mismatches
  const isProductionWorkOrder = isClient && workOrderId;

  if (isProductionWorkOrder) {
    return <div className="w-full h-full">{children}</div>;
  }

  return (
    <>
      <AppSidebar className="flex-shrink-0" />
      <DesktopNav>{children}</DesktopNav>
    </>
  );
}

function DesktopNav({ children }: { children: React.ReactNode }) {
  return <SidebarInset className="overflow-hidden">{children}</SidebarInset>;
}
