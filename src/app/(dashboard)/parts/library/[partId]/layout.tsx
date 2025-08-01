import BasicTopBar from '@/components/layouts/basic-top-bar';
import { getPart } from './queries/getPart';
import { TabList, ActiveTab } from './components/part-tabs';
import { CreateWorkOrderDialog } from './components/create-work-order-dialog';
import { Prisma } from '@prisma/client';
import { BreadcrumbConfig } from '@/components/breadcrumbs';

type PartDetailLayoutProps = {
  params: Promise<{ partId: string }>;
  details: React.ReactNode;
  model: React.ReactNode;
  instructions: React.ReactNode;
  inventory: React.ReactNode;
};

type Part = Prisma.PartGetPayload<{
  include: {
    partImage: true;
  };
}>;

const TopBarActions = ({ part }: { part: Part | null }) => {
  if (!part) {
    return null;
  }

  return <CreateWorkOrderDialog part={part} />;
};

const PartDetailLayout = async (props: PartDetailLayoutProps) => {
  const params = await props.params;
  const partId = params.partId as string;
  const { details, model, instructions, inventory } = props;

  const part = await getPart(partId || '');
  const partNumber = part?.partNumber;
  const partRevision = part?.partRevision;

  const breadcrumbs: BreadcrumbConfig[] = [
    { label: 'Parts', href: '/parts/library' },
    { label: 'Library', href: `/parts/library` },
    {
      label:
        partNumber && partRevision ? `${partNumber}/${partRevision}` : partId,
      href: `/parts/library/${partId}`
    }
  ];

  return (
    <div className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
      <BasicTopBar
        breadcrumbs={breadcrumbs}
        actions={<TopBarActions part={part} />}
      />
      <div className=" z-10 h-12 border-b px-4 bg-white dark:bg-gray-900 flex justify-between gap-2 shrink-0 transition-[width,height] ease-linear">
        <div className="flex items-center gap-2">
          <h1 className="font-medium">{part?.name}</h1>
          <h2 className="text-sm text-gray-500">
            {' '}
            | {partNumber}/{partRevision}
          </h2>
        </div>
        <TabList />
      </div>
      <div className="h-[calc(100vh-96px)]">
        <ActiveTab
          details={details}
          model={model}
          instructions={instructions}
          inventory={inventory}
        />
      </div>
    </div>
  );
};

export default PartDetailLayout;
