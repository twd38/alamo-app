import StepFileViewer from '@/components/library/details/step-file';
import { getPart } from '../queries/getPart';
import PageContainer from '@/components/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ModelPageProps = {
  params: Promise<{ partId: string }>;
};

const ModelPage = async (props: ModelPageProps) => {
  const params = await props.params;
  const partId = params.partId as string;

  const part = await getPart(partId);

  if (!part) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Part not found</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="h-[calc(100vh-10rem)]">
      <Card className="h-full p-4">
        <StepFileViewer
          cadFile={part.cadFile}
          gltfFile={part.gltfFile}
          partId={part.id}
          apsUrn={part.apsUrn}
        />
      </Card>
    </PageContainer>
  );
};

export default ModelPage;
