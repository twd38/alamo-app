'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  BOMPartsManager,
  BOMPartsItem
} from '../../components/bom-parts-manager';
import { Prisma, Part } from '@prisma/client';
import { updatePart } from '../../actions';
import { useRouter } from 'next/navigation';
type BOMPartWithPart = Prisma.BOMPartGetPayload<{
  include: { part: true };
}>;

type AddBOMPartsDialogProps = {
  partId: string;
  bomParts: BOMPartWithPart[];
};

const handleUpdateBOM = async (partId: string, bomParts: BOMPartsItem[]) => {
  const payload = {
    id: partId,
    bomParts
  };

  const updatedPart = await updatePart(payload);
};

export const AddBOMPartsDialog = (props: AddBOMPartsDialogProps) => {
  const { partId, bomParts } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [materials, setMaterials] = useState<BOMPartsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const defaultValues = bomParts.map((bomPart) => ({
    id: bomPart.id,
    part: bomPart.part as Part,
    qty: bomPart.qty,
    bomType: bomPart.bomType
  }));

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const onChange = (parts: BOMPartsItem[]) => {
    setMaterials(parts);
  };

  const handleSave = async () => {
    setIsLoading(true);
    await handleUpdateBOM(partId, materials);
    setIsLoading(false);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="ml-4"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Materials
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-[90vw] sm:max-w-[700px] overflow-y-scroll flex flex-col">
        <DialogHeader className="py-2">
          <DialogTitle>Add Materials</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-1 py-2 flex-1">
          <BOMPartsManager onChange={onChange} defaultValues={defaultValues} />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
