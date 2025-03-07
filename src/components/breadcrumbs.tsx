'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from 'src/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';

export function Breadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);
  let breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    return {
      href,
      label: segment.charAt(0).toUpperCase() + segment.slice(1)
    };
  });

  if(breadcrumbs.length === 0){
    breadcrumbs = [{ href: '/', label: 'Dashboard' }];
  } 

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex items-center gap-2">
        {breadcrumbs.slice(0, -1).map((item, index) => (
          <span key={index} className="flex items-center gap-2">
            <BreadcrumbItem key={index} className="hidden md:flex">
                <BreadcrumbLink href={item.href}>
                  {item.label}
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:flex" />
          </span>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>
            {breadcrumbs[breadcrumbs.length - 1].label}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
} 