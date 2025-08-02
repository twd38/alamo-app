# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alamo is the operating system for the American Housing Corporation - a manufacturing execution system (MES) built with Next.js 15, TypeScript, and Prisma.

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Run development server with Turbopack
pnpm dev

# Run development server (alternative)
npm run dev
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Deploy migrations to production
npm run migrate:prod

# Check database connection
npm run db:check

# Seed RBAC data
npm run seed:rbac          # Local environment
npm run seed:rbac:prod     # Production
npm run seed:rbac:staging  # Staging

# Initialize admin user
npm run init:admin         # Local environment
npm run init:admin:prod    # Production
npm run init:admin:staging # Staging
```

### Code Quality
```bash
# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
npm run lint:strict

# Formatting
npm run format
npm run format:check

# Run all checks (format, lint, build)
npm run check
```

### Build & Deployment
```bash
# Build application
npm run build

# Start production server
npm run start

# Deploy with service worker update
npm run deploy:update
```

## High-Level Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (via Neon serverless)
- **Authentication**: NextAuth.js v5 with Google OAuth
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: Jotai, React Query (TanStack Query), SWR
- **Real-time**: WebSocket support via ws library

### Key Architectural Patterns

#### Authentication & Authorization
- NextAuth.js handles authentication with Google OAuth provider
- Database sessions stored in PostgreSQL
- RBAC (Role-Based Access Control) system with Users, Roles, and Permissions models
- Middleware protects routes except public APIs and auth pages

#### Database Architecture
- Prisma ORM with PostgreSQL
- Uses Neon serverless adapter for edge compatibility
- Complex relationships between manufacturing entities:
  - Parts, BOMs (Bill of Materials), Work Orders
  - Work Instructions with multi-step procedures
  - Inventory tracking with locations
  - Time tracking for work orders

#### API Structure
- RESTful API routes in `src/app/api/`
- Server actions for form submissions and mutations
- File uploads handled via Cloudflare R2 object storage
- Cloudflare Images integration for image optimization

#### UI Architecture
- Component-based architecture with compound components pattern
- Shared UI components in `src/components/ui/`
- Complex components like Board (Kanban), DataTable, and rich text editors
- Responsive design with mobile-first approach

#### Manufacturing Features
- Work Order management with status tracking
- Parts library with 3D model support (via Autodesk Platform Services)
- Work instructions with step-by-step procedures
- Inventory management with QR code scanning
- Time tracking and labor management
- Quality control with inspection records

### Key Directories
- `src/app/` - Next.js app router pages and API routes
- `src/components/` - React components (UI primitives and features)
- `src/lib/` - Utility functions, database client, auth configuration
- `src/hooks/` - Custom React hooks
- `src/styles/` - Global styles and Tailwind configuration
- `prisma/` - Database schema and migrations
- `scripts/` - Utility scripts for seeding and administration

### Environment Configuration
The application requires various environment variables for:
- Database connection (`DATABASE_URL`)
- Authentication (`AUTH_*` variables)
- Cloudflare R2 storage (`R2_*` variables)
- Cloudflare Images (`CLOUDFLARE_*` variables)
- Autodesk Platform Services (`APS_*` variables)
- Slack notifications (`SLACK_BOT_TOKEN`)
- Application URLs and secrets

### PWA Support
The application includes Progressive Web App features:
- Service worker for offline support
- Web manifest for installability
- Automatic update notifications

## Development Best Practices

### Next.js Best Practices
- **App Directory Structure**: Use server components by default for improved performance. Only use client components when interactivity is required
- **Data Fetching**: Use server components for data fetching, SWR or React Query for client-side caching
- **Image Optimization**: Always use `next/image` for automatic optimization and lazy loading
- **Font Optimization**: Use `next/font` to prevent layout shift
- **Error Handling**: Use `error.tsx` within route segments for route-level error handling
- **Code Splitting**: Use dynamic imports (`next/dynamic`) for components not needed on initial load

### Prisma Best Practices
- **Use Generated Types**: Always use Prisma-generated types (e.g., `User`, `Prisma.UserCreateInput`) throughout the application instead of creating duplicate type definitions
- **Type Imports**: Import types from `@prisma/client` for type safety across the entire codebase
- **Never expose raw Prisma client**: Create abstraction layers (repositories/services) for data access
- **Input Validation**: Always validate inputs before database operations using Zod
- **Query Optimization**: Use `select` and `include` carefully to avoid overfetching
- **Avoid N+1 Queries**: Use Prisma's relation features appropriately
- **Transaction Management**: Use `prisma.$transaction` for atomic operations
- **Migration Management**: Use Prisma Migrate with shadow database for testing

### React Query (TanStack Query) Best Practices
- **Custom Hooks**: Encapsulate query logic in custom hooks (e.g., `useUsersQuery`, `useUpdateUserMutation`)
- **Query Keys**: Use consistent, descriptive query keys for cache management
- **Optimistic Updates**: Implement optimistic updates for better UX using `onMutate`
- **Error Handling**: Always handle errors and provide user feedback
- **Prefetching**: Use `queryClient.prefetchQuery` for anticipated navigation
- **Cache Configuration**: Configure `staleTime` and `cacheTime` appropriately

### Shadcn UI Best Practices
- **Component Customization**: Use Tailwind utilities and the `cn` utility for styling
- **Accessibility**: Follow ARIA guidelines and use semantic HTML
- **Composition**: Build complex UIs by composing Shadcn primitives
- **Avoid Direct Modification**: Never modify Shadcn component source directly

### Zod Best Practices
- **Schema Organization**: Group related schemas in dedicated directories
- **Schema Composition**: Use `z.extend`, `z.intersection`, `z.union` for reusability
- **Form Validation**: Use Zod with react-hook-form for type-safe forms
- **API Validation**: Validate all API inputs and outputs
- **Error Handling**: Use `.safeParse()` for graceful error handling

### Security Best Practices
- **Input Sanitization**: Always validate and sanitize user inputs
- **Authentication**: Use NextAuth.js with secure session management
- **API Security**: Implement rate limiting and proper CORS configuration
- **Secret Management**: Never commit secrets; use environment variables
- **HTTPS**: Always use HTTPS in production

### Performance Guidelines
- **Memoization**: Use `React.memo` and `useMemo` to prevent unnecessary renders
- **Virtual Lists**: Use virtualization for large data sets
- **Bundle Optimization**: Monitor bundle size and remove unused dependencies
- **Lazy Loading**: Implement lazy loading for images and non-critical components
- **Database Queries**: Optimize queries with proper indexing and pagination

### Testing Strategy
- **Unit Tests**: Test individual components and utilities in isolation
- **Integration Tests**: Test data flow and component interactions
- **E2E Tests**: Use Cypress or Playwright for critical user flows
- **Test Organization**: Colocate tests with components
- **Mocking**: Use MSW for API mocking in tests

## UI/UX Patterns

### Layout Structure
- **Authentication**: Google OAuth login page with centered card layout
- **Main Layout**: Collapsible sidebar navigation with main content area
- **Responsive Design**: Mobile-first with Sheet components for mobile navigation
- **Page Structure**: Consistent use of BasicTopBar + PageContainer wrapper

### Navigation Hierarchy
- **Primary Navigation** (Sidebar):
  - Board (Kanban view) - `/board/my-tasks`
  - Production (Work Orders) - `/production`
  - Parts (with submenu) - `/parts/library`
  - Site Explorer - `/explorer`
- **User Menu**: Bottom of sidebar with user avatar and settings
- **Breadcrumbs**: Used in detail pages for navigation context

### Visual Design Patterns
- **Cards**: Primary container for content sections (Card, CardHeader, CardContent)
- **Shadows**: Subtle shadows on cards (`shadow-sm`)
- **Spacing**: Consistent padding using Tailwind classes (p-4, p-6)
- **Colors**: Zinc color palette for backgrounds (zinc-50, zinc-900 for dark mode)
- **Icons**: Lucide React icons throughout the interface

### List/Table Patterns
- **Data Tables**: 
  - Built with TanStack Table
  - Features: sorting, filtering, pagination, column visibility toggle
  - Row selection with checkboxes
  - Action menus via dropdown (ellipsis icon)
  - Clickable rows for navigation to details
- **Search**: Debounced search input above tables
- **Status Tabs**: Tab navigation for filtering by status (e.g., TODO, IN_PROGRESS)
- **Loading States**: Skeleton components while data loads
- **Empty States**: Clear messaging when no data exists

### Form Patterns
- **Dialog Types**: Sheet components (slide-out panels) for forms
- **Form Layout**: 
  - Clear section headers
  - Vertical field layout
  - Required field indicators
  - Helper text below fields
- **Form Libraries**: React Hook Form + Zod validation
- **Field Types**: Consistent use of shadcn form components
- **File Uploads**: Drag-and-drop with preview capabilities

### CRUD Operations
- **Create**: 
  - "Create [Entity]" button with Plus icon
  - Opens Sheet dialog from right
  - Form validation before submission
  - Toast notifications on success/error
- **Read**: 
  - List views with data tables
  - Detail pages with tabbed sections
  - Linked navigation from tables
- **Update**: 
  - Edit forms in Sheet dialogs
  - Inline editing for some fields
  - Optimistic updates with error handling
- **Delete**: 
  - Dropdown menu option
  - Confirmation dialog (AlertDialog)
  - Optional typed confirmation for critical deletes
  - Loading state during deletion

### Common UI Components
- **Buttons**: Consistent variants (default, outline, destructive)
- **Dropdowns**: Used for actions and filters
- **Tabs**: For content organization and status filtering
- **Tooltips**: For additional context on hover
- **Avatars**: User avatars with fallback initials
- **Badges**: For status indicators
- **Progress**: Loading states and progress indicators

### Responsive Behavior
- **Sidebar**: Collapsible on desktop, sheet overlay on mobile
- **Tables**: Horizontal scroll on mobile
- **Forms**: Full-width on mobile, constrained width on desktop
- **Grid Layouts**: Responsive grid columns based on screen size