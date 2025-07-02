'use client';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Clipboard,
  Warehouse,
  Box,
  ListOrdered,
  Book,
  Package
} from 'lucide-react';
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
      label: 'model',
      icon: <Box />,
      href: `/parts/library/${params.partId}?tab=model`
    },
    {
      label: 'instructions',
      icon: <Book />,
      href: `/parts/library/${params.partId}?tab=instructions`
    },
    {
      label: 'inventory',
      icon: <Warehouse />,
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
  model,
  instructions,
  inventory
}: {
  details: React.ReactNode;
  model: React.ReactNode;
  instructions: React.ReactNode;
  inventory: React.ReactNode;
}) => {
  'use client';
  const params = useParams();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'details';

  return (
    <>
      {activeTab === 'details' && details}
      {activeTab === 'model' && model}
      {activeTab === 'instructions' && instructions}
      {activeTab === 'inventory' && inventory}
    </>
  );
};
