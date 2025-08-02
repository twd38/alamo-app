import { Badge } from '@/components/ui/badge';

interface ProductionStatusBadgeProps {
  status: string;
  className?: string;
}

export function ProductionStatusBadge({
  status,
  className
}: ProductionStatusBadgeProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary';
      case 'TODO':
        return 'todo';
      case 'HOLD':
        return 'hold';
      case 'IN_PROGRESS':
        return 'in-progress';
      case 'COMPLETED':
        return 'completed';
      case 'PAUSED':
        return 'paused';
      case 'SCRAPPED':
        return 'scrapped';
      default:
        return 'secondary';
    }
  };

  const formatStatusText = (status: string) => {
    return status.replace('_', ' ');
  };

  return (
    <Badge variant={getStatusVariant(status) as any} className={className}>
      {formatStatusText(status)}
    </Badge>
  );
}
