import { getPart } from "@/lib/queries";
import Details from "@/components/library/details/details";

type PartDetailsPageProps = {
    params: Promise<{ partId: string }>
}

const PartDetailsPage = async (props: PartDetailsPageProps) => {
    const params = await props.params;
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