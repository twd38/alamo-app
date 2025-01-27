'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SessionProvider } from 'next-auth/react';
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
      <TooltipProvider>
        <SidebarProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </SidebarProvider>
      </TooltipProvider>
  );
}
