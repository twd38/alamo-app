'use client';
import { useParams, useSearchParams } from 'next/navigation';
import { Clipboard, Warehouse, Box } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const TabList = () => {
  'use client';
  const params = useParams();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'details';

  console.log('params', params);

  const tabs = [
    {
      label: 'details',
      icon: <Clipboard />,
      href: `/parts/library/${params.partId}?tab=details`
    },
    {
      label: 'manufacturing',
      icon: <Warehouse />,
      href: `/parts/library/${params.partId}?tab=manufacturing`
    },
    {
      label: 'inventory',
      icon: <Box />,
      href: `/parts/library/${params.partId}?tab=inventory`
    }
  ];

  return (
    <Tabs value={activeTab} className="flex items-center">
      <TabsList size="sm">
        {tabs.map((tab) => (
          <Link href={tab.href} key={tab.label} className="flex items-center">
            <TabsTrigger size="sm" value={tab.label}>
              <div className="flex items-center h-3 w-3 mr-2">{tab.icon}</div>
              {tab.label.charAt(0).toUpperCase() + tab.label.slice(1)}
            </TabsTrigger>
          </Link>
        ))}
      </TabsList>
    </Tabs>
  );
};

export const ActiveTab = ({
  details,
  manufacturing,
  inventory
}: {
  details: React.ReactNode;
  manufacturing: React.ReactNode;
  inventory: React.ReactNode;
}) => {
  'use client';
  const params = useParams();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'details';

  return (
    <>
      {activeTab === 'details' && details}
      {activeTab === 'manufacturing' && manufacturing}
      {activeTab === 'inventory' && inventory}
    </>
  );
};
