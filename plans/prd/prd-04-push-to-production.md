# PRD 04: Push to Production

## Overview

Push to Production connects approved development projects to AHC's manufacturing and construction operations. When a developer approves a project, this system orchestrates all downstream processes: generating project schedules, creating engineering and permit documents, managing subcontractor RFQs, and ultimately generating work orders for factory production. This PRD bridges the gap between real estate development decisions and physical construction.

## Objectives

1. Automate the transition from approved project to active production
2. Generate comprehensive project schedules with all milestones
3. Produce required engineering and permit documentation
4. Streamline subcontractor procurement through RFQ management
5. Create work orders that integrate with existing factory production systems
6. Provide real-time visibility into project progress

## User Stories

### Project Kickoff
- As a developer, I want to initiate production with one click so the project moves forward immediately
- As a developer, I want to see all required steps so I understand what happens next
- As a developer, I want to track overall project status so I know if we're on schedule

### Schedule Management
- As a project manager, I want an auto-generated schedule so I don't build it manually
- As a project manager, I want to see all milestones so I can track progress
- As a project manager, I want to adjust dates so I can accommodate real-world changes
- As a project manager, I want to see dependencies so I understand the critical path

### Document Generation
- As an engineer, I want engineering documents generated from the design so I save drafting time
- As a permit coordinator, I want permit-ready documents so I can submit immediately
- As a project manager, I want to track document status so I know what's complete

### Permit Management
- As a permit coordinator, I want to track permit submissions so nothing falls through cracks
- As a permit coordinator, I want to log permit status updates so the team stays informed
- As a project manager, I want permit timeline visibility so I can plan accordingly

### Subcontractor Procurement
- As a procurement manager, I want to create RFQs from project scope so I get accurate quotes
- As a procurement manager, I want to send RFQs to multiple subs so I can compare bids
- As a procurement manager, I want to track quote responses so I can award on time
- As a procurement manager, I want to evaluate subs by price and reputation so I make good decisions

### Work Order Generation
- As a production planner, I want work orders auto-generated so production can start immediately
- As a production planner, I want work orders linked to the project so I have full traceability
- As a factory manager, I want to see incoming work from RE projects so I can plan capacity

### Progress Tracking
- As a developer, I want a single dashboard showing all project progress
- As a stakeholder, I want status updates without logging into multiple systems
- As a project manager, I want to identify blockers so I can resolve them quickly

---

## Functional Requirements

### FR-1: Production Kickoff
- FR-1.1: "Push to Production" button on approved underwriting
- FR-1.2: Confirmation modal with checklist of actions to be taken
- FR-1.3: Create production project record linked to development project
- FR-1.4: Update project status to "In Production"
- FR-1.5: Notify relevant team members of new project
- FR-1.6: Generate unique production project ID

### FR-2: Schedule Generation
- FR-2.1: Auto-generate project schedule based on:
  - FR-2.1.1: Project size (units, sq ft)
  - FR-2.1.2: Building complexity
  - FR-2.1.3: Permit requirements
  - FR-2.1.4: Factory capacity
- FR-2.2: Standard milestone categories:
  - FR-2.2.1: Pre-construction (engineering, permits, procurement)
  - FR-2.2.2: Site preparation (demo, grading, utilities)
  - FR-2.2.3: Factory production (module fabrication)
  - FR-2.2.4: Delivery and installation
  - FR-2.2.5: Finish work and punch list
  - FR-2.2.6: Final inspections and closeout
- FR-2.3: Milestone details:
  - FR-2.3.1: Name and description
  - FR-2.3.2: Planned start and end dates
  - FR-2.3.3: Dependencies (predecessors)
  - FR-2.3.4: Responsible party
  - FR-2.3.5: Status (not started, in progress, complete, blocked)
- FR-2.4: Schedule views:
  - FR-2.4.1: Gantt chart view
  - FR-2.4.2: List view with filters
  - FR-2.4.3: Calendar view
- FR-2.5: Manual adjustments:
  - FR-2.5.1: Edit milestone dates
  - FR-2.5.2: Add custom milestones
  - FR-2.5.3: Mark milestones complete
  - FR-2.5.4: Add notes/comments

### FR-3: Document Generation
- FR-3.1: Engineering documents:
  - FR-3.1.1: Structural drawings
  - FR-3.1.2: MEP drawings
  - FR-3.1.3: Foundation plans
  - FR-3.1.4: Site plans
  - FR-3.1.5: Architectural elevations
- FR-3.2: Permit documents:
  - FR-3.2.1: Building permit application
  - FR-3.2.2: Site plan for city review
  - FR-3.2.3: Utility connection applications
  - FR-3.2.4: Stormwater management plan
  - FR-3.2.5: Tree mitigation plan (if required)
- FR-3.3: Document management:
  - FR-3.3.1: Track generation status
  - FR-3.3.2: Preview generated documents
  - FR-3.3.3: Download individual documents
  - FR-3.3.4: Download complete document package
  - FR-3.3.5: Version control for revisions
- FR-3.4: Generation status:
  - FR-3.4.1: Queued
  - FR-3.4.2: Generating
  - FR-3.4.3: Ready for review
  - FR-3.4.4: Approved
  - FR-3.4.5: Needs revision

### FR-4: Permit Workflow
- FR-4.1: Permit tracking:
  - FR-4.1.1: List all required permits
  - FR-4.1.2: Track submission dates
  - FR-4.1.3: Track review status
  - FR-4.1.4: Record approval/rejection
  - FR-4.1.5: Store permit numbers
- FR-4.2: Permit statuses:
  - FR-4.2.1: Not submitted
  - FR-4.2.2: Submitted - under review
  - FR-4.2.3: Revision requested
  - FR-4.2.4: Approved
  - FR-4.2.5: Rejected
- FR-4.3: Permit timeline:
  - FR-4.3.1: Estimated review duration
  - FR-4.3.2: Actual submission date
  - FR-4.3.3: Expected approval date
  - FR-4.3.4: Actual approval date
- FR-4.4: Notifications:
  - FR-4.4.1: Alert when permit submitted
  - FR-4.4.2: Alert when revision requested
  - FR-4.4.3: Alert when approved/rejected

### FR-5: RFQ Management
- FR-5.1: RFQ creation:
  - FR-5.1.1: Auto-populate scope from project
  - FR-5.1.2: Define work categories (site work, utilities, landscaping, etc.)
  - FR-5.1.3: Attach relevant drawings/specs
  - FR-5.1.4: Set response deadline
  - FR-5.1.5: Add special requirements/notes
- FR-5.2: Subcontractor management:
  - FR-5.2.1: Maintain subcontractor database
  - FR-5.2.2: Categorize by trade/specialty
  - FR-5.2.3: Track performance history
  - FR-5.2.4: Store contact information
  - FR-5.2.5: Note preferred/approved status
- FR-5.3: RFQ distribution:
  - FR-5.3.1: Select subcontractors to invite
  - FR-5.3.2: Send RFQ via email
  - FR-5.3.3: Track delivery/open status
  - FR-5.3.4: Send reminders before deadline
- FR-5.4: Quote collection:
  - FR-5.4.1: Receive quotes electronically
  - FR-5.4.2: Manual quote entry option
  - FR-5.4.3: Track response status
  - FR-5.4.4: Store quote documents
- FR-5.5: Quote evaluation:
  - FR-5.5.1: Compare quotes side-by-side
  - FR-5.5.2: Score by price
  - FR-5.5.3: Score by reputation/history
  - FR-5.5.4: Add evaluation notes
  - FR-5.5.5: Recommend award
- FR-5.6: Award process:
  - FR-5.6.1: Select winning bidder
  - FR-5.6.2: Generate award notification
  - FR-5.6.3: Notify unsuccessful bidders
  - FR-5.6.4: Create purchase order

### FR-6: Work Order Generation
- FR-6.1: Automatic work order creation:
  - FR-6.1.1: Generate WOs for each production phase
  - FR-6.1.2: Link WOs to project
  - FR-6.1.3: Assign to appropriate work centers
  - FR-6.1.4: Include relevant drawings/specs
- FR-6.2: Work order types:
  - FR-6.2.1: Module fabrication WOs
  - FR-6.2.2: Component production WOs
  - FR-6.2.3: Assembly WOs
  - FR-6.2.4: Quality inspection WOs
- FR-6.3: Work order details:
  - FR-6.3.1: Description and scope
  - FR-6.3.2: Required materials/parts
  - FR-6.3.3: Work instructions link
  - FR-6.3.4: Target completion date
  - FR-6.3.5: Priority level
- FR-6.4: Integration with existing WO system:
  - FR-6.4.1: Use existing work order model
  - FR-6.4.2: Appear in production kanban
  - FR-6.4.3: Time tracking integration
  - FR-6.4.4: Status sync back to project

### FR-7: Project Dashboard
- FR-7.1: Overview metrics:
  - FR-7.1.1: Overall project status
  - FR-7.1.2: Schedule health (on track, at risk, delayed)
  - FR-7.1.3: Budget status
  - FR-7.1.4: Next milestone
  - FR-7.1.5: Days to completion
- FR-7.2: Phase progress:
  - FR-7.2.1: Pre-construction progress %
  - FR-7.2.2: Permitting progress %
  - FR-7.2.3: Procurement progress %
  - FR-7.2.4: Production progress %
  - FR-7.2.5: Installation progress %
- FR-7.3: Activity feed:
  - FR-7.3.1: Recent status changes
  - FR-7.3.2: Document uploads
  - FR-7.3.3: Quote submissions
  - FR-7.3.4: Milestone completions
- FR-7.4: Blockers/risks:
  - FR-7.4.1: List current blockers
  - FR-7.4.2: Risk indicators
  - FR-7.4.3: Action items

---

## User Interface Specifications

### Screen 1: Push to Production Confirmation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                            [×]              │
│                                                                             │
│                        Push to Production                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  1234 Main Street Development                                       │   │
│  │  Most Profitable Option - 10 Units                                  │   │
│  │                                                                     │   │
│  │  You're about to initiate production. This will:                   │   │
│  │                                                                     │   │
│  │  ☑ Create project schedule with all milestones                     │   │
│  │  ☑ Generate engineering and permit documents                       │   │
│  │  ☑ Set up permit tracking workflow                                 │   │
│  │  ☑ Create RFQ templates for subcontractor work                    │   │
│  │  ☑ Generate work orders for factory production                     │   │
│  │  ☑ Notify production team of new project                          │   │
│  │                                                                     │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │                                                                     │   │
│  │  Estimated Schedule:                                                │   │
│  │                                                                     │   │
│  │  Pre-construction       8-12 weeks                                 │   │
│  │  Factory Production     6-8 weeks                                  │   │
│  │  Installation           2-3 weeks                                  │   │
│  │  Closeout               2-4 weeks                                  │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  Total                  18-27 weeks                                │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌────────────────────────┐        ┌────────────────────────┐             │
│  │       Cancel           │        │   Start Production →   │             │
│  └────────────────────────┘        └────────────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Centered confirmation modal
- Summary of project details
- Checklist of actions that will be taken
- Estimated schedule summary
- Cancel and Confirm buttons

---

### Screen 2: Project Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Projects                                                          │
│                                                                             │
│ 1234 Main Street Development                              [In Production]  │
│ PRJ-2024-0042                                                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         PROJECT OVERVIEW                            │   │
│  │                                                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │  STATUS  │  │ SCHEDULE │  │  BUDGET  │  │   NEXT   │           │   │
│  │  │          │  │          │  │          │  │MILESTONE │           │   │
│  │  │ On Track │  │ On Track │  │ On Track │  │ Permits  │           │   │
│  │  │    ✓     │  │    ✓     │  │    ✓     │  │ Due 2/15 │           │   │
│  │  │          │  │          │  │          │  │          │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │   │
│  │                                                                     │   │
│  │  Overall Progress                                                   │   │
│  │  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  35%         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │ PHASE PROGRESS                   │  │ RECENT ACTIVITY               │ │
│  │                                  │  │                                │ │
│  │ Pre-Construction                 │  │ Today                          │ │
│  │ ████████████████████████░░  85%  │  │ • Engineering docs approved    │ │
│  │                                  │  │ • RFQ sent to 5 site work subs │ │
│  │ Permitting                       │  │                                │ │
│  │ ██████████░░░░░░░░░░░░░░░░  40%  │  │ Yesterday                      │ │
│  │                                  │  │ • Site plan submitted to city  │ │
│  │ Procurement                      │  │ • Foundation plan completed    │ │
│  │ ████████████████░░░░░░░░░░  60%  │  │                                │ │
│  │                                  │  │ Jan 28                         │ │
│  │ Factory Production               │  │ • Project schedule created     │ │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │  │ • Document generation started  │ │
│  │                                  │  │                                │ │
│  │ Installation                     │  │ [View All Activity →]          │ │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │  │                                │ │
│  │                                  │  │                                │ │
│  └──────────────────────────────────┘  └────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ ATTENTION NEEDED (2)                                             │   │
│  │                                                                     │   │
│  │  • Utility permit revision requested - respond by Feb 3            │   │
│  │  • Landscaping RFQ deadline tomorrow - 2 quotes received           │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  [Schedule]  [Documents]  [Permits]  [RFQs]  [Work Orders]  [Financials]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Header with project name, ID, and status badge
- Overview cards (status, schedule, budget, next milestone)
- Overall progress bar
- Two-column layout: phase progress + activity feed
- Attention needed banner for blockers
- Tab navigation to detail sections

---

### Screen 3: Schedule Tab (Gantt View)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  PROJECT SCHEDULE                                      [List] [Gantt] [Cal] │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Task                    Jan        Feb        Mar        Apr       │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │                                                                     │   │
│  │  ▼ PRE-CONSTRUCTION                                                 │   │
│  │                                                                     │   │
│  │    Engineering Docs      ████████▓▓                                │   │
│  │                          Complete                                   │   │
│  │                                                                     │   │
│  │    Permit Docs           ████████▓▓                                │   │
│  │                          Complete                                   │   │
│  │                                                                     │   │
│  │    Submit Permits              ██████████████░░░░                  │   │
│  │                                In Progress                          │   │
│  │                                                                     │   │
│  │  ▼ PROCUREMENT                                                      │   │
│  │                                                                     │   │
│  │    Site Work RFQ              ████████░░                           │   │
│  │                               In Progress                           │   │
│  │                                                                     │   │
│  │    Utility RFQ                ████████░░                           │   │
│  │                               In Progress                           │   │
│  │                                                                     │   │
│  │    Award Contracts                      ░░░░░░░░░░                 │   │
│  │                                         Not Started                 │   │
│  │                                                                     │   │
│  │  ▼ FACTORY PRODUCTION                                               │   │
│  │                                                                     │   │
│  │    Module Fabrication                         ░░░░░░░░░░░░░░░░░░  │   │
│  │                                               Not Started           │   │
│  │                                                                     │   │
│  │    Quality Inspection                              ░░░░░░░░░░     │   │
│  │                                                    Not Started      │   │
│  │                                                                     │   │
│  │  ▼ INSTALLATION                                                     │   │
│  │                                                                     │   │
│  │    Site Prep                                              ░░░░░░  │   │
│  │                                                           Pending   │   │
│  │                                                                     │   │
│  │    Module Delivery                                           ░░░░ │   │
│  │                                                              Pending│   │
│  │                                                                     │   │
│  │    Assembly                                                   ░░░░░│   │
│  │                                                               Pending│   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Legend: ████ Complete  ░░░░ Planned  ▓▓▓▓ In Progress                     │
│                                                                             │
│  [+ Add Milestone]                                    [Export Schedule]     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Gantt chart with monthly columns
- Collapsible phase sections
- Color-coded status bars
- Click to edit milestone details
- Add custom milestones
- Export to PDF/Excel

---

### Screen 4: Documents Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  PROJECT DOCUMENTS                                                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ENGINEERING DOCUMENTS                                    3/5 Ready  │   │
│  │                                                                     │   │
│  │  Document                  Status           Actions                 │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  📄 Structural Drawings    ✓ Approved       [View] [Download]      │   │
│  │  📄 MEP Drawings           ✓ Approved       [View] [Download]      │   │
│  │  📄 Foundation Plan        ✓ Approved       [View] [Download]      │   │
│  │  📄 Site Plan              ● Generating...   —                      │   │
│  │  📄 Elevations             ○ Queued         —                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PERMIT DOCUMENTS                                         4/4 Ready  │   │
│  │                                                                     │   │
│  │  Document                  Status           Actions                 │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  📄 Building Permit App    ✓ Ready          [View] [Download]      │   │
│  │  📄 Site Plan (City)       ✓ Ready          [View] [Download]      │   │
│  │  📄 Utility Applications   ✓ Ready          [View] [Download]      │   │
│  │  📄 Stormwater Plan        ✓ Ready          [View] [Download]      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ RFQ PACKAGES                                             2/3 Ready  │   │
│  │                                                                     │   │
│  │  Package                   Status           Actions                 │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  📦 Site Work Package      ✓ Ready          [View] [Download]      │   │
│  │  📦 Utility Package        ✓ Ready          [View] [Download]      │   │
│  │  📦 Landscaping Package    ● Generating...   —                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────┐                                          │
│  │   Download All Documents    │                                          │
│  └──────────────────────────────┘                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Grouped by document type
- Progress indicator per group
- Status icons (✓ ready, ● generating, ○ queued)
- View and download actions
- Bulk download option

---

### Screen 5: Permits Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  PERMIT TRACKING                                                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  PERMIT TIMELINE                                                    │   │
│  │                                                                     │   │
│  │  Building Permit    ──●────────────────●────────────────○          │   │
│  │                     Submitted       Under Review      Approved      │   │
│  │                     Jan 28         (current)         Est. Feb 28    │   │
│  │                                                                     │   │
│  │  Site Permit        ──●────────────────○────────────────○          │   │
│  │                     Submitted       Under Review      Approved      │   │
│  │                     Jan 30         Est. Feb 10       Est. Feb 20    │   │
│  │                                                                     │   │
│  │  Utility Permit     ──●────────────────●────────────────○          │   │
│  │                     Submitted       ⚠️ Revision       Approved      │   │
│  │                     Jan 25         Requested         Est. Feb 15    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PERMIT DETAILS                                                      │   │
│  │                                                                     │   │
│  │  Permit            Status          Submitted    Est. Approval      │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  Building          Under Review    Jan 28       Feb 28             │   │
│  │  Site Plan         Under Review    Jan 30       Feb 20             │   │
│  │  Utility           ⚠️ Revision     Jan 25       Feb 15             │   │
│  │  Stormwater        Not Submitted   —            —                  │   │
│  │                                                                     │   │
│  │  [+ Log Status Update]                                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ ACTION REQUIRED                                                  │   │
│  │                                                                     │   │
│  │  Utility Permit - Revision Requested                               │   │
│  │                                                                     │   │
│  │  The city has requested the following revisions:                   │   │
│  │  • Update tap location per utility dept requirements               │   │
│  │  • Add meter detail to drawing                                     │   │
│  │                                                                     │   │
│  │  Respond by: Feb 3, 2025                                           │   │
│  │                                                                     │   │
│  │  [Upload Revised Documents]    [Mark as Resolved]                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Visual timeline for each permit
- Status indicators at each stage
- Action required callout for revisions
- Upload revised documents
- Log status updates manually

---

### Screen 6: RFQs Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  RFQ MANAGEMENT                                           [+ Create RFQ]   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  RFQ                Status      Sent To   Quotes    Deadline       │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  Site Work          Collecting   5        3/5       Feb 5  ⚠️      │   │
│  │  Utilities          Collecting   4        2/4       Feb 8          │   │
│  │  Landscaping        Draft        —        —         —              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SITE WORK RFQ                                           [Edit RFQ] │   │
│  │                                                                     │   │
│  │ Scope: Demolition, grading, earthwork, drainage                    │   │
│  │ Deadline: Feb 5, 2025 (2 days)                                     │   │
│  │                                                                     │   │
│  │ ─────────────────────────────────────────────────────────────      │   │
│  │                                                                     │   │
│  │ QUOTES RECEIVED (3 of 5)                                           │   │
│  │                                                                     │   │
│  │  Contractor          Quote       Rating    Status                  │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  ABC Excavation      $142,500    ★★★★☆    ✓ Received              │   │
│  │  XYZ Grading         $156,200    ★★★★★    ✓ Received              │   │
│  │  123 Site Work       $138,900    ★★★☆☆    ✓ Received              │   │
│  │  DEF Construction    —           ★★★★☆    ○ Pending               │   │
│  │  GHI Contractors     —           ★★★★★    ○ Pending               │   │
│  │                                                                     │   │
│  │  [Send Reminder to Pending]                                        │   │
│  │                                                                     │   │
│  │ ─────────────────────────────────────────────────────────────      │   │
│  │                                                                     │   │
│  │ [Compare Quotes]                           [Award Contract]        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- RFQ list with status summary
- Quote collection progress
- Contractor rating display
- Send reminders to pending
- Compare quotes and award contract

---

### Screen 7: Quote Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to RFQ                                                               │
│                                                                             │
│ Site Work RFQ - Quote Comparison                                            │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐   │
│  │ ABC EXCAVATION      │ │ XYZ GRADING         │ │ 123 SITE WORK       │   │
│  │                     │ │                     │ │                     │   │
│  │ $142,500            │ │ $156,200            │ │ $138,900            │   │
│  │                     │ │                     │ │                     │   │
│  │ ★★★★☆ (4.2)        │ │ ★★★★★ (4.8)        │ │ ★★★☆☆ (3.1)        │   │
│  │ 12 projects         │ │ 8 projects          │ │ 3 projects          │   │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  COMPARISON                          ABC         XYZ         123           │
│  ───────────────────────────────────────────────────────────────────────   │
│  Quote Amount                       $142,500    $156,200    $138,900 ▲    │
│  Timeline (weeks)                   4           3 ▲         5             │
│  Rating                             ★★★★☆      ★★★★★ ▲     ★★★☆☆         │
│  Past Projects                      12          8           3             │
│  On-Time Delivery                   92%         98% ▲       85%           │
│  Insurance Verified                 ✓           ✓           ✓             │
│  References Checked                 ✓           ✓           ○             │
│  ───────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  EVALUATION NOTES                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │ ABC: Good price, reliable track record. 4-week timeline is         │   │
│  │ acceptable for project schedule.                                    │   │
│  │                                                                     │   │
│  │ XYZ: Premium price but excellent reputation and fastest timeline.  │   │
│  │ May be worth the premium for schedule certainty.                   │   │
│  │                                                                     │   │
│  │ 123: Lowest price but limited experience and lower ratings.        │   │
│  │ Risk of delays or quality issues.                                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ★ RECOMMENDATION: XYZ Grading                                             │
│  Best combination of quality, timeline, and reliability. Price premium    │
│  justified by reduced schedule risk.                                       │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   Award to ABC   │  │   Award to XYZ   │  │   Award to 123   │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Side-by-side contractor cards
- Detailed comparison table
- "▲" indicator for best in category
- Evaluation notes area
- System recommendation
- Award buttons

---

### Screen 8: Work Orders Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  WORK ORDERS                                            [+ Manual WO]      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ WORK ORDER SUMMARY                                                  │   │
│  │                                                                     │   │
│  │  Total WOs: 24        Not Started: 18    In Progress: 4   Done: 2  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Filter: [All Phases ▼]  [All Statuses ▼]  [All Work Centers ▼]           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  WO #          Description              Work Center    Status      │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │                                                                     │   │
│  │  ▼ MODULE FABRICATION (10 WOs)                                     │   │
│  │                                                                     │   │
│  │  WO-4201      Unit 1 - Frame Assembly   Framing        ● In Prog   │   │
│  │  WO-4202      Unit 1 - Wall Panels      Panels         ○ Not Start │   │
│  │  WO-4203      Unit 1 - MEP Rough-in     MEP            ○ Not Start │   │
│  │  WO-4204      Unit 2 - Frame Assembly   Framing        ● In Prog   │   │
│  │  ...                                                                │   │
│  │                                                                     │   │
│  │  ▼ QUALITY INSPECTION (4 WOs)                                      │   │
│  │                                                                     │   │
│  │  WO-4251      Unit 1 - Pre-Ship QC      QC Bay         ○ Not Start │   │
│  │  WO-4252      Unit 2 - Pre-Ship QC      QC Bay         ○ Not Start │   │
│  │  ...                                                                │   │
│  │                                                                     │   │
│  │  ▼ INSTALLATION (10 WOs)                                           │   │
│  │                                                                     │   │
│  │  WO-4301      Foundation Prep           Site           ○ Not Start │   │
│  │  WO-4302      Module 1 Set              Site           ○ Not Start │   │
│  │  ...                                                                │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [View in Production Kanban →]                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Summary counts by status
- Filters by phase, status, work center
- Collapsible phase groups
- Status indicators
- Link to production kanban view
- Manual WO creation option

---

## User Flow

```
┌─────────────────────────────┐
│  Underwriting (PRD-03)      │
│  Approve & Continue         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Push to Production Modal   │
│  • Review actions           │
│  • Confirm start            │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  System Generates:          │
│  • Project schedule         │
│  • Engineering docs         │
│  • Permit docs              │
│  • RFQ templates            │
│  • Work orders              │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Project Dashboard          │
│  • Monitor overall progress │
│  • See blockers/actions     │
└──────────────┬──────────────┘
               │
       ┌───────┼───────┬───────┬───────┬───────┐
       │       │       │       │       │       │
       ▼       ▼       ▼       ▼       ▼       ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Schedule │ │Documents │ │ Permits  │ │   RFQs   │ │Work Orders│
│          │ │          │ │          │ │          │ │          │
│ • View   │ │ • Review │ │ • Track  │ │ • Send   │ │ • Track  │
│   Gantt  │ │   docs   │ │   status │ │   RFQs   │ │   status │
│ • Adjust │ │ • Download│ │ • Handle │ │ • Compare│ │ • Link to│
│   dates  │ │ • Approve│ │   revisions│ │   quotes │ │   kanban │
│          │ │          │ │          │ │ • Award  │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
               │
               ▼
       (Ongoing monitoring until project completion)
```

---

## Acceptance Criteria

### AC-1: Production Kickoff
- [ ] Push to Production creates all required records
- [ ] Project status updates to "In Production"
- [ ] Team notifications are sent
- [ ] Unique project ID is generated

### AC-2: Schedule Generation
- [ ] Schedule generates with appropriate milestones
- [ ] Dependencies are correctly set
- [ ] Gantt chart displays correctly
- [ ] Milestones can be edited and marked complete

### AC-3: Document Generation
- [ ] Engineering documents generate from design data
- [ ] Permit documents are city-submittal ready
- [ ] Documents can be previewed and downloaded
- [ ] Status tracking shows generation progress

### AC-4: Permit Workflow
- [ ] All required permits are listed
- [ ] Status updates can be logged
- [ ] Revision requests trigger alerts
- [ ] Timeline estimates are reasonable

### AC-5: RFQ Management
- [ ] RFQs auto-populate from project scope
- [ ] RFQs can be sent to multiple subs
- [ ] Quotes can be collected and compared
- [ ] Award process notifies all parties

### AC-6: Work Orders
- [ ] Work orders generate for all production phases
- [ ] WOs appear in existing production kanban
- [ ] WO status syncs back to project
- [ ] Manual WO creation is available

### AC-7: Dashboard
- [ ] All metrics display correctly
- [ ] Activity feed shows recent actions
- [ ] Blockers are prominently displayed
- [ ] Progress bars reflect actual status

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to production start | < 1 day | From approval to first WO created |
| Schedule accuracy | ±15% | Actual vs planned completion |
| Document generation time | < 4 hours | Time to generate all docs |
| RFQ response rate | > 80% | Quotes received vs RFQs sent |
| On-time permit approval | > 70% | Permits approved by estimated date |

---

## Dependencies

- **PRD-03 (Underwriting)**: Approved project data
- **Existing Work Order System**: For WO creation and tracking
- **Document Generation Service**: For engineering/permit docs
- **Email Service**: For RFQ distribution and notifications
- **Subcontractor Database**: For RFQ recipient selection

---

## Out of Scope

- Detailed construction scheduling (MS Project level)
- Daily production scheduling optimization
- Equipment/tool tracking
- Crew scheduling
- Weather delay tracking
- Material procurement/purchasing
- Invoice processing
- Change order management
- Site safety management
- Warranty tracking
- Post-construction handoff
