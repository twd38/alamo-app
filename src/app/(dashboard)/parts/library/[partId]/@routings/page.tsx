import { PartRoutingsManager } from '../components/part-routings-manager';
import { PartRoutingsManagerTest } from '../components/part-routings-manager-test';
import { getPart } from '../queries/getPart';

export default async function RoutingsPage({
  params
}: {
  params: Promise<{ partId: string }>;
}) {
  const { partId } = await params;
  const part = await getPart(partId);

  if (!part) {
    return <div className="p-6">Part not found</div>;
  }

  return (
    <div className="h-full">
      <PartRoutingsManager partId={partId} />
    </div>
  );
}
