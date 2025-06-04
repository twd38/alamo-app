import { getPart } from "@/lib/queries";
import Details from "@/components/library/details/details";



const PartDetailsPage = async ({ params }: { params: { partId: string } }) => {
    const partId = params.partId;
    const part = await getPart(partId);

    if (!part) {
        return <div>Part not found</div>;
    }

    return (
        <Details part={part}/>
    )
}

export default PartDetailsPage;