import Image from 'next/image';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import { getPart } from '@/lib/queries';
import { TabList, ActiveTab } from './components/part-tabs';
import { Button } from '@/components/ui/button';
import { CreateWorkOrderDialog } from '@/components/production/create-work-order-dialog';
import { Part } from '@prisma/client';
import { Breadcrumb } from '@/components/breadcrumbs';

type PartDetailLayoutProps = {
  params: Promise<{ partId: string }>;
  details: React.ReactNode;
  manufacturing: React.ReactNode;
  inventory: React.ReactNode;
};

const TopBarActions = ({ part }: { part: Part | null }) => {
  if (!part) {
    return null;
  }

  return <CreateWorkOrderDialog part={part} />;
};

const PartDetailLayout = async (props: PartDetailLayoutProps) => {
  const params = await props.params;
  const partId = params.partId as string;
  const { details, manufacturing, inventory } = props;

  const part = await getPart(partId || '');
  const partNumber = part?.partNumber;
  const partRevision = part?.partRevision;

  const breadcrumbs: Breadcrumb[] = [
    { label: 'Parts', href: '/parts/library' },
    { label: 'Library', href: `/parts/library` },
    {
      label: `${partNumber}/${partRevision}` || partId,
      href: `/parts/library/${partId}`
    }
  ];

  return (
    <div className="h-full bg-zinc-50 dark:bg-zinc-900">
      <BasicTopBar
        breadcrumbs={breadcrumbs}
        actions={<TopBarActions part={part} />}
      />
      <div className="sticky top-0 z-10 h-12 border-b px-4 bg-white dark:bg-gray-900 flex justify-between gap-2 shrink-0 transition-[width,height] ease-linear">
        <div className="flex items-center gap-2">
          <h1 className="font-medium">{part?.name}</h1>
          <h2 className="text-sm text-gray-500">
            {' '}
            | {partNumber}/{partRevision}
          </h2>
          {part?.partImage && (
            <Image
              src={part.partImage.url}
              alt={part.description}
              width={100}
              height={100}
            />
          )}
        </div>
        <TabList />
      </div>
      <ActiveTab
        details={details}
        manufacturing={manufacturing}
        inventory={inventory}
      />
    </div>
  );
};

export default PartDetailLayout;
