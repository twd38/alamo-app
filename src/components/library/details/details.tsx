'use client';

import { Column } from '@/components/parts-table';
import PageContainer from '@/components/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AddBOMPartsDialog } from '@/components/library/details/add-bom-parts-dialog';
import { PartsTable } from '@/components/parts-table';
import { Prisma, Part, File as FileType } from '@prisma/client';
import PartFiles from '@/components/library/details/files';
import { updatePart } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { formatPartType } from '@/lib/utils';
import { Package, FileText } from 'lucide-react';
import Image from 'next/image';

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
    <PageContainer className="h-screen pb-40 bg-secondary">
      <div className="space-y-4">
        {/* Part Details Card */}
        <Card className="w-full">
          <CardHeader className="hidden">
            <CardTitle className="text-lg font-semibold">
              Part Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Part Image and Basic Info */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-48 h-48  rounded-lg flex items-center justify-center">
                  {part.partImage?.url ? (
                    // <Image
                    //   src={`/api/files/${part.partImageId}`}
                    //   alt={part.name || 'Part image'}
                    //   width={192}
                    //   height={192}
                    //   className="rounded-lg object-cover"
                    // />
                    <img
                      src={`/api/files/${part.partImageId}`}
                      alt={part.name || 'Part image'}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-center border-2 border-dashed bg-gray-50 border-gray-300">
                      <Package className="w-12 h-12 mx-auto mb-2" />
                      <span className="text-sm">No image available</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {part.name || 'Unnamed Part'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {part.description || 'No description available'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    Active
                  </Badge>
                  <Badge variant="outline">Rev. {part.partRevision}</Badge>
                  {part.partType && (
                    <Badge variant="outline">
                      {formatPartType(part.partType)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Part Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Part Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Part Number:</span>
                    <p className="font-medium">
                      {part.partNumber}/{part.partRevision}
                    </p>
                  </div>
                  {part.partType && (
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <p className="font-medium">
                        {formatPartType(part.partType)}
                      </p>
                    </div>
                  )}
                  {part.unit && (
                    <div>
                      <span className="text-gray-600">Unit of Measure:</span>
                      <p className="font-medium">{part.unit}</p>
                    </div>
                  )}
                  {part.trackingType && (
                    <div>
                      <span className="text-gray-600">Tracking Type:</span>
                      <p className="font-medium">{part.trackingType}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Version Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Version Number:</span>
                    <p className="font-medium">{part.versionNumber}</p>
                  </div>
                  {part.basePartNumber && (
                    <div>
                      <span className="text-gray-600">Base Part Number:</span>
                      <p className="font-medium">{part.basePartNumber}</p>
                    </div>
                  )}
                  {part.apsUrn && (
                    <div>
                      <span className="text-gray-600">APS URN:</span>
                      <p className="font-medium text-xs break-all">
                        {part.apsUrn}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bill of Materials */}
        <Card>
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
