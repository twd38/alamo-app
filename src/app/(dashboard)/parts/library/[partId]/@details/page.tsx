import { getPart } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageContainer from "@/components/page-container";
import PartFiles from "@/components/part-details/files";

const PartDetailsPage = async ({ params }: { params: { partId: string } }) => {
    const partId = params.partId;
    const part = await getPart(partId);

    return (
        <PageContainer> 
            <div className="grid grid-cols-2 gap-4">
                {/* Part Details */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Part Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <p>{part?.description}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Bill of Materials</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PartFiles files={part?.files || []} />
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    )
}

export default PartDetailsPage;