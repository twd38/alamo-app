# PRD-01: Site Analysis & Discovery - Implementation Checklist

## Overview
This checklist tracks implementation progress for PRD-01: Site Analysis & Discovery.

**Branch:** `feature/prd-01-site-analysis`
**PRD:** [prd-01-site-analysis.md](./prd-01-site-analysis.md)

---

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Completed

---

## Phase 1: Database/Schema Changes

### Project Model Enhancement
- [x] Enhanced `Project` model with site analysis fields
  - `parcelNumber`, `address`, `lotAreaSqFt`, `zoningCode`, `floodZone`
  - `latitude`, `longitude`
  - `maxUnits`, `buildableArea`, `estimatedValue`, `landCost`
  - `createdById` relation to User
- [x] Run `npx prisma migrate dev --name add_project_site_data`
- [x] Generate updated Prisma client

### Notes
- Session-only caching chosen (no DB caching for API data)
- RedFlag model not needed - computed from flood zone data

---

## Phase 2: External API Integration

### FEMA Flood Zone API
- [x] Create FEMA flood zone lookup service (`getFloodZone.ts`)
- [x] Query FEMA NFHL ArcGIS REST API (layer 28)
- [x] Parse flood zone codes and risk levels
- [ ] Add flood zone overlay layer to map (future enhancement)

### Regrid API (Consolidated)
- [x] Review existing `getParcelDetail` query - works correctly
- [x] Refactored to use `return_zoning=true` to get zoning data from Regrid
- [x] Removed Zoneomics API dependency (all data now from Regrid)

---

## Phase 3: Server Actions / API Routes

### Site Analysis Actions
- [x] Create `createProject` action (from site analysis)
- [x] HeadlineMetrics calculations in `headline-metrics.tsx`

### Headline Metrics Calculations
- [x] Max units calculation (based on zoning density)
- [x] Buildable area calculation (FAR × lot size)
- [x] Estimated value range (based on max units)
- [x] Land value per unit (acquisition cost efficiency)
- [x] Color coding logic (green/yellow/red thresholds)

---

## Phase 4: UI Components

### Map Enhancements (FR-1)
- [x] Verify parcel boundary visibility at zoom 15+ (already works)
- [x] Verify hover tooltip shows address, lot size, zoning (already works)
- [x] Create coordinates display component (`map-footer.tsx`)
- [x] Add zoom level indicator in footer

### Address Search (FR-2)
- [x] Search input with autocomplete (already exists)
- [x] Create search history hook (`useSearchHistory.ts`)
- [ ] Integrate search history dropdown (needs wiring)

### Parcel Filtering (FR-3)
- [x] Create FilterPanel component (`filter-panel.tsx`)
- [x] Minimum lot area slider filter
- [x] Zoning type multi-select filter
- [x] Matching parcel count display
- [x] Clear filters button
- [ ] Integrate filter panel into developable parcels sidebar

### Property Detail Panel (FR-4, FR-5, FR-6, FR-7, FR-8)
- [x] Basic panel structure (exists)
- [x] Headline Metrics Dashboard component (`headline-metrics.tsx`)
  - 2x2 grid layout
  - Color-coded indicators
  - Hover for calculation methodology
- [x] Red Flags Section component (`red-flags.tsx`)
  - Collapsible accordion
  - Severity indicators (critical/warning)
  - Links to FEMA documentation
- [x] Site Limitations section
  - Flood zone status
  - Flood risk level
  - Special Flood Hazard Area indicator
  - FEMA map effective date

### Project Creation (FR-9)
- [x] "Create Project" button triggers modal
- [x] Create `CreateProjectModal` component
- [x] Pre-populate project with site data
- [x] Navigate to project page on creation
- [x] Save site analysis snapshot with project

---

## Phase 5: Integration & Wiring

### Data Flow
- [x] Wire parcel selection to fetch all required data (parcel, zoning, flood zone)
- [x] Wire headline metrics calculations
- [x] Wire red flags aggregation
- [x] Wire project creation to database

### State Management
- [x] URL-based state for selected parcel (already exists)
- [x] Session storage search history hook created
- [ ] Integrate search history into UI
- [ ] Integrate filter panel into sidebar

---

## Phase 6: Testing

### Acceptance Criteria Tests
- [x] AC-1: Map loads within 3 seconds (verified)
- [x] AC-1: Parcel boundaries visible at zoom 15+
- [x] AC-1: Hover tooltip shows within 200ms
- [x] AC-1: Click opens panel within 300ms
- [x] AC-2: Autocomplete after 3+ characters
- [x] AC-2: Search results within 500ms
- [x] AC-2: Fly to location within 1 second
- [x] AC-3: Lot dimensions display correctly
- [x] AC-3: Zoning info matches official records
- [x] AC-4: Max units calculated correctly
- [x] AC-4: Buildable area calculated correctly
- [x] AC-5: Flood zone status accurate (via FEMA API)
- [x] AC-6: Project creation works

### Build Verification
- [x] TypeScript typecheck passes
- [x] Production build succeeds

---

## Phase 7: Documentation

- [ ] Update API documentation for new endpoints
- [x] Document headline metrics calculation formulas (in code comments)
- [x] Document red flag detection criteria (in code comments)

---

## Notes & Decisions

### Existing Code Leveraged
- `/explorer` route and Map component already exist
- Mapbox integration complete
- Regrid query exists (now handles both parcel and zoning data)
- `evaluateLot` action exists with feasibility checking

### Key Technical Decisions
- **API Caching:** Session-only (no database caching)
- **Project Creation:** Modal with name input before navigating
- **Red Flags:** FEMA flood zones only for MVP
- **Zoning Data:** Consolidated to use only Regrid API with `return_zoning=true` (removed Zoneomics dependency)

### Headline Metrics Color Thresholds
- **Max Units:** Green ≥8, Yellow ≥4, Red <4
- **Buildable Area:** Green ≥10,000 sqft, Yellow ≥5,000 sqft, Red <5,000 sqft
- **Est. Value:** Green ≥$2M, Yellow ≥$1M, Red <$1M
- **Land/Unit:** Green ≤$50K, Yellow ≤$100K, Red >$100K

### Flood Zone Risk Levels
- **High:** A, AE, AH, AO, AR, A99, V, VE zones
- **Moderate:** X (shaded), B zones
- **Minimal:** X (unshaded), C, D zones

---

## Files Created

| File | Purpose |
|------|---------|
| `src/components/ui/slider.tsx` | Shadcn Slider component |
| `src/app/(dashboard)/explorer/queries/getFloodZone.ts` | FEMA flood zone API query |
| `src/app/(dashboard)/explorer/components/headline-metrics.tsx` | Metrics dashboard |
| `src/app/(dashboard)/explorer/components/red-flags.tsx` | Red flags display |
| `src/app/(dashboard)/explorer/components/filter-panel.tsx` | Parcel filtering |
| `src/app/(dashboard)/explorer/components/map-footer.tsx` | Zoom/coordinates footer |
| `src/app/(dashboard)/explorer/components/create-project-modal.tsx` | Project creation modal |
| `src/app/(dashboard)/explorer/actions/create-project.ts` | Server action |
| `src/app/(dashboard)/explorer/hooks/useSearchHistory.ts` | Search history hook |

## Files Modified

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Enhanced Project model with site data fields |
| `src/app/(dashboard)/explorer/queries/index.ts` | Updated exports (removed Zoneomics, exports ParcelZoning from getParcelDetail) |
| `src/app/(dashboard)/explorer/queries/getParcelDetail.ts` | Added `return_zoning=true`, ParcelZoning type, zoning parsing |
| `src/app/(dashboard)/explorer/components/property-detail.tsx` | Added metrics, red flags, modal; uses parcel.zoningData |
| `src/app/(dashboard)/explorer/components/headline-metrics.tsx` | Uses parcel.zoningData instead of separate zoning prop |
| `src/app/(dashboard)/explorer/components/create-project-modal.tsx` | Uses parcel.zoningData instead of separate zoning prop |
| `src/app/(dashboard)/explorer/components/map.tsx` | Added flood zone fetching; removed Zoneomics API call |

## Files Deleted

| File | Reason |
|------|--------|
| `src/app/(dashboard)/explorer/queries/getParcelZoning.ts` | Replaced by Regrid's `return_zoning=true` - all zoning data now from single API |

---

*Last updated: January 5, 2026*
