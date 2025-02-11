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

interface BreadcrumbsProps {
  items: { href: string; label: string }[];
}

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
      <BreadcrumbList>
        {breadcrumbs.slice(0, -1).map((item, index) => (
          <BreadcrumbItem key={index} className="hidden md:block">
            <BreadcrumbLink href={item.href}>
              {item.label}
            </BreadcrumbLink>
            <BreadcrumbSeparator className="hidden md:block" />
          </BreadcrumbItem>
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