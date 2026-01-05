'use client';

import { AlertTriangle, AlertCircle, ExternalLink } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FloodZoneData } from '../queries';

interface RedFlag {
  id: string;
  type: 'flood_zone' | 'compatibility' | 'topography' | 'utilities' | 'other';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  learnMoreUrl?: string;
}

interface RedFlagsProps {
  floodZone: FloodZoneData | null;
  // Future props for other red flag data sources
  // topography?: TopographyData | null;
  // utilities?: UtilitiesData | null;
}

/**
 * Generates red flags based on flood zone data
 */
function getFloodZoneFlags(floodZone: FloodZoneData | null): RedFlag[] {
  if (!floodZone || !floodZone.floodZone) return [];

  const flags: RedFlag[] = [];

  // Check if in Special Flood Hazard Area (high risk)
  if (floodZone.specialFloodHazardArea) {
    flags.push({
      id: 'flood-sfha',
      type: 'flood_zone',
      severity: 'critical',
      title: `Flood Zone ${floodZone.floodZone}`,
      description:
        'This property is in a Special Flood Hazard Area (SFHA) with a 1% annual chance of flooding. Flood insurance is typically required and base flood elevation may need to be met.',
      learnMoreUrl: 'https://www.fema.gov/flood-zones'
    });
  } else if (floodZone.floodRisk === 'moderate') {
    flags.push({
      id: 'flood-moderate',
      type: 'flood_zone',
      severity: 'warning',
      title: `Flood Zone ${floodZone.floodZone}`,
      description:
        'This property is in a moderate-risk flood zone with a 0.2% annual chance of flooding. Consider flood insurance.',
      learnMoreUrl: 'https://www.fema.gov/flood-zones'
    });
  }

  return flags;
}

/**
 * Aggregates all red flags from various data sources
 */
function aggregateRedFlags(floodZone: FloodZoneData | null): RedFlag[] {
  const allFlags: RedFlag[] = [];

  // Add flood zone flags
  allFlags.push(...getFloodZoneFlags(floodZone));

  // Future: Add other flag sources
  // allFlags.push(...getTopographyFlags(topography));
  // allFlags.push(...getUtilitiesFlags(utilities));
  // allFlags.push(...getCompatibilityFlags(zoning));

  // Sort by severity (critical first, then warning, then info)
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return allFlags.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

function RedFlagItem({ flag }: { flag: RedFlag }) {
  const severityStyles = {
    critical: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badgeVariant: 'destructive' as const
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      badgeVariant: 'secondary' as const
    },
    info: {
      icon: AlertCircle,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      badgeVariant: 'outline' as const
    }
  };

  const style = severityStyles[flag.severity];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        style.bgColor,
        style.borderColor
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', style.iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{flag.title}</span>
            {flag.severity === 'critical' && (
              <Badge variant={style.badgeVariant} className="text-[10px] h-4">
                Critical
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">{flag.description}</p>
          {flag.learnMoreUrl && (
            <a
              href={flag.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
            >
              Learn more
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function RedFlags({ floodZone }: RedFlagsProps) {
  const flags = aggregateRedFlags(floodZone);

  if (flags.length === 0) {
    return null;
  }

  const criticalCount = flags.filter((f) => f.severity === 'critical').length;
  const warningCount = flags.filter((f) => f.severity === 'warning').length;

  return (
    <Collapsible defaultOpen className="space-y-2">
      <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h2 className="text-sm font-bold">Red Flags</h2>
          <Badge variant="destructive" className="text-[10px] h-5">
            {flags.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {criticalCount > 0 && (
            <span className="text-red-600">{criticalCount} critical</span>
          )}
          {criticalCount > 0 && warningCount > 0 && <span>·</span>}
          {warningCount > 0 && (
            <span className="text-yellow-600">{warningCount} warning</span>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {flags.map((flag) => (
          <RedFlagItem key={flag.id} flag={flag} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
