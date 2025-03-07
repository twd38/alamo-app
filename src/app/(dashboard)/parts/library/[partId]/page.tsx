import { getPart } from "@/lib/queries";

const PartLibraryPage = async ({ params }: { params: { partId: string } }) => {
    const part = await getPart(params.partId);
    console.log(part)
    return (
        <div>
            <h1>{part?.description}</h1>
            <h2>{part?.partNumber}</h2>
            <h3>{part?.unit}</h3>
            <h4>{part?.trackingType}</h4>
            <h5>{part?.category}</h5>
        </div>
    )
}

export default PartLibraryPage;