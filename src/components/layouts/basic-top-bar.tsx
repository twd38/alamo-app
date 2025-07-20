import { SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumbs, BreadcrumbConfig } from '@/components/breadcrumbs';

type BasicTopBarProps = {
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbConfig[];
};

const BasicTopBar = ({ actions, breadcrumbs }: BasicTopBarProps) => {
  return (
    <div className="sticky top-0 z-10 h-12 border-b p-4 bg-white dark:bg-gray-900 flex items-center justify-between gap-2 shrink-0 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>
      {actions && actions}
    </div>
  );
};

export default BasicTopBar;
