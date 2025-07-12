import { cn } from '@/lib/utils';

const PageContainer = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn('p-4 overflow-y-auto', className)}>{children}</div>;
};

export default PageContainer;
