import PageContainer from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
const ManufacturingPage = () => {
    return (
        <div className="flex gap-2 h-full">
            <div className="w-1/2 h-full bg-white border-r">

            </div>
            <div className="w-full h-full my-2 bg-transparent">
                <Card>
                    <CardHeader>
                        <CardTitle>Manufacturing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-2">
                                <Label>Manufacturing</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="w-1/2 h-full bg-white border-l"></div>
        </div>
    )
}

export default ManufacturingPage;