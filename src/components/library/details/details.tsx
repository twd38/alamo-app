'use client';

import { Column } from '@/components/parts-table';
import PageContainer from '@/components/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AddBOMPartsDialog } from '@/components/library/details/add-bom-parts-dialog';
import { PartsTable } from '@/components/parts-table';
import { Prisma, Part, File as FileType } from '@prisma/client';
import PartFiles from '@/components/library/details/files';
import { updatePart } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { formatPartType } from '@/lib/utils';
import StepFileViewer from '@/components/library/details/step-file';

type BOMPartWithPart = Prisma.BOMPartGetPayload<{
  include: { part: true };
}>;

type PartWithAllNested = Prisma.PartGetPayload<{
  include: {
    partImage: true;
    files: true;
    basePartTo: true;
    bomParts: {
      include: {
        part: true;
      };
    };
    cadFile: true;
    gltfFile: true;
  };
}>;

type PartDetailsProps = {
  part: PartWithAllNested;
};

const Details = ({ part }: PartDetailsProps) => {
  const router = useRouter();
  const partId = part.id;
  const bomParts = part.bomParts;
  const files = part.files;

  const columns: Column<BOMPartWithPart>[] = [
    {
      header: 'Part Number',
      accessorKey: 'part',
      cell: (row) => {
        return (
          <span>
            {row.partNumber}/{row.partRevision}
          </span>
        );
      }
    },
    {
      header: 'Name',
      accessorKey: 'part.name'
    },
    {
      header: 'Quantity',
      accessorKey: 'qty'
    },
    {
      header: 'Unit of Measure',
      accessorKey: 'part.unit'
    },
    {
      header: 'Type',
      accessorKey: 'part.partType',
      cell: (row) => {
        return <span>{formatPartType(row)}</span>;
      }
    }
  ];

  const handleDeleteBOMPart = async (itemToDelete: BOMPartWithPart) => {
    // Remove the item from the BOMParts array
    const updatedBOMParts = part.bomParts.filter(
      (bomPart) => bomPart.id !== itemToDelete.id
    );

    const payload = {
      id: partId,
      bomParts: updatedBOMParts.map((bomPart) => ({
        id: bomPart.id,
        part: bomPart.part as Part,
        qty: bomPart.qty,
        bomType: bomPart.bomType
      }))
    };

    const updatedPart = await updatePart(payload);
    router.refresh();
  };

  const handleUpdateFiles = async (files: File[]) => {
    const payload = {
      id: partId,
      files: files
    };

    await updatePart(payload);
    router.refresh();
  };

  return (
    <PageContainer>
      <div className="grid grid-cols-2 gap-4">
        {/* Part Details */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Part Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p>{part?.description}</p>
            </div>
          </CardContent>
        </Card>
        {/* Step File Upload/View */}
        <Card className="col-span-1 p-6">
          <StepFileViewer
            cadFile={part.cadFile}
            gltfFile={part.gltfFile}
            partId={part.id}
          />
        </Card>
        {/* Bill of Materials */}
        <Card className="col-span-2">
          <CardHeader className="flex-row justify-between items-center">
            <CardTitle className="text-lg">Bill of Materials</CardTitle>
            <AddBOMPartsDialog partId={partId} bomParts={bomParts} />
          </CardHeader>
          <CardContent>
            <PartsTable
              columns={columns}
              data={bomParts}
              onDelete={handleDeleteBOMPart}
            />
          </CardContent>
        </Card>
        {/* Files */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Files</CardTitle>
          </CardHeader>
          <CardContent>
            <PartFiles files={files} onChange={handleUpdateFiles} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Details;
