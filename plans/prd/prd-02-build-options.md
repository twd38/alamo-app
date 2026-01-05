# PRD 02: Build Options Generation

## Overview

Build Options Generation enables developers to create projects from selected sites and automatically generate multiple development scenarios. Using a hybrid approach of pre-configured templates and AI-powered optimization, the system produces several build options—each with site plans, renders, and key metrics—allowing developers to quickly compare alternatives and select the best path forward.

## Objectives

1. Reduce time from site selection to viable development options from weeks to hours
2. Generate multiple optimized development scenarios automatically
3. Provide visual representations (site plans, renders) for each option
4. Enable informed comparison between options using standardized metrics
5. Capture development requirements to constrain and guide option generation

## User Stories

### Project Creation
- As a developer, I want to create a project from a selected site so I can begin exploring development options
- As a developer, I want site data to auto-populate into my project so I don't re-enter information
- As a developer, I want to name my project so I can organize multiple projects

### Requirements Specification
- As a developer, I want to specify parking requirements so options meet my needs
- As a developer, I want to set minimum and maximum unit sizes so options fit my target market
- As a developer, I want to define outdoor space requirements so options match buyer expectations
- As a developer, I want to set unit orientation constraints so options respect site context

### Option Generation
- As a developer, I want the system to generate multiple build options automatically so I can see the range of possibilities
- As a developer, I want a "Largest Units" option so I can see the premium-focused approach
- As a developer, I want a "Most Units" option so I can maximize density
- As a developer, I want a "Most Profitable" option so I can see the financially optimal design
- As a developer, I want a "Lowest Risk" option so I can see the safest approach
- As a developer, I want a "Mad Max" option so I can see the absolute maximum possible

### Visualization
- As a developer, I want to see a site plan for each option so I understand the layout
- As a developer, I want to see renders for each option so I can visualize the finished product
- As a developer, I want to see key metrics for each option so I can compare them quickly

### Selection
- As a developer, I want to compare options side-by-side so I can make an informed decision
- As a developer, I want to select an option to proceed to underwriting

---

## Functional Requirements

### FR-1: Project Creation
- FR-1.1: Create project from site analysis with one click
- FR-1.2: Auto-populate project with site data (address, parcel ID, dimensions, zoning)
- FR-1.3: Allow user to name the project
- FR-1.4: Generate unique project ID
- FR-1.5: Set project status to "Draft"
- FR-1.6: Store project creation timestamp and user

### FR-2: Requirements Specification
- FR-2.1: Parking configuration
  - FR-2.1.1: Specify parking ratio (spaces per unit)
  - FR-2.1.2: Select parking placement (surface, garage, tuck-under, street)
  - FR-2.1.3: Show minimum required parking based on zoning
  - FR-2.1.4: Flag if specified parking is below minimum
- FR-2.2: Unit size constraints
  - FR-2.2.1: Set minimum unit size (sq ft)
  - FR-2.2.2: Set maximum unit size (sq ft)
  - FR-2.2.3: Specify unit mix preferences (studio %, 1BR %, 2BR %, 3BR %)
- FR-2.3: Outdoor space requirements
  - FR-2.3.1: Specify private outdoor space per unit (balcony/patio sq ft)
  - FR-2.3.2: Specify common outdoor space (total sq ft)
  - FR-2.3.3: Select outdoor amenities (pool, BBQ, playground, dog park)
- FR-2.4: Unit orientation
  - FR-2.4.1: Set preferred primary orientation (N, S, E, W)
  - FR-2.4.2: Flag orientations to avoid
  - FR-2.4.3: Specify view corridors to preserve
- FR-2.5: Additional constraints
  - FR-2.5.1: Specify maximum building height (if less than zoning max)
  - FR-2.5.2: Set minimum setback preferences (if more than zoning min)
  - FR-2.5.3: Toggle alley access requirement

### FR-3: Template-Based Generation
- FR-3.1: Match site to compatible development templates
- FR-3.2: Filter templates by:
  - FR-3.2.1: Minimum lot area requirement
  - FR-3.2.2: Minimum lot width requirement
  - FR-3.2.3: Compatible zoning types
  - FR-3.2.4: Alley requirement match
- FR-3.3: Score templates by compatibility (lot utilization %)
- FR-3.4: Select top templates as starting points for optimization

### FR-4: AI-Powered Optimization
- FR-4.1: Generate "Largest Units" variant
  - FR-4.1.1: Maximize average unit size within constraints
  - FR-4.1.2: Reduce unit count to increase size
  - FR-4.1.3: Prioritize premium finishes and amenities
- FR-4.2: Generate "Most Units" variant
  - FR-4.2.1: Maximize unit count within zoning limits
  - FR-4.2.2: Use minimum allowed unit sizes
  - FR-4.2.3: Optimize building footprint efficiency
- FR-4.3: Generate "Most Profitable" variant
  - FR-4.3.1: Balance unit count and size for optimal revenue
  - FR-4.3.2: Consider local market pricing by unit type
  - FR-4.3.3: Minimize construction cost per sq ft
- FR-4.4: Generate "Lowest Risk" variant
  - FR-4.4.1: Stay well within zoning limits (80% of max)
  - FR-4.4.2: Use proven building configurations
  - FR-4.4.3: Avoid variance or special permit requirements
- FR-4.5: Generate "Mad Max" variant
  - FR-4.5.1: Push to absolute zoning maximums
  - FR-4.5.2: Explore variance possibilities
  - FR-4.5.3: Show regulatory risk factors

### FR-5: Site Plan Generation
- FR-5.1: Generate 2D site plan for each option
- FR-5.2: Show building footprint(s) with dimensions
- FR-5.3: Show parking layout (spaces, drive aisles)
- FR-5.4: Show setback lines
- FR-5.5: Show outdoor/amenity areas
- FR-5.6: Show entry points and circulation
- FR-5.7: Include north arrow and scale
- FR-5.8: Support export to PDF/PNG

### FR-6: Render Generation
- FR-6.1: Generate 3D exterior render for each option
- FR-6.2: Show building massing and height
- FR-6.3: Apply basic material/color treatment
- FR-6.4: Show context (trees, neighboring buildings)
- FR-6.5: Generate from 2-3 viewpoints (street view, aerial, corner)
- FR-6.6: Support export to PNG/JPG

### FR-7: Option Metrics
- FR-7.1: Display for each option:
  - FR-7.1.1: Total units
  - FR-7.1.2: Unit breakdown by type (studio, 1BR, 2BR, 3BR)
  - FR-7.1.3: Average unit size
  - FR-7.1.4: Total building area (gross sq ft)
  - FR-7.1.5: Achieved FAR
  - FR-7.1.6: Building coverage %
  - FR-7.1.7: Building height
  - FR-7.1.8: Parking spaces provided
  - FR-7.1.9: Parking ratio achieved
  - FR-7.1.10: Estimated construction cost
  - FR-7.1.11: Estimated project value
  - FR-7.1.12: Estimated profit margin

### FR-8: Option Comparison
- FR-8.1: Display all options in gallery view
- FR-8.2: Support side-by-side comparison (2-3 options)
- FR-8.3: Highlight differences between options
- FR-8.4: Rank options by selected metric
- FR-8.5: Filter options by constraint compliance

### FR-9: Option Selection
- FR-9.1: Allow selection of preferred option
- FR-9.2: Mark selected option for underwriting
- FR-9.3: Navigate to Underwriting screen (PRD-03)
- FR-9.4: Allow revisiting and changing selection

---

## User Interface Specifications

### Screen 1: Project Creation Modal

```
┌─────────────────────────────────────────────────────────────────┐
│                                                            [×]  │
│                      Create New Project                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Project Name                                              │  │
│  │ ┌───────────────────────────────────────────────────────┐ │  │
│  │ │ 1234 Main Street Development                          │ │  │
│  │ └───────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Site Information (auto-populated)                         │  │
│  │                                                           │  │
│  │ Address      1234 Main Street, Austin, TX 78701          │  │
│  │ Parcel ID    0123456789                                  │  │
│  │ Lot Size     9,000 sq ft (0.21 acres)                    │  │
│  │ Zoning       MF-4 (Multi-family)                         │  │
│  │ Max Density  54 units/acre                               │  │
│  │ Max FAR      2.0                                         │  │
│  │ Max Height   60 ft                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Create Project                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Centered modal (500px width)
- Project name input with auto-generated default
- Read-only site information summary
- Single primary CTA button

---

### Screen 2: Requirements Specification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Projects                                                          │
│                                                                             │
│ 1234 Main Street Development                                     [Draft]   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1 OF 2: Define Requirements                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🚗 PARKING                                                          │   │
│  │                                                                     │   │
│  │ Parking Ratio                                                       │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐│   │
│  │ │ [    1.5    ] spaces per unit          Min required: 1.5       ││   │
│  │ └─────────────────────────────────────────────────────────────────┘│   │
│  │                                                                     │   │
│  │ Parking Placement                                                   │   │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │   │
│  │ │ Surface  │ │ ████████ │ │Tuck-under│ │  Street  │               │   │
│  │ │          │ │  Garage  │ │          │ │          │               │   │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │   │
│  │              [selected]                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📐 UNIT SIZE                                                        │   │
│  │                                                                     │   │
│  │ Unit Size Range                                                     │   │
│  │ ┌───────────────────────────────────────────────────────────────┐  │   │
│  │ │  Min: [  600  ] sq ft          Max: [ 1,400 ] sq ft           │  │   │
│  │ └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │   │
│  │ Unit Mix Preferences (optional)                                     │   │
│  │                                                                     │   │
│  │ Studio    ┌────────────────────────────────────┐  10%              │   │
│  │           │████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                   │   │
│  │ 1 BR      ┌────────────────────────────────────┐  40%              │   │
│  │           │████████████████░░░░░░░░░░░░░░░░░░░│                   │   │
│  │ 2 BR      ┌────────────────────────────────────┐  35%              │   │
│  │           │██████████████░░░░░░░░░░░░░░░░░░░░░│                   │   │
│  │ 3 BR      ┌────────────────────────────────────┐  15%              │   │
│  │           │██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🌳 OUTDOOR SPACE                                                    │   │
│  │                                                                     │   │
│  │ Private Outdoor (per unit)                                          │   │
│  │ ┌───────────────────────────────────────────────────────────────┐  │   │
│  │ │ [   50   ] sq ft (balcony/patio)                              │  │   │
│  │ └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │   │
│  │ Common Outdoor                                                      │   │
│  │ ┌───────────────────────────────────────────────────────────────┐  │   │
│  │ │ [  500   ] sq ft total                                        │  │   │
│  │ └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │   │
│  │ Amenities (optional)                                                │   │
│  │ ☐ Pool       ☐ BBQ area      ☑ Dog park      ☐ Playground         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🧭 ORIENTATION                                                      │   │
│  │                                                                     │   │
│  │ Preferred Primary Orientation                                       │   │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │   │
│  │ │  N   │ │██ S ██│ │  E   │ │  W   │ │ Any  │                      │   │
│  │ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                      │   │
│  │           [selected]                                               │   │
│  │                                                                     │   │
│  │ Orientations to Avoid                                               │   │
│  │ ☑ North-facing primary living areas                                │   │
│  │ ☐ West-facing (afternoon sun)                                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ⚙️ ADDITIONAL CONSTRAINTS (optional)                                │   │
│  │                                                                     │   │
│  │ Max Building Height    [  45  ] ft     (Zoning max: 60 ft)         │   │
│  │ Min Front Setback      [  20  ] ft     (Zoning min: 15 ft)         │   │
│  │ Alley Access           ☑ Required                                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                    Generate Build Options                           │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Full-width page with centered content (max 800px)
- Collapsible sections for each category
- Visual selectors for parking and orientation
- Sliders for unit mix percentages
- Clear indication of zoning limits

**Interaction:**
- Form validates on blur
- Warnings shown for values below zoning minimums
- "Generate Build Options" triggers generation process

---

### Screen 3: Generation Progress

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                        Generating Build Options                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │     ████████████████████████████████░░░░░░░░░░░░  75%              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ✓ Analyzing site constraints                                              │
│  ✓ Matching compatible templates                                           │
│  ✓ Generating "Largest Units" option                                       │
│  ● Generating "Most Units" option...                                       │
│  ○ Generating "Most Profitable" option                                     │
│  ○ Generating "Lowest Risk" option                                         │
│  ○ Generating "Mad Max" option                                             │
│  ○ Creating site plans                                                     │
│  ○ Rendering visualizations                                                │
│                                                                             │
│  Estimated time remaining: 45 seconds                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Centered modal or full-page overlay
- Progress bar with percentage
- Step-by-step status indicators
- Estimated time remaining

**States:**
- ✓ Completed (green checkmark)
- ● In progress (animated spinner)
- ○ Pending (gray circle)

---

### Screen 4: Build Options Gallery

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Requirements                                                      │
│                                                                             │
│ 1234 Main Street Development                                     [Draft]   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 2 OF 2: Select Build Option                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━            │
│                                                                             │
│  Sort by: [Most Profitable ▼]                    Compare: [0 selected]     │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │ │
│  │ │                 │ │  │ │                 │ │  │ │                 │ │ │
│  │ │   [3D Render]   │ │  │ │   [3D Render]   │ │  │ │   [3D Render]   │ │ │
│  │ │                 │ │  │ │                 │ │  │ │                 │ │ │
│  │ └─────────────────┘ │  │ └─────────────────┘ │  │ └─────────────────┘ │ │
│  │                     │  │                     │  │                     │ │
│  │ MOST PROFITABLE     │  │ MOST UNITS          │  │ LARGEST UNITS       │ │
│  │ ★ Recommended       │  │                     │  │                     │ │
│  │                     │  │                     │  │                     │ │
│  │ 10 units            │  │ 12 units            │  │ 6 units             │ │
│  │ 850 avg sq ft       │  │ 650 avg sq ft       │  │ 1,200 avg sq ft     │ │
│  │ $2.8M est. value    │  │ $2.6M est. value    │  │ $2.4M est. value    │ │
│  │ 22% est. margin     │  │ 18% est. margin     │  │ 20% est. margin     │ │
│  │                     │  │                     │  │                     │ │
│  │ ☐ Compare           │  │ ☐ Compare           │  │ ☐ Compare           │ │
│  │                     │  │                     │  │                     │ │
│  │ [    View Details    ]│  │ [    View Details    ]│  │ [    View Details    ]│ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐                          │
│  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │                          │
│  │ │                 │ │  │ │                 │ │                          │
│  │ │   [3D Render]   │ │  │ │   [3D Render]   │ │                          │
│  │ │                 │ │  │ │                 │ │                          │
│  │ └─────────────────┘ │  │ └─────────────────┘ │                          │
│  │                     │  │                     │                          │
│  │ LOWEST RISK         │  │ MAD MAX             │                          │
│  │                     │  │ ⚠️ Variance needed   │                          │
│  │                     │  │                     │                          │
│  │ 8 units             │  │ 14 units            │                          │
│  │ 800 avg sq ft       │  │ 600 avg sq ft       │                          │
│  │ $2.2M est. value    │  │ $3.0M est. value    │                          │
│  │ 19% est. margin     │  │ 24% est. margin     │                          │
│  │                     │  │                     │                          │
│  │ ☐ Compare           │  │ ☐ Compare           │                          │
│  │                     │  │                     │                          │
│  │ [    View Details    ]│  │ [    View Details    ]│                          │
│  └─────────────────────┘  └─────────────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Card grid (3 columns desktop, 2 tablet, 1 mobile)
- Each card shows: render thumbnail, option name, key metrics
- Sort dropdown to reorder by metric
- Compare checkbox for side-by-side comparison

**Card Content:**
- Render thumbnail (hover for additional views)
- Option name with badge for special status
- Unit count and average size
- Estimated value and margin
- Compare checkbox
- View Details button

**Badges:**
- ★ Recommended: Optimal balance
- ⚠️ Variance needed: Requires special approval

---

### Screen 5: Option Detail View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Options                                                           │
│                                                                             │
│ 1234 Main Street Development                                     [Draft]   │
│ Most Profitable Option                                                      │
│                                                                             │
├───────────────────────────────────────────────┬─────────────────────────────┤
│                                               │                             │
│  [Overview]  [Site Plan]  [Renders]  [Metrics]│                             │
│                                               │                             │
│  ┌───────────────────────────────────────────┐│  QUICK STATS               │
│  │                                           ││                             │
│  │                                           ││  Units          10          │
│  │                                           ││  Avg Size       850 sq ft   │
│  │           [3D RENDER - LARGE]             ││  Building Area  12,400 sf   │
│  │                                           ││  Est. Value     $2.8M       │
│  │                                           ││  Est. Margin    22%         │
│  │                                           ││                             │
│  │                                           ││  ─────────────────────────  │
│  │                                           ││                             │
│  │                                           ││  UNIT BREAKDOWN             │
│  │                                           ││                             │
│  └───────────────────────────────────────────┘│  Studio     1 (10%)        │
│                                               │  1 BR       4 (40%)        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐         │  2 BR       4 (40%)        │
│  │[thumb 1]│ │[thumb 2]│ │[thumb 3]│         │  3 BR       1 (10%)        │
│  └─────────┘ └─────────┘ └─────────┘         │                             │
│   Street     Aerial      Corner              │  ─────────────────────────  │
│                                               │                             │
│  OVERVIEW                                     │  ZONING COMPLIANCE          │
│                                               │                             │
│  This option balances unit count and size     │  FAR         1.38 of 2.0 ✓ │
│  to maximize profitability. The 10-unit       │  Coverage    58% of 65% ✓  │
│  design features a mix of 1BR and 2BR         │  Height      45 ft of 60 ✓ │
│  apartments with tuck-under parking.          │  Density     48/ac of 54 ✓ │
│                                               │  Parking     15 of 15 ✓    │
│  Key Features:                                │  Setbacks    All met ✓     │
│  • Tuck-under parking (15 spaces)             │                             │
│  • South-facing primary units                 │  ─────────────────────────  │
│  • Rooftop common area (400 sq ft)            │                             │
│  • Dog park at ground level                   │  FINANCIAL SUMMARY          │
│                                               │                             │
│  Building Configuration:                      │  Est. Cost    $2.18M       │
│  • 3 stories over parking                     │  Est. Value   $2.80M       │
│  • 45 ft total height                         │  Est. Profit  $620K        │
│  • Wood frame construction                    │  Est. Margin  22%          │
│                                               │                             │
├───────────────────────────────────────────────┴─────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────┐   ┌──────────────────────────────┐       │
│  │       Back to Options        │   │   Select & Continue to       │       │
│  │                              │   │      Underwriting →          │       │
│  └──────────────────────────────┘   └──────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tabs:**
- **Overview**: Summary, key features, building config
- **Site Plan**: 2D plan view with dimensions
- **Renders**: Full gallery of 3D visualizations
- **Metrics**: Detailed breakdown of all metrics

**Layout:**
- Two-column: Main content (left), Quick stats sidebar (right)
- Tabbed interface for content sections
- Thumbnail gallery below main render
- Fixed action buttons at bottom

---

### Screen 6: Site Plan Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  [Overview]  [Site Plan]  [Renders]  [Metrics]                             │
│              ^^^^^^^^^^                                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ↑ N                                                                │   │
│  │  │                                                                  │   │
│  │  │    ┌─────────────────────────────────────────────────────┐      │   │
│  │  │    │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│      │   │
│  │  │    │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│      │   │
│  │  │    │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│      │   │
│  │  │    │░░░░░░░░░░░░░  BUILDING FOOTPRINT  ░░░░░░░░░░░░░░░░░│      │   │
│  │  │    │░░░░░░░░░░░░░    62' × 120'        ░░░░░░░░░░░░░░░░░│      │   │
│  │  │    │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│      │   │
│  │  │    │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│      │   │
│  │  │    └─────────────────────────────────────────────────────┘      │   │
│  │  │                                                                  │   │
│  │  │    ┌──────────────────────────────────────┐                     │   │
│  │  │    │ P  P  P  P  P  P  P  P  P  P  P  P │ PARKING (15 spaces)   │   │
│  │  │    │ P  P  P                             │                       │   │
│  │  │    └──────────────────────────────────────┘                     │   │
│  │  │                                                                  │   │
│  │  │    ════════════════════════════════════════  DRIVEWAY           │   │
│  │  │                                                                  │   │
│  │  │    ← 15' →                                        ← 5' →        │   │
│  │  │    setback                                        setback       │   │
│  │  │                                                                  │   │
│  │  └────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │       ════════════════ MAIN STREET ════════════════                │   │
│  │                                                                     │   │
│  │                         Scale: 1" = 20'                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Zoom In] [Zoom Out] [Download PDF] [Download PNG]                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- North arrow orientation
- Building footprint with dimensions
- Parking layout with space count
- Setback indicators
- Scale bar
- Export buttons

---

### Screen 7: Comparison View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Options                                         [Clear Selection] │
│                                                                             │
│ Compare Build Options (3 selected)                                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐   │
│  │                     │ │                     │ │                     │   │
│  │    [3D Render]      │ │    [3D Render]      │ │    [3D Render]      │   │
│  │                     │ │                     │ │                     │   │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘   │
│                                                                             │
│  MOST PROFITABLE         MOST UNITS             LARGEST UNITS              │
│  ★ Recommended                                                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  METRIC              MOST PROFITABLE   MOST UNITS     LARGEST UNITS        │
│  ──────────────────────────────────────────────────────────────────────    │
│  Total Units         10                12 ▲ best      6                    │
│  Avg Unit Size       850 sq ft         650 sq ft      1,200 sq ft ▲ best  │
│  Building Area       12,400 sq ft      11,800 sq ft   10,800 sq ft        │
│  Est. Value          $2.80M ▲ best     $2.60M         $2.40M              │
│  Est. Profit         $620K ▲ best      $468K          $480K               │
│  Est. Margin         22% ▲ best        18%            20%                 │
│  ──────────────────────────────────────────────────────────────────────    │
│  FAR                 1.38              1.31           1.20                 │
│  Coverage            58%               55%            50%                  │
│  Height              45 ft             48 ft          36 ft                │
│  Parking Spaces      15                18             9                    │
│  ──────────────────────────────────────────────────────────────────────    │
│  Variance Required   No ✓              No ✓           No ✓                 │
│  Risk Level          Medium            Medium         Low ▲ best          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│        [Select Most Profitable]   [Select Most Units]   [Select Largest]   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Side-by-side comparison (2-3 options)
- Render thumbnails at top
- Metrics table with highlighting
- "▲ best" indicator for winning metric
- Selection buttons for each option

---

## User Flow

```
┌─────────────────────────────┐
│  Site Analysis (PRD-01)     │
│  Click "Create Project"     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Project Creation Modal     │
│  • Name project             │
│  • Review site data         │
│  • Create project           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Requirements Specification │
│  • Parking settings         │
│  • Unit size constraints    │
│  • Outdoor space prefs      │
│  • Orientation constraints  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Generation Progress        │
│  • Analyze constraints      │
│  • Match templates          │
│  • Generate 5 options       │
│  • Create site plans        │
│  • Generate renders         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Build Options Gallery      │
│  • View option cards        │
│  • Sort by metrics          │
│  • Select to compare        │
└──────────────┬──────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│ View Detail  │ │ Compare 2-3  │
│ Single Option│ │ Options      │
└──────┬───────┘ └──────┬───────┘
       │               │
       └───────┬───────┘
               │
               ▼
┌─────────────────────────────┐
│  Select Option              │
│  Click "Continue to         │
│  Underwriting"              │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Underwriting (PRD-03)      │
└─────────────────────────────┘
```

---

## Acceptance Criteria

### AC-1: Project Creation
- [ ] Project created with unique ID and correct site data
- [ ] Project name defaults to address, is editable
- [ ] Project appears in user's project list
- [ ] Site data (dimensions, zoning) matches source parcel

### AC-2: Requirements Specification
- [ ] All requirement fields have sensible defaults
- [ ] Parking ratio shows warning if below zoning minimum
- [ ] Unit mix sliders sum to 100%
- [ ] Form validates before generation starts

### AC-3: Option Generation
- [ ] All 5 option types are generated
- [ ] Generation completes within 2 minutes
- [ ] Each option respects specified requirements
- [ ] Each option respects zoning constraints (except Mad Max)
- [ ] Mad Max option clearly indicates variance requirements

### AC-4: Site Plans
- [ ] Site plan shows accurate building footprint
- [ ] Setback lines are correctly positioned
- [ ] Parking layout shows correct space count
- [ ] North arrow and scale bar are present
- [ ] Export to PDF/PNG works

### AC-5: Renders
- [ ] Each option has at least 2 render viewpoints
- [ ] Renders show building massing accurately
- [ ] Renders include basic context (trees, street)
- [ ] Render resolution suitable for presentation

### AC-6: Comparison
- [ ] Can select 2-3 options for comparison
- [ ] Comparison table shows all key metrics
- [ ] Best values are highlighted
- [ ] Can select option from comparison view

### AC-7: Selection
- [ ] Selected option is marked and saved
- [ ] Navigation to Underwriting works
- [ ] Can return and change selection

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Generation time | < 2 minutes | Time from "Generate" to options displayed |
| Options reviewed per project | 3+ | Average options viewed before selection |
| Comparison usage | > 50% | Projects using compare feature |
| Requirements completion | > 80% | Users who specify at least 3 requirement categories |
| Selection rate | > 60% | Projects with selected option (vs abandoned) |

---

## Dependencies

- **PRD-01 (Site Analysis)**: Site data, parcel information, zoning details
- **Development Templates**: Pre-configured building templates
- **AI Generation Service**: For optimization and variation generation
- **Render Engine**: For 3D visualization generation

---

## Out of Scope

- Custom template creation
- Manual site plan editing/drawing
- Interior floor plan generation
- Material/finish selection
- Phased development options
- Multiple building configurations
- Cost estimation details (handled in PRD-03)
- Permit/approval probability scoring
- Market analysis integration
- Competitor analysis
- Construction timeline estimation
