'use client';

import { TooltipProvider } from 'src/components/ui/tooltip';
import { SidebarProvider } from 'src/components/ui/sidebar';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <TooltipProvider>
          <SidebarProvider defaultOpen={false}>
            <SessionProvider>{children}</SessionProvider>
          </SidebarProvider>
        </TooltipProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
