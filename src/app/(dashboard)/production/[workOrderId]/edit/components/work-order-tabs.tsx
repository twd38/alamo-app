'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Book, Clipboard, Box } from 'lucide-react';

interface WorkOrderTabsProps {
  children: React.ReactNode;
  defaultTab?: string;
  workOrderNumber: string;
  status: string;
}

export function WorkOrderTabs({
  children,
  defaultTab = 'details',
  workOrderNumber,
  status
}: WorkOrderTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex gap-4 px-4 border-b h-12 justify-between items-center">
        <div className="flex gap-2 items-center">
          <h1 className="text-sm font-semibold">
            Work Order - {workOrderNumber}
          </h1>
          <span className="text-sm text-muted-foreground">|</span>
          <Badge className={getStatusColor(status)}>
            {formatStatus(status)}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList size="sm">
            <TabsTrigger value="details" size="sm">
              <Clipboard className="w-3 h-3 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="model" size="sm">
              <Box className="w-3 h-3 mr-2" />
              Model
            </TabsTrigger>
            <TabsTrigger value="instructions" size="sm">
              <Book className="w-3 h-3 mr-2" />
              Instructions
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        {React.Children.map(children, (child) => {
          if (
            React.isValidElement(child) &&
            (child.props as any).value === activeTab
          ) {
            return child;
          }
          return null;
        })}
      </div>
    </div>
  );
}

interface TabContentProps {
  value: string;
  children: React.ReactNode;
}

export function TabContent({ children }: TabContentProps) {
  return <>{children}</>;
}
