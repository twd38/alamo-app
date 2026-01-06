'use client';

import type React from 'react';
import { useState, useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ParcelDetail, FloodZoneData } from '../queries';
import {
  HeadlineMetrics,
  calculateHeadlineMetrics
} from './headline-metrics';
import { RedFlags } from './red-flags';
import { CreateProjectModal } from './create-project-modal';

interface PropertyDetailProps {
  parcel: ParcelDetail | null;
  floodZone: FloodZoneData | null;
  onClose: () => void;
}

export function PropertyDetail({
  parcel,
  floodZone,
  onClose
}: PropertyDetailProps) {
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  // Calculate headline metrics using parcel.zoningData
  const headlineMetrics = useMemo(
    () => calculateHeadlineMetrics(parcel),
    [parcel]
  );

  // Get zoning data from parcel
  const zoning = parcel?.zoningData ?? null;

  if (!parcel) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  // Helper for safe nested access
  const dims = parcel.dimensions;
  const appraisal = parcel.appraisal;
  const streetAddress = parcel.streetAddress;
  const owner = parcel.ownerInfo;
  const records = (parcel.parcelRecords as any[]) || [];

  // Helper to safely stringify any value for display
  function safeValue(val: unknown): string | React.ReactNode {
    if (val === null || val === undefined) return '---';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }


  return (
    <div className="flex h-full w-full flex-col overflow-auto scrollbar-hide border-r bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="">
            <span className="text-sm font-bold">
              {streetAddress?.address},{' '}
            </span>
            <span className="text-sm font-medium text-gray-500">
              {streetAddress?.city?.toUpperCase()},{' '}
              {streetAddress?.stateAbbreviation} {streetAddress?.zip}
            </span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Headline Metrics Dashboard */}
        <HeadlineMetrics parcel={parcel} />

        {/* Red Flags */}
        <RedFlags floodZone={floodZone} />

        {/* Site Limitations */}
        {floodZone && (
          <Section title="Site Limitations">
            <Row
              label="Flood Zone"
              value={floodZone.floodZone || 'Not mapped'}
            />
            <Row
              label="Flood Risk"
              value={
                floodZone.floodRisk
                  ? floodZone.floodRisk.charAt(0).toUpperCase() +
                    floodZone.floodRisk.slice(1)
                  : 'Unknown'
              }
            />
            <Row
              label="Special Flood Hazard Area"
              value={floodZone.specialFloodHazardArea ? 'Yes' : 'No'}
            />
            {floodZone.effectiveDate && (
              <Row
                label="FEMA Map Date"
                value={floodZone.effectiveDate}
              />
            )}
          </Section>
        )}

        {/* Summary Section */}
        <Section title="Summary">
          <Row
            label="Parcel area"
            value={
              dims?.gisSqft ? `${dims.gisSqft.toLocaleString()} ft²` : '---'
            }
          />
          <Row
            label="Neighborhood"
            value={safeValue(
              streetAddress?.neighborhood || streetAddress?.subdivision
            )}
          />
          <Row label="Zoning Type" value={safeValue(zoning?.zoning)} />
          <Row
            label="Parcel Value"
            value={
              appraisal?.parcelValue
                ? `$${appraisal.parcelValue.toLocaleString()}`
                : '---'
            }
          />
          <Row label="Year Built" value={safeValue(parcel.yearBuilt)} />
          {/* <Row label="Setback area" value={dims?.setbackArea ? `${dims.setbackArea} ft²` : '---'} /> */}
        </Section>

        {/* Parcel Records Section */}
        <Section title="Parcel Records">
          <Row label="APN" value={safeValue(parcel.parcelNumber)} />
          <Row label="Address" value={safeValue(streetAddress?.address)} />
          <Row
            label="Legal description"
            value={safeValue(records[0]?.legalDescription)}
          />
          <Row
            label="Use description"
            value={safeValue(records[0]?.useDescription)}
          />
          <Row label="Owner name" value={safeValue(owner?.owner)} />
          <Row label="Owner address" value={safeValue(owner?.address)} />
          <Row
            label="Assessed Value"
            value={
              appraisal?.parcelValue
                ? `$${appraisal.parcelValue.toLocaleString()}`
                : '---'
            }
          />
          <Row
            label="Last record refresh"
            value={safeValue(parcel.lastRefreshByRegrid)}
          />
        </Section>

        {/* Dimensions Section */}
        <Section title="Dimensions">
          {/* <Row label="Parcel type" value={safeValue(dims?.parcelType)} /> */}
          <Row
            label="Parcel width"
            value={dims?.lotWidth ? `${dims.lotWidth} ft` : '---'}
          />
          <Row
            label="Parcel depth"
            value={dims?.lotDepth ? `${dims.lotDepth} ft` : '---'}
          />
          <Row
            label="Street frontage"
            value={dims?.lotWidth ? `${dims.lotWidth} ft` : '---'}
          />
          <Row
            label="Assessor address"
            value={safeValue(streetAddress?.address)}
          />
          <Row
            label="Assessor report"
            value={
              <a
                href="https://www.traviscad.org/property-search/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Travis Central Appraisal District
              </a>
            }
          />
          <Row
            label="GPS address"
            value={
              streetAddress?.address
                ? `${streetAddress.address}, ${streetAddress.city}, ${streetAddress.stateAbbreviation}, ${streetAddress.zip}`
                : '---'
            }
          />
        </Section>

        {/* Appraisals Section */}
        <Section title="Appraisals">
          <Row
            label="Parcel value"
            value={
              appraisal?.parcelValue
                ? `$${appraisal.parcelValue.toLocaleString()}`
                : '---'
            }
          />
          <Row
            label="Improvement Value"
            value={
              appraisal?.improvementValue
                ? `$${appraisal.improvementValue.toLocaleString()}`
                : '---'
            }
          />
          <Row
            label="Land Value"
            value={
              appraisal?.landValue
                ? `$${appraisal.landValue.toLocaleString()}`
                : '---'
            }
          />
        </Section>

        {/* Zoning Section */}
        <Section title="Zoning">
          <Row label="Zoning" value={zoning?.zoningDescription ?? '---'} />
          <Row
            label="Allowed FAR"
            value={zoning?.maxFar ? `${zoning.maxFar}x` : 'N/A'}
          />
          <Row
            label="Impervious coverage"
            value={
              zoning?.maxImperviousCoveragePct
                ? `${zoning.maxImperviousCoveragePct}%`
                : 'N/A'
            }
          />
          <Row
            label="Building coverage"
            value={zoning?.maxCoveragePct ? `${zoning.maxCoveragePct}%` : 'N/A'}
          />
        </Section>

        {/* Neighborhood Section */}
        <Section title="Neighborhood">
          <Row
            label="Neighborhood"
            value={safeValue(
              streetAddress?.neighborhood || streetAddress?.subdivision
            )}
          />
          <Row
            label="Infill options"
            value={safeValue(parcel.attributes?.infillOptionCodes) || 'Unknown'}
          />
        </Section>
      </div>

      <div className="sticky bottom-0 mt-auto border-t bg-white p-4">
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600"
          onClick={() => setShowCreateProjectModal(true)}
        >
          Create project
        </Button>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        open={showCreateProjectModal}
        onOpenChange={setShowCreateProjectModal}
        parcel={parcel}
        floodZone={floodZone}
        headlineMetrics={headlineMetrics}
      />
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

interface RowProps {
  label: string;
  value: React.ReactNode;
}

function Row({ label, value }: RowProps) {
  return (
    <div>
      <div className="columns-2 py-1">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-xs text-left align-bottom overflow-x-hidden">
          {value}
        </div>
      </div>
      <Separator />
    </div>
  );
}
