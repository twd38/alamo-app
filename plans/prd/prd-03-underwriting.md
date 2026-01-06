# PRD 03: Underwriting & Financial Feasibility

## Overview

Underwriting & Financial Feasibility provides comprehensive financial analysis for each build option, enabling developers to make informed go/no-go decisions. The system validates site entitlements, calculates total development costs, models financing scenarios, projects revenue, and performs sensitivity analysis to stress-test assumptions before committing to production.

## Objectives

1. Provide accurate total development cost estimates
2. Enable flexible financing scenario modeling
3. Compare sell vs. rent exit strategies
4. Validate zoning compliance and entitlement requirements
5. Stress-test projects against market volatility
6. Surface "kill switches" that indicate deal-breakers

## User Stories

### Entitlement Verification
- As a developer, I want to verify zoning compliance so I know the project can be built as designed
- As a developer, I want to see permit requirements so I can plan for approval timeline
- As a developer, I want to identify variance needs so I can assess regulatory risk
- As a developer, I want to check utility availability so I know infrastructure costs

### Cost Estimation
- As a developer, I want to see detailed hard cost breakdown so I can validate construction budget
- As a developer, I want to see soft cost estimates so I can plan for professional services
- As a developer, I want to see land cost analysis so I can negotiate acquisition
- As a developer, I want to adjust contingency so I can model risk tolerance

### Financing
- As a developer, I want to model different capital structures so I can optimize returns
- As a developer, I want to see debt service projections so I can assess cash flow risk
- As a developer, I want to compare financing scenarios so I can choose the best structure

### Revenue Projections
- As a developer, I want to see sale price projections based on comps so I can estimate exit value
- As a developer, I want to see rental income projections so I can evaluate hold strategy
- As a developer, I want to compare sell vs rent scenarios so I can choose the best exit

### Returns Analysis
- As a developer, I want to see profit margin so I can assess deal quality
- As a developer, I want to see ROI and IRR so I can compare to other opportunities
- As a developer, I want to see cash-on-cash return so I can evaluate equity efficiency

### Sensitivity Analysis
- As a developer, I want to stress-test against price changes so I can understand downside risk
- As a developer, I want to stress-test against cost overruns so I can plan for contingencies
- As a developer, I want to stress-test against delays so I can understand time risk
- As a developer, I want to see "kill switches" so I know when to walk away

---

## Functional Requirements

### FR-1: Entitlement Verification
- FR-1.1: Zoning compliance checklist
  - FR-1.1.1: Display max units allowed vs. proposed
  - FR-1.1.2: Display FAR limit vs. achieved
  - FR-1.1.3: Display coverage limit vs. achieved
  - FR-1.1.4: Display height limit vs. proposed
  - FR-1.1.5: Display setback requirements vs. proposed
  - FR-1.1.6: Visual pass/fail indicator for each item
- FR-1.2: Permit requirements
  - FR-1.2.1: List required permits (building, site, utility)
  - FR-1.2.2: Estimate permit fees
  - FR-1.2.3: Estimate approval timeline
- FR-1.3: Variance assessment
  - FR-1.3.1: Identify if variance is required
  - FR-1.3.2: List specific variance requests needed
  - FR-1.3.3: Estimate variance approval probability
  - FR-1.3.4: Estimate variance timeline and cost
- FR-1.4: Special requirements
  - FR-1.4.1: Tree mitigation requirements and cost
  - FR-1.4.2: Flood zone requirements (elevation, insurance)
  - FR-1.4.3: Compatibility review requirements
  - FR-1.4.4: Historic review requirements
- FR-1.5: Utility availability
  - FR-1.5.1: Water service status and tap fees
  - FR-1.5.2: Wastewater service status and tap fees
  - FR-1.5.3: Electric service status and connection cost
  - FR-1.5.4: Gas service status (if applicable)

### FR-2: Hard Costs
- FR-2.1: Construction costs
  - FR-2.1.1: AHC modular production cost ($ per sq ft)
  - FR-2.1.2: Foundation/site prep cost
  - FR-2.1.3: Assembly/installation cost
  - FR-2.1.4: MEP connections cost
  - FR-2.1.5: Finish work cost
  - FR-2.1.6: Subtotal with breakdown by component
- FR-2.2: Site work costs
  - FR-2.2.1: Demolition (if existing structures)
  - FR-2.2.2: Grading and earthwork
  - FR-2.2.3: Utilities (water, sewer, electric, gas)
  - FR-2.2.4: Paving and parking
  - FR-2.2.5: Landscaping
  - FR-2.2.6: Stormwater management
- FR-2.3: Contingency
  - FR-2.3.1: Default 7% of hard costs
  - FR-2.3.2: User-adjustable (5-15%)
  - FR-2.3.3: Show impact on total budget

### FR-3: Soft Costs
- FR-3.1: Professional services
  - FR-3.1.1: Architecture/design fees
  - FR-3.1.2: Engineering fees (structural, civil, MEP)
  - FR-3.1.3: Survey fees
  - FR-3.1.4: Geotechnical fees
  - FR-3.1.5: Legal fees
  - FR-3.1.6: Accounting fees
- FR-3.2: Permits and fees
  - FR-3.2.1: Building permit fees
  - FR-3.2.2: Plan review fees
  - FR-3.2.3: Impact fees
  - FR-3.2.4: Utility tap fees
  - FR-3.2.5: Inspection fees
- FR-3.3: Financing costs
  - FR-3.3.1: Loan origination fees
  - FR-3.3.2: Appraisal fees
  - FR-3.3.3: Title and escrow fees
- FR-3.4: Other soft costs
  - FR-3.4.1: Insurance (builder's risk)
  - FR-3.4.2: Marketing/sales costs
  - FR-3.4.3: Property taxes during construction
  - FR-3.4.4: HOA setup (if applicable)

### FR-4: Land Costs
- FR-4.1: Acquisition
  - FR-4.1.1: Display current assessed value
  - FR-4.1.2: Allow input of offered/contracted price
  - FR-4.1.3: Calculate price per sq ft
  - FR-4.1.4: Calculate price per unit (based on density)
- FR-4.2: Closing costs
  - FR-4.2.1: Title insurance
  - FR-4.2.2: Recording fees
  - FR-4.2.3: Transfer taxes
  - FR-4.2.4: Due diligence costs
  - FR-4.2.5: Default to 2% of purchase price

### FR-5: Total Development Cost
- FR-5.1: Calculate TDC = Hard Costs + Soft Costs + Land Costs
- FR-5.2: Display TDC per unit
- FR-5.3: Display TDC per sq ft
- FR-5.4: Show cost breakdown pie chart
- FR-5.5: Compare TDC to projected value (loan-to-value preview)

### FR-6: Capital Stack
- FR-6.1: Debt modeling
  - FR-6.1.1: Senior debt amount and LTV
  - FR-6.1.2: Interest rate
  - FR-6.1.3: Loan term
  - FR-6.1.4: Interest-only period
  - FR-6.1.5: Points/fees
- FR-6.2: Mezzanine/preferred equity (optional)
  - FR-6.2.1: Mezz amount
  - FR-6.2.2: Preferred return rate
  - FR-6.2.3: Terms
- FR-6.3: Equity requirement
  - FR-6.3.1: Calculate required equity = TDC - Debt - Mezz
  - FR-6.3.2: Show equity as % of TDC
- FR-6.4: Pre-configured scenarios
  - FR-6.4.1: Conservative (55% LTV)
  - FR-6.4.2: Standard (65% LTV)
  - FR-6.4.3: Aggressive (75% LTV)
  - FR-6.4.4: Custom

### FR-7: Revenue - Sale Scenario
- FR-7.1: Comp analysis
  - FR-7.1.1: Display comparable sales in area
  - FR-7.1.2: Show $ per sq ft by unit type
  - FR-7.1.3: Show average sale price by unit type
- FR-7.2: Price projections
  - FR-7.2.1: Projected sale price per unit (by type)
  - FR-7.2.2: Total gross sales revenue
  - FR-7.2.3: Less: sales costs (commissions, concessions)
  - FR-7.2.4: Net sales revenue
- FR-7.3: Absorption
  - FR-7.3.1: Estimated sales pace (units/month)
  - FR-7.3.2: Time to sell out
  - FR-7.3.3: Carrying costs during sales period

### FR-8: Revenue - Rent Scenario
- FR-8.1: Rental comp analysis
  - FR-8.1.1: Display comparable rentals in area
  - FR-8.1.2: Show rent per sq ft by unit type
  - FR-8.1.3: Show average rent by unit type
- FR-8.2: Income projections
  - FR-8.2.1: Projected rent per unit (by type)
  - FR-8.2.2: Gross potential rent (annual)
  - FR-8.2.3: Less: vacancy (default 5%)
  - FR-8.2.4: Less: operating expenses
  - FR-8.2.5: Net Operating Income (NOI)
- FR-8.3: Valuation
  - FR-8.3.1: Apply cap rate to NOI
  - FR-8.3.2: Default cap rate from market data
  - FR-8.3.3: User-adjustable cap rate
  - FR-8.3.4: Stabilized value = NOI / Cap Rate

### FR-9: Returns Analysis
- FR-9.1: Sale scenario returns
  - FR-9.1.1: Total profit = Net Sales - TDC
  - FR-9.1.2: Profit margin = Profit / Net Sales
  - FR-9.1.3: Return on cost = Profit / TDC
  - FR-9.1.4: Equity multiple = Net Sales / Equity
- FR-9.2: Rent scenario returns
  - FR-9.2.1: Cash-on-cash return = Cash Flow / Equity
  - FR-9.2.2: Cap rate on cost = NOI / TDC
  - FR-9.2.3: 5-year IRR projection
  - FR-9.2.4: Equity multiple at year 5
- FR-9.3: Comparison
  - FR-9.3.1: Side-by-side sell vs rent comparison
  - FR-9.3.2: Highlight recommended strategy

### FR-10: Sensitivity Analysis
- FR-10.1: Sales price sensitivity (±10%)
  - FR-10.1.1: Show returns at -10%, -5%, base, +5%, +10%
  - FR-10.1.2: Identify breakeven price
- FR-10.2: Construction cost sensitivity (±10%)
  - FR-10.2.1: Show returns at -10%, -5%, base, +5%, +10%
  - FR-10.2.2: Identify max cost before deal fails
- FR-10.3: Schedule delay sensitivity
  - FR-10.3.1: Impact of +3 months delay
  - FR-10.3.2: Impact of +6 months delay
  - FR-10.3.3: Additional carrying costs
- FR-10.4: Interest rate sensitivity
  - FR-10.4.1: Impact of +50 bps
  - FR-10.4.2: Impact of +100 bps
  - FR-10.4.3: Impact of +200 bps

### FR-11: Kill Switches
- FR-11.1: Define deal-breaker thresholds
  - FR-11.1.1: Minimum profit margin (default 15%)
  - FR-11.1.2: Minimum ROI (default 20%)
  - FR-11.1.3: Maximum LTC (default 80%)
- FR-11.2: Automatic alerts
  - FR-11.2.1: Alert when threshold breached
  - FR-11.2.2: Show which scenarios breach thresholds
  - FR-11.2.3: Recommend action (proceed, caution, abort)

### FR-12: Approval Workflow
- FR-12.1: Mark underwriting as complete
- FR-12.2: Generate summary report
- FR-12.3: Allow approval/rejection decision
- FR-12.4: Navigate to Push to Production (PRD-04) on approval

---

## User Interface Specifications

### Screen 1: Underwriting Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Build Options                                                     │
│                                                                             │
│ 1234 Main Street Development                                     [Draft]   │
│ Most Profitable Option - Underwriting                                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Entitle- │ │  Costs  │ │ Capital │ │ Revenue │ │ Returns │ │Sensitiv-│  │
│  │ments    │ │         │ │  Stack  │ │         │ │         │ │  ity    │  │
│  │  ✓      │ │  ●      │ │  ○      │ │  ○      │ │  ○      │ │  ○      │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  ┌───────────────────────────────────────────┬─────────────────────────┐   │
│  │                                           │                         │   │
│  │         MAIN CONTENT AREA                 │    SUMMARY PANEL        │   │
│  │                                           │                         │   │
│  │         (varies by tab)                   │    Total Dev Cost       │   │
│  │                                           │    $2,180,000           │   │
│  │                                           │                         │   │
│  │                                           │    Est. Value           │   │
│  │                                           │    $2,800,000           │   │
│  │                                           │                         │   │
│  │                                           │    Est. Profit          │   │
│  │                                           │    $620,000             │   │
│  │                                           │                         │   │
│  │                                           │    Profit Margin        │   │
│  │                                           │    22% ✓                │   │
│  │                                           │                         │   │
│  │                                           │    ─────────────────    │   │
│  │                                           │                         │   │
│  │                                           │    KILL SWITCHES        │   │
│  │                                           │                         │   │
│  │                                           │    Min Margin: 15% ✓    │   │
│  │                                           │    Min ROI: 20% ✓       │   │
│  │                                           │    Max LTC: 80% ✓       │   │
│  │                                           │                         │   │
│  └───────────────────────────────────────────┴─────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Progress: ████████████████░░░░░░░░░░░░ 40% Complete                       │
│                                                                             │
│  ┌──────────────────────────┐   ┌──────────────────────────┐               │
│  │    Save & Continue       │   │   Complete Underwriting  │               │
│  └──────────────────────────┘   └──────────────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Horizontal tab navigation at top
- Progress indicators on tabs (✓ complete, ● in progress, ○ not started)
- Two-column layout: main content + summary panel
- Fixed summary panel shows key metrics
- Kill switch status always visible
- Progress bar and action buttons at bottom

---

### Screen 2: Entitlements Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  SITE & ENTITLEMENTS                                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ZONING COMPLIANCE                                           All Pass ✓│   │
│  │                                                                     │   │
│  │  Requirement          Limit       Proposed      Status              │   │
│  │  ───────────────────────────────────────────────────────────────   │   │
│  │  Max Units            11          10            ✓ Pass (91%)        │   │
│  │  Max FAR              2.0         1.38          ✓ Pass (69%)        │   │
│  │  Max Coverage         65%         58%           ✓ Pass (89%)        │   │
│  │  Max Height           60 ft       45 ft         ✓ Pass (75%)        │   │
│  │  Front Setback        15 ft       20 ft         ✓ Pass              │   │
│  │  Side Setback         5 ft        5 ft          ✓ Pass              │   │
│  │  Rear Setback         10 ft       15 ft         ✓ Pass              │   │
│  │  Parking Required     15          15            ✓ Pass (100%)       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PERMIT REQUIREMENTS                                                 │   │
│  │                                                                     │   │
│  │  Permit Type              Est. Fee        Est. Timeline            │   │
│  │  ───────────────────────────────────────────────────────────────   │   │
│  │  Site Plan               $2,500          4-6 weeks                 │   │
│  │  Building Permit         $18,500         6-8 weeks                 │   │
│  │  Utility Permits         $3,200          2-4 weeks                 │   │
│  │  ───────────────────────────────────────────────────────────────   │   │
│  │  Total Permit Fees       $24,200         Est. 8-12 weeks           │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ VARIANCE REQUIREMENTS                                       None ✓ │   │
│  │                                                                     │   │
│  │  No variance required for this development option.                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SPECIAL REQUIREMENTS                                                │   │
│  │                                                                     │   │
│  │  ⚠️ FLOOD ZONE (Zone AE)                                           │   │
│  │                                                                     │   │
│  │  • Base flood elevation: 492 ft                                    │   │
│  │  • Required FFE: 493 ft (1 ft above BFE)                          │   │
│  │  • Est. additional foundation cost: $15,000                        │   │
│  │  • Annual flood insurance: ~$2,400/year                           │   │
│  │                                                                     │   │
│  │  ───────────────────────────────────────────────────────────────   │   │
│  │                                                                     │   │
│  │  ✓ TREE SURVEY                                                     │   │
│  │                                                                     │   │
│  │  • No protected trees identified                                   │   │
│  │  • No mitigation required                                          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ UTILITY AVAILABILITY                                                │   │
│  │                                                                     │   │
│  │  Utility          Status       Connection Cost                     │   │
│  │  ───────────────────────────────────────────────────────────────   │   │
│  │  Water            ✓ Available  $8,500 (tap + meter)               │   │
│  │  Wastewater       ✓ Available  $12,000 (tap fee)                  │   │
│  │  Electric         ✓ Available  $3,500 (service)                   │   │
│  │  Gas              ✓ Available  $1,200 (service)                   │   │
│  │  ───────────────────────────────────────────────────────────────   │   │
│  │  Total Utility Costs           $25,200                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Zoning compliance table with pass/fail indicators
- Percentage utilization shown for each limit
- Permit list with fees and timeline estimates
- Variance assessment with risk factors
- Special requirements with cost implications
- Utility availability with connection costs

---

### Screen 3: Costs Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  TOTAL DEVELOPMENT COST                                                     │
│                                                                             │
│  ┌─────────────────────────────┐   ┌───────────────────────────────────┐   │
│  │                             │   │                                   │   │
│  │      [PIE CHART]            │   │  SUMMARY                          │   │
│  │                             │   │                                   │   │
│  │   Hard: 65%                 │   │  Hard Costs      $1,240,000  65%  │   │
│  │   Soft: 12%                 │   │  Soft Costs        $228,000  12%  │   │
│  │   Land: 23%                 │   │  Land Costs        $450,000  23%  │   │
│  │                             │   │  ─────────────────────────────    │   │
│  │                             │   │  TOTAL           $1,918,000       │   │
│  │                             │   │                                   │   │
│  │                             │   │  Per Unit          $191,800       │   │
│  │                             │   │  Per Sq Ft            $155        │   │
│  │                             │   │                                   │   │
│  └─────────────────────────────┘   └───────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ HARD COSTS                                              $1,240,000  │   │
│  │ ▼ Expand                                                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │ CONSTRUCTION                                        $980,000  │ │   │
│  │  │                                                               │ │   │
│  │  │  AHC Modular Production    12,400 sf × $55/sf    $682,000    │ │   │
│  │  │  Foundation/Site Prep                              $85,000    │ │   │
│  │  │  Assembly/Installation                            $120,000    │ │   │
│  │  │  MEP Connections                                   $48,000    │ │   │
│  │  │  Finish Work                                       $45,000    │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │ SITE WORK                                           $175,000  │ │   │
│  │  │                                                               │ │   │
│  │  │  Demolition                                         $12,000   │ │   │
│  │  │  Grading/Earthwork                                  $28,000   │ │   │
│  │  │  Utilities                                          $25,200   │ │   │
│  │  │  Paving/Parking                                     $65,000   │ │   │
│  │  │  Landscaping                                        $22,000   │ │   │
│  │  │  Stormwater                                         $22,800   │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │ CONTINGENCY                          [  7  ]%        $85,000  │ │   │
│  │  │                                                               │ │   │
│  │  │  ────────────────────●───────────────────────                 │ │   │
│  │  │  5%                  7%                    15%                │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SOFT COSTS                                                $228,000  │   │
│  │ ▶ Expand                                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ LAND COSTS                                                $450,000  │   │
│  │ ▶ Expand                                                            │   │
│  │                                                                     │   │
│  │  Acquisition Price    $  [  440,000  ]      $48.89/sf              │   │
│  │  Assessed Value       $450,000              (2% below)             │   │
│  │  Closing Costs (2%)   $8,800                                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Visual pie chart of cost breakdown
- Summary metrics (total, per unit, per sq ft)
- Collapsible sections for each cost category
- Editable fields for key assumptions
- Contingency slider (5-15%)
- Land price input with comparison to assessed value

---

### Screen 4: Capital Stack Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  CAPITAL STACK                                                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ QUICK SELECT                                                        │   │
│  │                                                                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │Conservative│  │███████████│  │ Aggressive │  │   Custom   │   │   │
│  │  │  55% LTV   │  │  Standard │  │  75% LTV   │  │            │   │   │
│  │  │            │  │  65% LTV  │  │            │  │            │   │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │   │
│  │                   [selected]                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────┐   ┌───────────────────────────────────┐   │
│  │                             │   │                                   │   │
│  │   [STACKED BAR CHART]       │   │  CAPITAL STRUCTURE                │   │
│  │                             │   │                                   │   │
│  │   ┌─────────────────────┐   │   │  Total Capital      $1,918,000   │   │
│  │   │                     │   │   │                                   │   │
│  │   │  EQUITY (35%)       │   │   │  ─────────────────────────────   │   │
│  │   │  $671,300           │   │   │                                   │   │
│  │   │                     │   │   │  Senior Debt        $1,246,700   │   │
│  │   ├─────────────────────┤   │   │    65% LTV                       │   │
│  │   │                     │   │   │                                   │   │
│  │   │  SENIOR DEBT (65%)  │   │   │  Equity               $671,300   │   │
│  │   │  $1,246,700         │   │   │    35% of TDC                    │   │
│  │   │                     │   │   │                                   │   │
│  │   └─────────────────────┘   │   │                                   │   │
│  │                             │   │                                   │   │
│  └─────────────────────────────┘   └───────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SENIOR DEBT                                                         │   │
│  │                                                                     │   │
│  │  Loan Amount          $1,246,700        (65% of TDC)               │   │
│  │                                                                     │   │
│  │  Interest Rate        [  7.5  ] %                                  │   │
│  │                       ────────────●──────────────────              │   │
│  │                       5%         7.5%            12%               │   │
│  │                                                                     │   │
│  │  Loan Term            [  24  ] months (construction)               │   │
│  │                                                                     │   │
│  │  Interest Only        [  24  ] months                              │   │
│  │                                                                     │   │
│  │  Origination Fee      [  1.0 ] %           $12,467                 │   │
│  │                                                                     │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │                                                                     │   │
│  │  Monthly Interest     $7,792                                       │   │
│  │  Total Interest (24mo) $186,998                                    │   │
│  │  All-in Cost          $199,465                                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ EQUITY REQUIREMENT                                                  │   │
│  │                                                                     │   │
│  │  Required Equity      $671,300                                     │   │
│  │  Equity % of TDC      35%                                          │   │
│  │                                                                     │   │
│  │  Equity per Unit      $67,130                                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Quick-select buttons for common scenarios
- Visual stacked bar chart of capital structure
- Editable loan parameters
- Interest calculation preview
- Equity requirement summary

---

### Screen 5: Revenue Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  REVENUE PROJECTIONS                                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  [  SELL  ]          [  RENT  ]                                    │   │
│  │  ▀▀▀▀▀▀▀▀▀▀▀                                                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ COMPARABLE SALES                                                    │   │
│  │                                                                     │   │
│  │  Address                 Date      Units  Size    $/SF    Price    │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  456 Oak Street         Oct 2024   1BR    750sf   $380   $285,000  │   │
│  │  789 Elm Avenue         Sep 2024   2BR    950sf   $365   $346,750  │   │
│  │  321 Pine Road          Aug 2024   1BR    800sf   $375   $300,000  │   │
│  │  654 Cedar Lane         Jul 2024   2BR    1000sf  $355   $355,000  │   │
│  │                                                                     │   │
│  │  Average                                          $369              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SALE PRICE PROJECTIONS                                              │   │
│  │                                                                     │   │
│  │  Unit Type   Count   Avg Size   $/SF      Price/Unit    Total      │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  Studio      1       550 sf     $365      $200,750      $200,750   │   │
│  │  1 BR        4       750 sf     $370      $277,500      $1,110,000 │   │
│  │  2 BR        4       1,000 sf   $365      $365,000      $1,460,000 │   │
│  │  3 BR        1       1,400 sf   $350      $490,000      $490,000   │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  TOTAL       10      850 sf     $365      $326,075      $3,260,750 │   │
│  │                                                                     │   │
│  │  Adjust $/SF:  ─────────────────●─────────────────  $365/sf        │   │
│  │                $300            $365               $450              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SALE PROCEEDS                                                       │   │
│  │                                                                     │   │
│  │  Gross Sales Revenue                            $3,260,750         │   │
│  │                                                                     │   │
│  │  Less: Sales Commissions    [  5  ]%             ($163,038)        │   │
│  │  Less: Closing Costs        [  1  ]%              ($32,608)        │   │
│  │  Less: Concessions          [  2  ]%              ($65,215)        │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  Net Sales Revenue                              $2,999,889         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ABSORPTION                                                          │   │
│  │                                                                     │   │
│  │  Sales Pace             [  2  ] units/month                        │   │
│  │  Time to Sell Out       5 months                                   │   │
│  │  Carrying Costs         $38,960 (5mo × $7,792)                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Toggle between Sell and Rent scenarios
- Comparable sales/rentals table
- Price projections by unit type
- Adjustable $/SF slider
- Sales costs breakdown
- Absorption/pace modeling

---

### Screen 6: Returns Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  RETURNS ANALYSIS                                                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │            SELL SCENARIO                    RENT SCENARIO           │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────┐    ┌─────────────────────────┐        │   │
│  │  │                         │    │                         │        │   │
│  │  │    PROFIT               │    │    NOI (Year 1)         │        │   │
│  │  │    $843,424             │    │    $168,000             │        │   │
│  │  │                         │    │                         │        │   │
│  │  │    MARGIN               │    │    CASH-ON-CASH         │        │   │
│  │  │    28.1%   ✓            │    │    10.2%                │        │   │
│  │  │                         │    │                         │        │   │
│  │  │    ROC                  │    │    CAP ON COST          │        │   │
│  │  │    44.0%   ✓            │    │    8.8%                 │        │   │
│  │  │                         │    │                         │        │   │
│  │  │    EQUITY MULTIPLE      │    │    5-YR IRR             │        │   │
│  │  │    2.26x                │    │    18.5%                │        │   │
│  │  │                         │    │                         │        │   │
│  │  └─────────────────────────┘    └─────────────────────────┘        │   │
│  │                                                                     │   │
│  │                    ★ RECOMMENDED: SELL                              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SELL SCENARIO - DETAILED                                            │   │
│  │                                                                     │   │
│  │  USES                              SOURCES                          │   │
│  │  ───────────────────────────       ───────────────────────────     │   │
│  │  Land Acquisition    $448,800      Senior Debt      $1,246,700     │   │
│  │  Hard Costs        $1,240,000      Equity             $671,300     │   │
│  │  Soft Costs          $228,000                                      │   │
│  │  Carry Costs          $38,960                                      │   │
│  │  ───────────────────────────       ───────────────────────────     │   │
│  │  Total Uses        $1,955,760      Total Sources    $1,918,000     │   │
│  │                                                                     │   │
│  │                                                                     │   │
│  │  RETURNS                                                            │   │
│  │  ───────────────────────────────────────────────────────────────   │   │
│  │  Net Sales Revenue                                   $2,999,889    │   │
│  │  Less: Total Development Cost                       ($1,918,000)   │   │
│  │  Less: Carry Costs                                     ($38,960)   │   │
│  │  Less: Financing Costs                                ($199,465)   │   │
│  │  ───────────────────────────────────────────────────────────────   │   │
│  │  Total Profit                                          $843,464    │   │
│  │                                                                     │   │
│  │  Profit Margin (Profit / Net Sales)                       28.1%    │   │
│  │  Return on Cost (Profit / TDC)                            44.0%    │   │
│  │  Return on Equity (Profit / Equity)                      125.7%    │   │
│  │  Equity Multiple (Returns / Equity)                        2.26x   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Side-by-side comparison of sell vs rent scenarios
- Key metrics highlighted for each
- Recommendation indicator
- Detailed sources/uses breakdown
- Full returns calculation

---

### Screen 7: Sensitivity Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  SENSITIVITY ANALYSIS                                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SALES PRICE SENSITIVITY                                             │   │
│  │                                                                     │   │
│  │  Change      $/SF       Profit      Margin     ROC      Status     │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  -10%        $329      $517,424     17.2%     27.0%    ⚠️ Caution  │   │
│  │  -5%         $347      $680,424     22.6%     35.5%    ✓ Pass      │   │
│  │  Base        $365      $843,424     28.1%     44.0%    ✓ Pass      │   │
│  │  +5%         $383     $1,006,424    33.5%     52.5%    ✓ Pass      │   │
│  │  +10%        $401     $1,169,424    38.9%     61.0%    ✓ Pass      │   │
│  │                                                                     │   │
│  │  Breakeven Price: $298/sf (-18.4%)                                 │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ CONSTRUCTION COST SENSITIVITY                                       │   │
│  │                                                                     │   │
│  │  Change      Hard $     Profit      Margin     ROC      Status     │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  +10%       $1,364K     $719,424    24.0%     34.8%    ✓ Pass      │   │
│  │  +5%        $1,302K     $781,424    26.0%     39.2%    ✓ Pass      │   │
│  │  Base       $1,240K     $843,424    28.1%     44.0%    ✓ Pass      │   │
│  │  -5%        $1,178K     $905,424    30.2%     49.2%    ✓ Pass      │   │
│  │  -10%       $1,116K     $967,424    32.3%     54.8%    ✓ Pass      │   │
│  │                                                                     │   │
│  │  Max Cost Before Fail: $1,580K (+27.4%)                            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SCHEDULE DELAY SENSITIVITY                                          │   │
│  │                                                                     │   │
│  │  Delay       Add'l Carry   Add'l Interest   Profit     Status      │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  Base        $0            $0               $843,424   ✓ Pass      │   │
│  │  +3 months   $23,376       $46,752          $773,296   ✓ Pass      │   │
│  │  +6 months   $46,752       $93,504          $703,168   ✓ Pass      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ INTEREST RATE SENSITIVITY                                           │   │
│  │                                                                     │   │
│  │  Rate        Monthly Int   Total Int     Profit       Status       │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  Base 7.5%   $7,792       $186,998      $843,424     ✓ Pass        │   │
│  │  +50 bps     $8,312       $199,479      $830,943     ✓ Pass        │   │
│  │  +100 bps    $8,831       $211,952      $818,470     ✓ Pass        │   │
│  │  +200 bps    $9,870       $236,890      $793,532     ✓ Pass        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ KILL SWITCH STATUS                                          All ✓  │   │
│  │                                                                     │   │
│  │  Threshold               Value      Base Case    Worst Case        │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  Min Profit Margin       15%        28.1% ✓      17.2% ✓           │   │
│  │  Min ROC                 20%        44.0% ✓      27.0% ✓           │   │
│  │  Max LTC                 80%        64.0% ✓      68.5% ✓           │   │
│  │                                                                     │   │
│  │  ★ Project passes all kill switch thresholds in all scenarios      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Tables for each sensitivity variable
- Status indicators (Pass/Caution/Fail)
- Breakeven calculations
- Kill switch summary with worst-case validation

---

### Screen 8: Approval Modal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                            [×]              │
│                                                                             │
│                         Underwriting Complete                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  1234 Main Street Development                                       │   │
│  │  Most Profitable Option                                             │   │
│  │                                                                     │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │                                                                     │   │
│  │  Total Development Cost              $1,918,000                     │   │
│  │  Projected Value (Sale)              $2,999,889                     │   │
│  │  Projected Profit                    $843,424                       │   │
│  │  Profit Margin                       28.1%                          │   │
│  │  Return on Cost                      44.0%                          │   │
│  │                                                                     │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │                                                                     │   │
│  │  Kill Switches                       All Pass ✓                     │   │
│  │  Sensitivity Analysis                Robust ✓                       │   │
│  │  Entitlements                        Verified ✓                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Ready to proceed to production?                                    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌────────────────────────┐        ┌────────────────────────┐             │
│  │    Save for Later      │        │   Approve & Continue   │             │
│  │                        │        │   to Production →      │             │
│  └────────────────────────┘        └────────────────────────┘             │
│                                                                             │
│  [Download Summary Report (PDF)]                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## User Flow

```
┌─────────────────────────────┐
│  Build Options (PRD-02)     │
│  Select option & continue   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Entitlements Tab           │
│  • Verify zoning compliance │
│  • Review permit reqs       │
│  • Check special reqs       │
│  • Confirm utilities        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Costs Tab                  │
│  • Review hard costs        │
│  • Review soft costs        │
│  • Input land price         │
│  • Adjust contingency       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Capital Stack Tab          │
│  • Select financing scenario│
│  • Adjust loan terms        │
│  • Review equity required   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Revenue Tab                │
│  • Review comps             │
│  • Adjust price assumptions │
│  • Compare sell vs rent     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Returns Tab                │
│  • Review profit metrics    │
│  • Compare scenarios        │
│  • See recommendation       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Sensitivity Tab            │
│  • Stress test assumptions  │
│  • Review kill switches     │
│  • Assess risk tolerance    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Complete Underwriting      │
│  • Review summary           │
│  • Download report          │
│  • Approve or save          │
└──────────────┬──────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│ Save for     │ │ Approve &    │
│ Later        │ │ Continue     │
│              │ │              │
│ Return to    │ │ Navigate to  │
│ dashboard    │ │ PRD-04       │
└──────────────┘ └──────────────┘
```

---

## Acceptance Criteria

### AC-1: Entitlements
- [ ] All zoning limits display correctly with pass/fail status
- [ ] Permit fees match city fee schedules
- [ ] Variance requirements correctly identified
- [ ] Utility availability accurate for location

### AC-2: Costs
- [ ] Hard costs calculate correctly based on building size
- [ ] Soft costs default to reasonable market rates
- [ ] Land costs allow user input
- [ ] Contingency slider updates totals in real-time
- [ ] Per-unit and per-SF metrics calculate correctly

### AC-3: Capital Stack
- [ ] LTV scenarios calculate correct debt amounts
- [ ] Interest calculations are accurate
- [ ] Equity requirement = TDC - Debt
- [ ] Quick-select buttons update all fields

### AC-4: Revenue
- [ ] Comparable sales display relevant nearby sales
- [ ] Price slider updates projections in real-time
- [ ] Sales costs calculate correctly
- [ ] Rent scenario calculates NOI correctly

### AC-5: Returns
- [ ] Profit = Net Revenue - TDC - Financing Costs
- [ ] Margin = Profit / Net Revenue
- [ ] ROC = Profit / TDC
- [ ] Equity multiple = Total Returns / Equity
- [ ] Sell vs Rent comparison is accurate

### AC-6: Sensitivity
- [ ] Tables show correct values at each scenario
- [ ] Breakeven calculations are accurate
- [ ] Status indicators reflect kill switch thresholds
- [ ] Worst-case scenarios identify correctly

### AC-7: Approval
- [ ] Summary displays all key metrics
- [ ] PDF report generates correctly
- [ ] Approval updates project status
- [ ] Navigation to Push to Production works

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Underwriting completion rate | > 70% | Projects completing all tabs |
| Time to complete underwriting | < 30 minutes | Average time from start to approval |
| Cost estimate accuracy | ±10% | Actual vs estimated (post-construction) |
| Kill switch usage | > 80% | Projects reviewing sensitivity analysis |
| Report downloads | > 50% | Projects downloading PDF summary |

---

## Dependencies

- **PRD-02 (Build Options)**: Selected option with metrics
- **Market Data Service**: Comparable sales/rentals
- **Cost Database**: Current construction costs
- **Zoning Database**: Permit fees and requirements

---

## Out of Scope

- Automated lender submissions
- Integration with accounting systems
- Multi-project portfolio analysis
- Tax planning and optimization
- Legal document generation
- Insurance quote integration
- Construction scheduling integration
- Detailed unit-level pro forma
- 10-year cash flow projections
- Monte Carlo simulation
