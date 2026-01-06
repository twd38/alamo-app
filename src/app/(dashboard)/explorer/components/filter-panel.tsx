'use client';

import { useState, useCallback } from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface FilterPanelProps {
  minLotArea: number;
  onMinLotAreaChange: (value: number) => void;
  selectedZoningTypes: string[];
  onZoningTypesChange: (types: string[]) => void;
  matchingCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Common zoning types for Travis County / Austin area
const ZONING_TYPES = [
  { value: 'SF-1', label: 'SF-1 - Single Family Residence (Large Lot)' },
  { value: 'SF-2', label: 'SF-2 - Single Family Residence (Standard Lot)' },
  { value: 'SF-3', label: 'SF-3 - Single Family Residence (Small Lot)' },
  { value: 'SF-4', label: 'SF-4A/SF-4B - Single Family Small Lot' },
  { value: 'SF-5', label: 'SF-5 - Urban Family Residence' },
  { value: 'SF-6', label: 'SF-6 - Townhouse & Condominium' },
  { value: 'MF-1', label: 'MF-1 - Limited Density Multifamily' },
  { value: 'MF-2', label: 'MF-2 - Low Density Multifamily' },
  { value: 'MF-3', label: 'MF-3 - Medium Density Multifamily' },
  { value: 'MF-4', label: 'MF-4 - Moderate-High Density Multifamily' },
  { value: 'MF-5', label: 'MF-5 - High Density Multifamily' },
  { value: 'MF-6', label: 'MF-6 - Highest Density Multifamily' },
  { value: 'GR', label: 'GR - Community Commercial' },
  { value: 'LR', label: 'LR - Neighborhood Commercial' },
  { value: 'GO', label: 'GO - General Office' },
  { value: 'LO', label: 'LO - Limited Office' },
  { value: 'NO', label: 'NO - Neighborhood Office' }
];

// Format square feet to a readable string
function formatSqFt(value: number): string {
  if (value >= 43560) {
    const acres = value / 43560;
    return `${acres.toFixed(2)} acres`;
  }
  return `${value.toLocaleString()} sqft`;
}

export function FilterPanel({
  minLotArea,
  onMinLotAreaChange,
  selectedZoningTypes,
  onZoningTypesChange,
  matchingCount,
  isOpen,
  onOpenChange
}: FilterPanelProps) {
  // Local state for the slider to avoid excessive callbacks
  const [localMinArea, setLocalMinArea] = useState(minLotArea);

  const handleSliderChange = useCallback(
    (values: number[]) => {
      setLocalMinArea(values[0]);
    },
    []
  );

  const handleSliderCommit = useCallback(
    (values: number[]) => {
      onMinLotAreaChange(values[0]);
    },
    [onMinLotAreaChange]
  );

  const handleZoningToggle = useCallback(
    (zoningType: string, checked: boolean) => {
      if (checked) {
        onZoningTypesChange([...selectedZoningTypes, zoningType]);
      } else {
        onZoningTypesChange(selectedZoningTypes.filter((t) => t !== zoningType));
      }
    },
    [selectedZoningTypes, onZoningTypesChange]
  );

  const handleClearFilters = useCallback(() => {
    setLocalMinArea(0);
    onMinLotAreaChange(0);
    onZoningTypesChange([]);
  }, [onMinLotAreaChange, onZoningTypesChange]);

  const activeFilterCount =
    (minLotArea > 0 ? 1 : 0) + (selectedZoningTypes.length > 0 ? 1 : 0);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filter Parcels</span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Matching Count */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <span className="font-bold">{matchingCount.toLocaleString()}</span>{' '}
              parcels match current filters
            </p>
          </div>

          {/* Minimum Lot Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Minimum Lot Size</Label>
              <span className="text-sm text-gray-500">
                {formatSqFt(localMinArea)}
              </span>
            </div>
            <Slider
              value={[localMinArea]}
              min={0}
              max={50000}
              step={1000}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderCommit}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0 sqft</span>
              <span>50,000 sqft</span>
            </div>
          </div>

          <Separator />

          {/* Zoning Types */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Zoning Types</Label>
              {selectedZoningTypes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedZoningTypes.length} selected
                </Badge>
              )}
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {ZONING_TYPES.map((zoning) => (
                <div
                  key={zoning.value}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`zoning-${zoning.value}`}
                    checked={selectedZoningTypes.includes(zoning.value)}
                    onCheckedChange={(checked) =>
                      handleZoningToggle(zoning.value, checked === true)
                    }
                  />
                  <label
                    htmlFor={`zoning-${zoning.value}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {zoning.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
