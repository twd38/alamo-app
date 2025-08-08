'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface WorkCenter {
  id: string;
  code: string;
  name: string;
}

interface WorkCenterFilterProps {
  workCenters: WorkCenter[];
}

export function WorkCenterFilter({ workCenters }: WorkCenterFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentWorkCenterId = searchParams.get('workCenterId') || 'all';

  const handleWorkCenterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === 'all') {
      params.delete('workCenterId');
    } else {
      params.set('workCenterId', value);
    }
    
    params.set('page', '1'); // Reset to first page on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={currentWorkCenterId} onValueChange={handleWorkCenterChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filter by work center" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Work Centers</SelectItem>
        {workCenters.map((wc) => (
          <SelectItem key={wc.id} value={wc.id}>
            {wc.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}