'use client';

import { useMemo } from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ParcelDetail } from '../queries';

interface HeadlineMetricsProps {
  parcel: ParcelDetail | null;
}

interface MetricCardProps {
  value: string;
  label: string;
  subLabel?: string;
  colorClass: 'green' | 'yellow' | 'red' | 'gray';
  tooltip: string;
}

function MetricCard({
  value,
  label,
  subLabel,
  colorClass,
  tooltip
}: MetricCardProps) {
  const colorStyles = {
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-600'
  };

  const dotColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-400'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative rounded-lg border p-3 cursor-help transition-shadow hover:shadow-sm',
              colorStyles[colorClass]
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs font-medium">{label}</p>
                {subLabel && (
                  <p className="text-[10px] opacity-70">{subLabel}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div
                  className={cn('w-2 h-2 rounded-full', dotColors[colorClass])}
                />
                <Info className="w-3 h-3 opacity-50" />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export interface HeadlineMetricsData {
  maxUnits: number;
  buildableArea: number;
  estimatedValue: number;
  landValuePerUnit: number;
}

export function calculateHeadlineMetrics(
  parcel: ParcelDetail | null
): HeadlineMetricsData | null {
  if (!parcel) return null;

  const dims = parcel.dimensions;
  const appraisal = parcel.appraisal;
  const zoning = parcel.zoningData;

  // Get lot size in acres and square feet
  const lotAcres = dims?.gisAcre || (dims?.gisSqft ? dims.gisSqft / 43560 : 0);
  const lotSqFt = dims?.gisSqft || 0;

  // Max Units = lot acres × max density per acre
  const maxDensity = zoning?.maxDensityDuPerAcre || 0;
  const maxUnits = maxDensity > 0 ? Math.floor(lotAcres * maxDensity) : 0;

  // Buildable Area = lot sqft × FAR
  const maxFar = zoning?.maxFar || 0;
  const buildableArea = maxFar > 0 ? Math.round(lotSqFt * maxFar) : 0;

  // Estimated Value - rough estimate based on units and average value per unit
  // This is a simplified calculation; in production you'd use comps data
  const avgValuePerUnit = 350000; // Placeholder: average unit value in Austin
  const estimatedValue = maxUnits > 0 ? maxUnits * avgValuePerUnit : 0;

  // Land Value Per Unit
  const parcelValue = appraisal?.parcelValue || 0;
  const landValuePerUnit = maxUnits > 0 ? parcelValue / maxUnits : 0;

  return {
    maxUnits,
    buildableArea,
    estimatedValue,
    landValuePerUnit
  };
}

/**
 * Determines the color coding for a metric based on thresholds.
 * Green = favorable, Yellow = moderate, Red = unfavorable
 */
function getMetricColor(
  metric: 'units' | 'buildable' | 'value' | 'landPerUnit',
  value: number
): 'green' | 'yellow' | 'red' | 'gray' {
  if (value === 0) return 'gray';

  switch (metric) {
    case 'units':
      // More units = better
      if (value >= 8) return 'green';
      if (value >= 4) return 'yellow';
      return 'red';

    case 'buildable':
      // More buildable area = better
      if (value >= 10000) return 'green';
      if (value >= 5000) return 'yellow';
      return 'red';

    case 'value':
      // Higher estimated value = better
      if (value >= 2000000) return 'green';
      if (value >= 1000000) return 'yellow';
      return 'red';

    case 'landPerUnit':
      // Lower land cost per unit = better
      if (value <= 50000) return 'green';
      if (value <= 100000) return 'yellow';
      return 'red';

    default:
      return 'gray';
  }
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function HeadlineMetrics({ parcel }: HeadlineMetricsProps) {
  const metrics = useMemo(
    () => calculateHeadlineMetrics(parcel),
    [parcel]
  );

  // Get zoning from parcel for tooltip display
  const zoning = parcel?.zoningData;

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold flex items-center gap-2">
        Development Potential
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          value={formatNumber(metrics.maxUnits)}
          label="Max Units"
          subLabel="allowed by zoning"
          colorClass={getMetricColor('units', metrics.maxUnits)}
          tooltip={`Calculated as: lot acres × max density per acre (${zoning?.maxDensityDuPerAcre || 0} DU/acre)`}
        />
        <MetricCard
          value={`${formatNumber(metrics.buildableArea)} ft²`}
          label="Buildable Area"
          subLabel="gross floor area"
          colorClass={getMetricColor('buildable', metrics.buildableArea)}
          tooltip={`Calculated as: lot size × FAR (${zoning?.maxFar || 0})`}
        />
        <MetricCard
          value={formatCurrency(metrics.estimatedValue)}
          label="Est. Project Value"
          subLabel="rough estimate"
          colorClass={getMetricColor('value', metrics.estimatedValue)}
          tooltip="Rough estimate based on max units × average unit value. Actual value will vary based on development plans."
        />
        <MetricCard
          value={formatCurrency(metrics.landValuePerUnit)}
          label="Land Cost / Unit"
          subLabel="acquisition efficiency"
          colorClass={getMetricColor('landPerUnit', metrics.landValuePerUnit)}
          tooltip="Land value divided by max units. Lower values indicate better acquisition efficiency."
        />
      </div>
    </div>
  );
}
