import { getPart } from '../queries/getPart';
import Details from '../components/details';

type PartDetailsPageProps = {
  params: Promise<{ partId: string }>;
};

const PartDetailsPage = async (props: PartDetailsPageProps) => {
  const params = await props.params;
  const partId = params.partId;
  const part = await getPart(partId);

  if (!part) {
    return <div>Part not found</div>;
  }

  return <Details part={part} />;
};

export default PartDetailsPage;
