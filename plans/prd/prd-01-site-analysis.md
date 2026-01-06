# PRD 01: Site Analysis & Discovery

## Overview

Site Analysis & Discovery is the entry point for the Alamo real estate development workflow. Users discover potential development sites through map-based exploration or address search, then evaluate sites based on key metrics including density potential, unit count, estimated value, and red flags before deciding whether to proceed with a project.

## Objectives

1. Enable users to efficiently discover and evaluate potential development sites
2. Surface critical site metrics and red flags early in the evaluation process
3. Provide comprehensive zoning and land-use information at a glance
4. Reduce time-to-decision on site viability from hours to minutes
5. Create a seamless transition from site discovery to project creation

## User Stories

### Discovery
- As a developer, I want to search for sites by address so I can quickly evaluate a specific property
- As a developer, I want to browse the map and click on parcels so I can discover opportunities in target areas
- As a developer, I want to filter parcels by minimum lot size so I only see sites that could support my development plans
- As a developer, I want to see parcel boundaries clearly on the map so I understand the exact property extents

### Evaluation
- As a developer, I want to see headline metrics immediately when I select a site so I can quickly assess viability
- As a developer, I want to see the maximum density/units allowed so I can estimate development potential
- As a developer, I want to see red flags prominently displayed so I don't waste time on problematic sites
- As a developer, I want to see the current property value and land value so I can estimate acquisition costs
- As a developer, I want to see zoning details so I understand what can be built

### Site Limitations
- As a developer, I want to see if there are protected trees on the site so I can factor in tree mitigation costs
- As a developer, I want to see flood zone information so I can assess risk and insurance costs
- As a developer, I want to see topography constraints so I can estimate site work complexity
- As a developer, I want to see utility availability so I know if infrastructure exists

### Transition
- As a developer, I want to create a project directly from the site analysis so I can proceed to generating build options
- As a developer, I want site data to automatically populate the project so I don't re-enter information

---

## Functional Requirements

### FR-1: Map Interface
- FR-1.1: Display interactive map centered on Austin, TX metro area by default
- FR-1.2: Show parcel boundaries as an overlay layer from vector tileset
- FR-1.3: Support zoom levels from neighborhood (street-level) to regional view
- FR-1.4: Highlight parcel boundaries on hover with distinct visual treatment
- FR-1.5: Show parcel info tooltip on hover (address, lot size, zoning)
- FR-1.6: Select parcel on click, showing distinct "selected" visual state
- FR-1.7: Support pan and zoom gestures (mouse, touch, scroll)
- FR-1.8: Display current zoom level and coordinates in footer

### FR-2: Address Search
- FR-2.1: Provide search input with autocomplete suggestions
- FR-2.2: Support address, city, neighborhood, and landmark searches
- FR-2.3: Fly to searched location with smooth animation
- FR-2.4: Auto-select parcel at searched address
- FR-2.5: Show "No results" state for invalid searches
- FR-2.6: Maintain search history for quick re-access (session only)

### FR-3: Parcel Filtering
- FR-3.1: Filter visible parcels by minimum lot area
- FR-3.2: Filter by zoning type (residential, commercial, mixed-use)
- FR-3.3: Filter by development plan compatibility
- FR-3.4: Show count of matching parcels in current viewport
- FR-3.5: Cluster parcels at low zoom levels for performance

### FR-4: Property Detail Panel
- FR-4.1: Display panel on left side when parcel is selected
- FR-4.2: Show property address and parcel ID
- FR-4.3: Show lot dimensions (width, depth, total area in sq ft and acres)
- FR-4.4: Show current owner information
- FR-4.5: Show appraisal values (land, improvements, total assessed)
- FR-4.6: Allow panel to be closed (returns to full map view)
- FR-4.7: Show loading state while fetching parcel data

### FR-5: Headline Metrics Dashboard
- FR-5.1: Display density potential (estimated max units based on zoning)
- FR-5.2: Display estimated buildable area (based on FAR and lot size)
- FR-5.3: Display estimated project value range (based on comps)
- FR-5.4: Display land value per unit (acquisition cost efficiency)
- FR-5.5: Use color coding: green (favorable), yellow (moderate), red (unfavorable)
- FR-5.6: Show metric calculation methodology on hover/click

### FR-6: Red Flags Display
- FR-6.1: Display prominent red flag banner when issues exist
- FR-6.2: Flag: Site is in flood zone (FEMA zones A, AE, V, VE)
- FR-6.3: Flag: Protected trees present (heritage oaks, significant trees)
- FR-6.4: Flag: Compatibility review required (near single-family)
- FR-6.5: Flag: Steep topography (>15% grade)
- FR-6.6: Flag: Environmental concerns (wetlands, endangered species)
- FR-6.7: Flag: Historic district restrictions
- FR-6.8: Flag: HOA or deed restrictions
- FR-6.9: Show severity level for each flag (warning vs. critical)
- FR-6.10: Link to detailed information for each flag

### FR-7: Zoning Information
- FR-7.1: Display current zoning designation and description
- FR-7.2: Display permitted uses (residential types allowed)
- FR-7.3: Display lot requirements (min lot size, min width, min depth)
- FR-7.4: Display building controls (max height, max FAR, max coverage)
- FR-7.5: Display setback requirements (front, side, rear)
- FR-7.6: Display parking requirements (spaces per unit)
- FR-7.7: Display density limits (units per acre)
- FR-7.8: Link to full zoning code documentation

### FR-8: Site Limitations
- FR-8.1: Display tree survey status (if available)
- FR-8.2: Display flood zone designation with map overlay
- FR-8.3: Display topography/grade information
- FR-8.4: Display utility availability (water, sewer, electric, gas)
- FR-8.5: Display soil type (if available)
- FR-8.6: Display easements and right-of-ways

### FR-9: Project Creation
- FR-9.1: Provide "Create Project" button in detail panel
- FR-9.2: Pre-populate project with site data (address, dimensions, zoning)
- FR-9.3: Navigate to Build Options screen upon project creation
- FR-9.4: Save site analysis data with project for reference

---

## User Interface Specifications

### Screen 1: Explorer Map View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────┐                                    │
│  │ [🔍] Search address or location...  │                                    │
│  │                            [Filter] │                                    │
│  └─────────────────────────────────────┘                                    │
│                                                                             │
│                                                                             │
│                                                                             │
│                         FULL-SCREEN INTERACTIVE MAP                         │
│                                                                             │
│                         [Parcel boundaries overlay]                         │
│                         [Selected parcel highlighted]                       │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                    ┌──────┐ │
│                                                                    │ + / -│ │
│                                                                    └──────┘ │
│                                                                             │
│  23 parcels match filters | Zoom: 15 | 30.2672° N, 97.7431° W              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**With Property Detail Panel Open (left side):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│ ┌───────────────────┐  ┌─────────────────────────────────────┐              │
│ │                   │  │ [🔍] Search address or location...  │              │
│ │    Property       │  └─────────────────────────────────────┘              │
│ │    Detail         │                                                       │
│ │    Panel          │                                                       │
│ │                   │                                                       │
│ │    (see           │            FULL-SCREEN INTERACTIVE MAP                │
│ │     Screen 2)     │                                                       │
│ │                   │            [Parcel boundaries overlay]                │
│ │                   │            [Selected parcel highlighted]              │
│ │                   │                                                       │
│ │                   │                                                       │
│ │                   │                                                       │
│ │                   │                                                       │
│ │                   │                                               ┌──────┐│
│ │                   │                                               │ + / -││
│ │  [Create Project] │                                               └──────┘│
│ │                   │                                                       │
│ └───────────────────┘  23 parcels | Zoom: 15 | 30.2672° N, 97.7431° W      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Search Bar:**
- Floating card positioned in upper-left corner of map
- Positioned below any navigation/header
- Width: 360px (desktop), full-width with margins (mobile)
- Search icon on left
- Placeholder: "Search address or location..."
- Autocomplete dropdown appears below on typing
- Filter button on right opens filter panel
- Subtle shadow to float above map
- Semi-transparent background or solid white

**Filter Panel (expandable):**
- Expands below search bar when filter button clicked
- Minimum lot size slider (5,000 - 50,000 sq ft)
- Zoning type multi-select checkboxes
- Development plan dropdown (filters to compatible parcels)
- "Clear filters" link

**Map Area:**
- Full-screen, edge-to-edge coverage
- Parcel boundaries: 2px stroke, semi-transparent fill
- Default state: gray stroke (#6B7280), transparent fill
- Hover state: blue stroke (#3B82F6), light blue fill (10% opacity)
- Selected state: blue stroke (#2563EB), blue fill (20% opacity), 3px stroke

**Zoom Controls:**
- Positioned in bottom-right corner
- Floating above map

**Status Bar:**
- Bottom of screen, semi-transparent overlay
- Matching parcel count
- Current zoom level
- Center coordinates

---

### Screen 2: Property Detail Panel (Left Side)

```
┌─────────────────────────────────────────┐
│                                    [×]  │
├─────────────────────────────────────────┤
│                                         │
│ 1234 Main Street                        │
│ Austin, TX 78701                        │
│ Parcel: 0123456789                      │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │         HEADLINE METRICS            │ │
│ │                                     │ │
│ │  ┌─────────┐ ┌─────────┐           │ │
│ │  │   12    │ │  8,400  │           │ │
│ │  │  units  │ │  sq ft  │           │ │
│ │  │ max     │ │ buildable│          │ │
│ │  │ [green] │ │ [green]  │          │ │
│ │  └─────────┘ └─────────┘           │ │
│ │                                     │ │
│ │  ┌─────────┐ ┌─────────┐           │ │
│ │  │ $2.4M   │ │ $45K    │           │ │
│ │  │ est.    │ │ land/   │           │ │
│ │  │ value   │ │ unit    │           │ │
│ │  │ [green] │ │ [yellow]│           │ │
│ │  └─────────┘ └─────────┘           │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ ⚠️ RED FLAGS (2)                        │
│ ┌─────────────────────────────────────┐ │
│ │ 🔴 Flood Zone AE                    │ │
│ │    Base flood elevation required    │ │
│ │    [Learn more →]                   │ │
│ ├─────────────────────────────────────┤ │
│ │ 🟡 Compatibility Review             │ │
│ │    Adjacent to SF-3 zoning          │ │
│ │    [Learn more →]                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ 📐 LOT DETAILS                          │
│                                         │
│ Width         75 ft                     │
│ Depth         120 ft                    │
│ Area          9,000 sq ft (0.21 acres)  │
│                                         │
├─────────────────────────────────────────┤
│ 📋 ZONING: MF-4                         │
│                                         │
│ Permitted Uses                          │
│ • Multi-family residential              │
│ • Townhouses                            │
│ • Condominiums                          │
│                                         │
│ Building Controls                       │
│ Max Height        60 ft                 │
│ Max FAR           2.0                   │
│ Max Coverage      65%                   │
│ Density           54 units/acre         │
│                                         │
│ Setbacks                                │
│ Front             15 ft                 │
│ Side              5 ft                  │
│ Rear              10 ft                 │
│                                         │
│ Parking           1.5 spaces/unit       │
│                                         │
│ [View full zoning code →]               │
│                                         │
├─────────────────────────────────────────┤
│ 💰 VALUATION                            │
│                                         │
│ Land Value        $450,000              │
│ Improvements      $125,000              │
│ Total Assessed    $575,000              │
│ Last Sale         $520,000 (2021)       │
│                                         │
├─────────────────────────────────────────┤
│ 🏗️ SITE LIMITATIONS                     │
│                                         │
│ Flood Zone        Zone AE ⚠️            │
│ Protected Trees   None detected         │
│ Topography        Flat (<5% grade)      │
│ Utilities         All available ✓       │
│                                         │
├─────────────────────────────────────────┤
│ 👤 OWNER                                │
│                                         │
│ ABC Holdings LLC                        │
│ 5678 Commerce Dr                        │
│ Austin, TX 78702                        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │         CREATE PROJECT              │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Panel Layout:**
- Positioned on left side of screen, overlaying map
- Width: 400px (desktop), full-width (mobile)
- Full height of viewport
- Slides in from left with animation when parcel selected
- Closes on [×] click, returning to full map view
- Scrollable content area
- Fixed close button at top and CTA button at bottom

**Headline Metrics:**
- 2x2 grid of metric cards
- Each card: large number, label, color indicator
- Color coding:
  - Green (#22C55E): Favorable (above market average)
  - Yellow (#EAB308): Moderate (at market average)
  - Red (#EF4444): Unfavorable (below average or concern)

**Red Flags Section:**
- Only appears if flags exist
- Collapsible accordion
- Badge count in header
- Severity indicators:
  - Red circle: Critical (may block development)
  - Yellow circle: Warning (adds cost/complexity)
- Each flag links to detailed information

**Zoning Section:**
- Zoning code badge with description
- Permitted uses as bullet list
- Building controls as label/value pairs
- Link to full zoning documentation

**Create Project Button:**
- Fixed at bottom of sidebar
- Full-width primary button
- Prominent styling (blue background, white text)

---

### Screen 3: Parcel Hover Tooltip

```
┌─────────────────────────────────┐
│ 1234 Main Street                │
│ 9,000 sq ft · MF-4              │
│ Click to view details           │
└─────────────────────────────────┘
```

- Appears on parcel hover
- Position: Above cursor, centered on parcel
- Auto-dismiss after 2 seconds of no hover
- Content: Address, lot size, zoning code

---

### Screen 4: Search Autocomplete

```
┌─────────────────────────────────────────┐
│ [🔍] 1234 Main                     [×]  │
├─────────────────────────────────────────┤
│ 📍 1234 Main Street, Austin, TX 78701   │
│ 📍 1234 Main Avenue, Round Rock, TX     │
│ 📍 1234 Main Boulevard, Cedar Park, TX  │
│─────────────────────────────────────────│
│ 🏘️ Main Street Historic District        │
│ 🏢 Main Plaza Shopping Center           │
└─────────────────────────────────────────┘
```

- Floating dropdown appears below search bar (same width)
- Appears on focus and typing (min 3 characters)
- Groups: Addresses (📍), Places (🏘️), Landmarks (🏢)
- Keyboard navigation support (up/down arrows, enter to select)
- Highlight matching text in results
- Click outside or press Escape to dismiss

---

## User Flow

```
┌─────────────────┐
│   Open Explorer │
│   /explorer     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Browse Map     │────▶│  Search Address │
│  (pan/zoom)     │     │  (autocomplete) │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         │              │  Map flies to   │
         │              │  location       │
         │              └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│         Hover over parcel               │
│         (tooltip appears)               │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│         Click parcel                    │
│         (panel slides in from left)     │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│         Review site details             │
│         • Headline metrics              │
│         • Red flags                     │
│         • Zoning info                   │
│         • Valuation                     │
└────────────────────┬────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Site not       │     │  Site viable    │
│  suitable       │     │                 │
│                 │     │  Click "Create  │
│  Select another │     │  Project"       │
│  parcel         │     │                 │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Navigate to    │
                        │  Build Options  │
                        │  (PRD-02)       │
                        └─────────────────┘
```

---

## Acceptance Criteria

### AC-1: Map Interaction
- [ ] Map loads full-screen within 3 seconds on standard connection
- [ ] Parcel boundaries are visible at zoom level 15 and closer
- [ ] Hovering a parcel shows tooltip within 200ms
- [ ] Clicking a parcel opens detail panel (slides in from left) within 300ms
- [ ] Selected parcel remains highlighted while panel is open

### AC-2: Search
- [ ] Autocomplete suggestions appear after typing 3+ characters
- [ ] Search results appear within 500ms of typing pause
- [ ] Selecting result flies map to location within 1 second
- [ ] Search history persists within browser session

### AC-3: Property Details
- [ ] Detail panel displays all lot dimensions accurately
- [ ] Zoning information matches official records
- [ ] Valuation data displays current tax year values
- [ ] Owner information displays when available

### AC-4: Headline Metrics
- [ ] Max units calculated based on zoning density limits
- [ ] Buildable area calculated using FAR × lot size
- [ ] Color coding accurately reflects market comparisons
- [ ] Clicking metric shows calculation methodology

### AC-5: Red Flags
- [ ] Flood zone status fetched and displayed accurately
- [ ] Compatibility review requirement detected correctly
- [ ] All flags link to relevant documentation
- [ ] No false positives on critical flags

### AC-6: Project Creation
- [ ] Clicking "Create Project" creates project with site data
- [ ] User navigates to Build Options screen
- [ ] All site data accessible from project record

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to evaluate site | < 2 minutes | From parcel click to create project decision |
| Sites evaluated per session | 5+ | Average parcels viewed per user session |
| False positive rate (red flags) | < 5% | Flags shown that don't apply |
| Search success rate | > 90% | Searches that result in parcel selection |
| Project creation rate | > 30% | Sites viewed that become projects |

---

## Dependencies

- **External APIs:**
  - Mapbox (map tiles, vector tileset, search)
  - Regrid (parcel data, owner info)
  - Zoneomics (zoning regulations)
  - FEMA (flood zone data)

- **Internal Systems:**
  - Development plan templates (for filtering)
  - Project creation system (PRD-02)

---

## Out of Scope

- Satellite imagery toggle (future enhancement)
- Street view integration
- Parcel drawing/custom boundaries
- Bulk parcel analysis
- Saved searches / alerts
- Parcel comparison side-by-side
- Export site analysis report
- Integration with MLS listings
- Historical zoning changes
- Traffic/walkability scores
