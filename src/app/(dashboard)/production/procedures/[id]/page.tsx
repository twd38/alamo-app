'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import { ProcedureEditor } from '../components/procedure-editor';
import {
  getProcedureById,
  updateProcedureStep,
  createProcedureStep,
  deleteProcedureStep,
  reorderProcedureSteps,
  addFilesToProcedureStep,
  deleteFilesFromProcedureStep
} from '../actions/procedures';
import { Prisma } from '@prisma/client';

type ProcedureWithSteps = Prisma.ProcedureGetPayload<{
  include: {
    steps: {
      include: {
        actions: true;
        files: true;
      };
    };
    operations: {
      include: {
        workCenter: true;
      };
    };
  };
}>;

export default function ProcedureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const procedureId = params.id as string;
  
  const [procedure, setProcedure] = useState<ProcedureWithSteps | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProcedure = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProcedureById(procedureId);
      setProcedure(data);
    } catch (error) {
      toast.error('Failed to load procedure');
      console.error('Error fetching procedure:', error);
    } finally {
      setLoading(false);
    }
  }, [procedureId]);

  useEffect(() => {
    fetchProcedure();
  }, [fetchProcedure]);

  const handleUpdateStep = async (stepId: string, updates: any) => {
    try {
      await updateProcedureStep(stepId, updates);
      // Refresh the procedure data
      await fetchProcedure();
    } catch (error) {
      toast.error('Failed to update step');
      console.error('Error updating step:', error);
      throw error;
    }
  };

  const handleAddStep = async () => {
    if (!procedure) return;
    
    try {
      await createProcedureStep(procedure.id);
      await fetchProcedure();
      toast.success('Step added successfully');
    } catch (error) {
      toast.error('Failed to add step');
      console.error('Error adding step:', error);
    }
  };

  const handleRemoveStep = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this step?')) return;
    
    try {
      await deleteProcedureStep(stepId);
      await fetchProcedure();
      toast.success('Step deleted successfully');
    } catch (error) {
      toast.error('Failed to delete step');
      console.error('Error deleting step:', error);
    }
  };

  const handleReorderSteps = async (stepIds: string[]) => {
    if (!procedure) return;
    
    try {
      await reorderProcedureSteps(procedure.id, stepIds);
      await fetchProcedure();
    } catch (error) {
      toast.error('Failed to reorder steps');
      console.error('Error reordering steps:', error);
    }
  };

  const handleAddFilesToStep = async (stepId: string, files: Prisma.FileCreateInput[]) => {
    try {
      await addFilesToProcedureStep(stepId, files);
      await fetchProcedure();
      toast.success('Files added successfully');
    } catch (error) {
      toast.error('Failed to add files');
      console.error('Error adding files:', error);
    }
  };

  const handleDeleteFilesFromStep = async (stepId: string, fileIds: string[]) => {
    try {
      await deleteFilesFromProcedureStep(stepId, fileIds);
      await fetchProcedure();
      toast.success('Files deleted successfully');
    } catch (error) {
      toast.error('Failed to delete files');
      console.error('Error deleting files:', error);
    }
  };

  const breadcrumbs = [
    { href: '/production', label: 'Production' },
    { href: '/production/procedures', label: 'Procedures' },
    { href: `/production/procedures/${procedureId}`, label: procedure?.title || 'Loading...' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <BasicTopBar breadcrumbs={breadcrumbs} />
      
      <div className="px-4 py-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/production/procedures')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Procedures
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ProcedureEditor
          procedure={procedure}
          isLoading={loading}
          onUpdateStep={handleUpdateStep}
          onAddStep={handleAddStep}
          onRemoveStep={handleRemoveStep}
          onReorderSteps={handleReorderSteps}
          onAddFilesToStep={handleAddFilesToStep}
          onDeleteFilesFromStep={handleDeleteFilesFromStep}
          revalidate={fetchProcedure}
        />
      </div>
    </div>
  );
}