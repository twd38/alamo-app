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

**IMPORTANT: Pre-Commit Requirements**
Before making any commits to the repository, you MUST run the following checks to ensure code quality:

1. **Lint Check** - Ensures code follows ESLint rules
   ```bash
   npm run lint
   ```

2. **TypeScript Type Check** - Validates all TypeScript types
   ```bash
   npm run typecheck
   ```

3. **Build Check** - Ensures the application builds successfully
   ```bash
   npm run build
   ```

Run these checks in order. If any check fails, fix the issues before committing.

Other available commands:

```bash
# Auto-fix linting issues
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

### MES (Manufacturing Execution System) Management

```bash
# Seed MES Phase 1 data
npm run seed:mes          # Local environment
npm run seed:mes:prod     # Production

# MES data includes:
# - Work Centers (Machining, Assembly, Inspection, Packaging)
# - Operations (Milling, Assembly, Inspection, etc.)
# - Procedures (Step-by-step work instructions)
# - Routings (Manufacturing process flows)
# - Part-Routing assignments
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
- **MES Phase 1 Features (NEW):**
  - Work Centers: Define manufacturing resources and capabilities
  - Operations: Reusable manufacturing tasks linked to work centers
  - Procedures: Detailed step-by-step instructions for operations
  - Routings: Manufacturing process flows that can be assigned to parts
  - Part-Routing Management: Assign multiple routings to parts with default selection

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

This section outlines best practices for developing Next.js applications, focusing on code organization, performance optimization, security, testing strategies, and common pitfalls to avoid.

#### Code Organization and Structure

**Directory Structure:**

- **`app/`**: (Recommended - Next.js 13+) Contains route handlers, server components, and client components.
  - `page.tsx`: Represents the UI for a route.
  - `layout.tsx`: Defines the layout for a route and its children.
  - `loading.tsx`: Displays a loading UI while a route segment is loading.
  - `error.tsx`: Handles errors within a route segment.
  - `head.tsx`: Manages the `<head>` metadata for a route.
  - `route.ts`: Defines server-side route handlers (API routes).
  - `[dynamic-segment]`: Dynamic route segments, using brackets.
  - `@folder-name`: Route Groups to organize routes without affecting URL structure.
- **`components/`**: Reusable UI components.
- **`lib/`**: Utility functions, helper functions, and third-party integrations.
- **`hooks/`**: Custom React hooks.
- **`styles/`**: Global styles and CSS modules.
- **`public/`**: Static assets (images, fonts, etc.).
- **`types/`**: TypeScript type definitions and interfaces.
- **`utils/`**: Contains utilities and helper functions, along with any API-related logic.

**Recommendation:** Prefer the `app/` directory structure for new projects as it aligns with the latest Next.js features and best practices.

**File Naming Conventions:**

- **Components:** `ComponentName.jsx` or `ComponentName.tsx`
- **Pages:** `page.js`, `page.jsx`, `page.ts`, `page.tsx` (within the `app` or `pages` directory)
- **Layouts:** `layout.js`, `layout.jsx`, `layout.ts`, `layout.tsx` (within the `app` directory)
- **API Routes:** `route.js`, `route.ts` (within the `app/api` directory or `pages/api` directory)
- **Hooks:** `useHookName.js` or `useHookName.ts`
- **Styles:** `ComponentName.module.css` or `ComponentName.module.scss`
- **Types:** `types.ts` or `interfaces.ts`

**Module Organization:**

- **Co-location:** Keep related components, styles, and tests in the same directory.
- **Feature-based modules:** Group files by feature rather than type (e.g., `components/user-profile/`, not `components/button`, `components/form`).
- **Avoid deeply nested directories:** Keep the directory structure relatively flat to improve navigation.

**Component Architecture:**

- **Presentational vs. Container Components:** Separate components that handle data fetching and state management (container components) from those that only render UI (presentational components).
- **Atomic Design:** Organize components into atoms, molecules, organisms, templates, and pages for better reusability and maintainability.
- **Composition over inheritance:** Favor composition to create flexible and reusable components.
- **Server Components (app directory):** Use server components by default for improved performance. Only use client components when interactivity (event handlers, useState, useEffect) is required.

**Code Splitting:**

- **Dynamic imports:** Use `next/dynamic` to load components only when they are needed, improving initial load time. Example: `dynamic(() => import('../components/MyComponent'))`.
- **Route-level code splitting:** Next.js automatically splits code based on routes, so each page only loads the necessary JavaScript.
- **Granular code splitting:** Break down large components into smaller chunks that can be loaded independently.

#### Common Patterns and Anti-patterns

**Design Patterns:**

- **Higher-Order Components (HOCs):** Reusable component logic.
- **Render Props:** Sharing code between React components using a prop whose value is a function.
- **Hooks:** Extracting stateful logic into reusable functions.
- **Context API:** Managing global state.
- **Compound Components:** Combining multiple components that work together implicitly.

**Recommended Approaches:**

- **Data fetching:** Use `getServerSideProps` or `getStaticProps` or server components for fetching data on the server-side. Use `SWR` or `React Query` for client-side data fetching and caching.
- **Styling:** Use CSS Modules, Styled Components, or Tailwind CSS for component-level styling. Prefer Tailwind CSS for rapid development.
- **State Management:** Use React Context, Zustand, Jotai, or Recoil for managing global state. Redux is an option, but often overkill for smaller Next.js projects.
- **Form Handling:** Use `react-hook-form` for managing forms and validation.
- **API Routes:** Use Next.js API routes for serverless functions.

**Anti-patterns and Code Smells:**

- **Over-fetching data:** Only fetch the data that is needed by the component.
- **Blocking the main thread:** Avoid long-running synchronous operations in the main thread.
- **Mutating state directly:** Always use `setState` or hooks to update state.
- **Not memoizing components:** Use `React.memo` to prevent unnecessary re-renders.
- **Using `useEffect` without a dependency array:** Ensure the dependency array is complete to prevent unexpected behavior.
- **Writing server side code in client components:** Can expose secrets or cause unexpected behavior.

**Error Handling:**

- **`try...catch`:** Use `try...catch` blocks for handling errors in asynchronous operations.
- **Error Boundary Components:** Create reusable error boundary components to catch errors in child components.
- **Centralized error logging:** Log errors to a central service like Sentry or Bugsnag.
- **Custom Error Pages:** Use `_error.js` or `_error.tsx` to create custom error pages.
- **Route-level error handling (app directory):** Use `error.tsx` within route segments to handle errors specific to that route.

#### Performance Considerations

**Optimization Techniques:**

- **Image optimization:** Use `next/image` component for automatic image optimization, including lazy loading and responsive images.
- **Font optimization:** Use `next/font` to optimize font loading and prevent layout shift.
- **Code splitting:** Use dynamic imports and route-level code splitting to reduce initial load time.
- **Caching:** Use caching strategies (e.g., `Cache-Control` headers, `SWR`, `React Query`) to reduce data fetching overhead.
- **Memoization:** Use `React.memo` to prevent unnecessary re-renders of components.
- **Prefetching:** Use the `<Link prefetch>` tag to prefetch pages that are likely to be visited.
- **SSR/SSG:** Use Static Site Generation (SSG) for content that doesn't change often and Server-Side Rendering (SSR) for dynamic content.
- **Incremental Static Regeneration (ISR):** Use ISR to update statically generated pages on a regular interval.

**Memory Management:**

- **Avoid memory leaks:** Clean up event listeners and timers in `useEffect` hooks.
- **Minimize re-renders:** Only update state when necessary to reduce the number of re-renders.
- **Use immutable data structures:** Avoid mutating data directly to prevent unexpected side effects.

**Bundle Size Optimization:**

- **Analyze bundle size:** Use tools like `webpack-bundle-analyzer` to identify large dependencies.
- **Remove unused code:** Use tree shaking to remove unused code from your bundles.
- **Use smaller dependencies:** Replace large dependencies with smaller, more lightweight alternatives.
- **Compression:** Enable Gzip or Brotli compression on your server to reduce the size of the transferred files.

#### Security Best Practices

**Common Vulnerabilities:**

- **Cross-Site Scripting (XSS):** Sanitize user input to prevent XSS attacks. Be especially careful when rendering HTML directly from user input.
- **Cross-Site Request Forgery (CSRF):** Use CSRF tokens to protect against CSRF attacks.
- **SQL Injection:** Use parameterized queries or an ORM to prevent SQL injection attacks.
- **Authentication and Authorization vulnerabilities:** Implement secure authentication and authorization mechanisms. Avoid storing secrets in client-side code.
- **Exposing sensitive data:** Protect API keys and other sensitive data by storing them in environment variables and accessing them on the server-side.

**Input Validation:**

- **Server-side validation:** Always validate user input on the server-side.
- **Client-side validation:** Use client-side validation for immediate feedback, but don't rely on it for security.
- **Sanitize input:** Sanitize user input to remove potentially malicious code.
- **Use a validation library:** Use a library like `zod` or `yup` for validating user input.

**Authentication and Authorization:**

- **Use a secure authentication provider:** Use a service like Auth0, NextAuth.js, or Firebase Authentication for secure authentication.
- **Store tokens securely:** Store tokens in HTTP-only cookies or local storage.
- **Implement role-based access control:** Use role-based access control to restrict access to sensitive resources.
- **Protect API endpoints:** Use authentication middleware to protect API endpoints.

#### Testing Approaches

**Unit Testing:**

- **Test individual components:** Write unit tests for individual components to ensure they are working correctly.
- **Use a testing framework:** Use a testing framework like Jest or Mocha.
- **Mock dependencies:** Mock external dependencies to isolate components during testing.
- **Use React Testing Library:** Prefer React Testing Library for component testing as it encourages testing from a user perspective.

**Integration Testing:**

- **Test interactions between components:** Write integration tests to ensure that components are working together correctly.
- **Test API calls:** Test API calls to ensure that data is being fetched and saved correctly.
- **Use `msw` (Mock Service Worker):** Use libraries like `msw` to intercept and mock API calls.

**End-to-End Testing:**

- **Test the entire application:** Write end-to-end tests to ensure that the entire application is working correctly.
- **Use a testing framework:** Use a testing framework like Cypress or Playwright.
- **Test user flows:** Test common user flows to ensure that the application is providing a good user experience.

#### Common Pitfalls and Gotchas

**Frequent Mistakes:**

- **Not understanding server-side rendering:** Failing to utilize SSR effectively can impact SEO and initial load performance.
- **Over-complicating state management:** Using Redux for simple state management needs can add unnecessary complexity.
- **Not optimizing images:** Not using `next/image` can result in large image sizes and slow loading times.
- **Ignoring security best practices:** Neglecting security can lead to vulnerabilities.
- **Accidentally exposing API keys or secrets in client-side code.**

**Edge Cases:**

- **Handling errors gracefully:** Implement proper error handling to prevent the application from crashing.
- **Dealing with different screen sizes:** Ensure the application is responsive and works well on different screen sizes.
- **Supporting different browsers:** Test the application in different browsers to ensure compatibility.

### Prisma Best Practices

This section enforces Prisma best practices for schema design, data access, and application security.

#### General Principles

- **Never expose the raw Prisma client directly in APIs.** Instead, create abstraction layers (e.g., repositories or services) to handle data access logic. This protects you from accidentally exposing sensitive database details and allows you to easily change your data access implementation in the future.
- **Always use input validation** before performing any database operations. Use a validation library like Zod or Yup to ensure that user input conforms to your expected schema and data types.
- **Implement row-level security (RLS) where applicable.** If your application handles sensitive data, use Prisma policies or database-level RLS to restrict data access based on user roles or permissions.
- **Sanitize and validate all user inputs** to prevent injection attacks, such as SQL injection.
- **Naming Conentions:** variable names should describe what they are in the object that they are located in. camelCase for variable names, PascalCase for Models.

#### Code Organization and Structure

**Directory Structure:**

- `prisma/`: Contains the `schema.prisma` file and any seed scripts or migrations.
- `src/lib/prisma.ts`: A single module that exports an instance of the Prisma client. This promotes reuse and simplifies dependency injection.
- `src/models/`: Database model definitions as classes, abstracting Prisma calls.
- `src/repositories/`: Contains data access logic, abstracting Prisma queries.
- `src/services/`: Contains business logic, orchestrating data access through repositories.

**File Naming Conventions:**

- Use descriptive names for files and directories that reflect their purpose.
- Use consistent naming conventions (e.g., camelCase for variables, PascalCase for components).

**Module Organization:**

- Organize code into logical modules with clear responsibilities.
- Use dependency injection to decouple modules and improve testability.

#### Common Patterns and Anti-patterns

**Design Patterns:**

- **Repository Pattern:** Abstract data access logic behind repositories.
- **Service Layer Pattern:** Encapsulate business logic in service classes.
- **Unit of Work Pattern:** Manage transactions across multiple repositories.

**Recommended Approaches:**

- Use Prisma's relation features to model complex relationships between entities.
- Use Prisma's transaction features to ensure data consistency.
- Use Prisma's filtering and sorting options to optimize queries.

**Anti-patterns:**

- **Exposing the Prisma client directly to the client-side.** This is a major security risk.
- **Writing complex queries directly in components.** Move query logic to repositories or services.
- **Ignoring error handling.** Always handle potential errors when interacting with the database.

**Error Handling:**

- Use try-catch blocks to handle potential errors when interacting with the database.
- Log errors to a centralized logging system for monitoring and debugging.
- Return meaningful error messages to the client-side.

#### Performance Considerations

**Optimization Techniques:**

- Use Prisma's connection pooling to reduce database connection overhead.
- Use Prisma's batching features to reduce the number of database roundtrips.
- Optimize database queries by using indexes and filtering data on the server-side.

**Memory Management:**

- Avoid loading large amounts of data into memory at once. Use pagination or streaming to process data in smaller chunks.
- Clean up resources after use, such as database connections and file handles.

**Query Optimization:**

- **Select only the necessary fields** to reduce the amount of data transferred from the database.
- **Use `include` and `select` carefully** to optimize the query shape.
- **Avoid N+1 queries** by using Prisma's `include` or `join` features.
- **Use pagination** to limit the number of results returned by a query.
- **Use `take` and `skip`** for efficient pagination.

#### Security Best Practices

**Common Vulnerabilities:**

- SQL injection: Prevented by using Prisma's prepared statements and escaping user input.
- Cross-site scripting (XSS): Prevented by sanitizing user input and output.
- Cross-site request forgery (CSRF): Prevented by using CSRF tokens.

**Input Validation:**

- Use a validation library to validate all user input.
- Validate data types, lengths, and formats.

**Authentication and Authorization:**

- Use a secure authentication library like NextAuth.js or Clerk.
- Implement role-based access control (RBAC) to restrict access to sensitive data and functionality.

#### Schema Design

**Schema Best Practices:**

- Use clear and concise names for models and fields.
- Define relationships between models using Prisma's relation features.
- Use indexes to optimize query performance.
- Consider using enums for fields with a limited set of values.
- Properly use `@id`, `@unique`, and `@relation` directives for optimal schema design.

**Data Types:**

- Use the appropriate data types for each field.
- Use `DateTime` for storing timestamps.
- Use `Json` for storing complex data structures.

#### Transaction Management

- **Use Prisma's `prisma.$transaction` method** to ensure atomicity of database operations.
- **Handle potential errors** within the transaction to prevent data inconsistency.
- **Keep transactions short** to minimize the impact on database performance.

#### Migration Management

- **Use Prisma Migrate** to manage database schema changes.
- **Create migrations** for each schema change.
- **Apply migrations** to the database using `prisma migrate deploy`.
- **Use shadow database** to test migrations before deploying them to production.

### React Query (TanStack Query) Best Practices

This section outlines best practices for using React Query in React applications, covering code organization, performance considerations, security, and testing.

#### Code Organization and Structure

**Directory Structure Best Practices:**

- **Feature-based Organization:** Group react-query hooks and related components within feature-specific directories. This improves modularity and maintainability.

```
src/
├── features/
│ ├── users/
│ │ ├── components/
│ │ │ ├── UserList.tsx
│ │ │ └── UserDetails.tsx
│ │ ├── hooks/
│ │ │ ├── useUsersQuery.ts
│ │ │ └── useCreateUserMutation.ts
│ │ ├── api/
│ │ │ └── usersApi.ts
│ │ └── types/
│ │ └── user.ts
│ ├── products/
│ └── ...
├── ...
```

- **Dedicated API Service Layer:** Abstract API interaction logic into separate modules. This allows for easier testing and decoupling of components from specific API implementations.

**File Naming Conventions:**

- **Consistent Naming:** Follow a consistent naming convention for react-query hooks. Prefix hooks with `use` and postfix with `Query` or `Mutation` to clearly indicate their purpose (e.g., `usePostsQuery`, `useUpdatePostMutation`).
- **Descriptive Names:** Use descriptive names for files and variables to improve code readability.

**Module Organization:**

- **Custom Hooks for Reusability:** Encapsulate react-query logic within custom hooks to promote reusability and separation of concerns.

```typescript
// src/features/users/hooks/useUsersQuery.ts
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../api/usersApi';

export const useUsersQuery = () => {
  return useQuery('users', fetchUsers);
};
```

- **Separate Query and Mutation Files:** Organize queries and mutations into separate files or modules.

#### Common Patterns and Anti-patterns

**Design Patterns:**

- **Custom Hooks for Data Fetching:** Encapsulating react-query logic within custom hooks promotes reusability and separation of concerns.
- **Optimistic Updates:** Implement optimistic updates to improve perceived performance using `onMutate`.
- **Pessimistic Updates:** Update the UI only after a successful response from the API.

**Recommended Approaches:**

- **Prefetching Data:** Prefetch data for routes or components that the user is likely to visit next using `queryClient.prefetchQuery`.
- **Pagination and Infinite Scrolling:** Use hooks like `useInfiniteQuery` to handle large datasets efficiently.
- **Dependent Queries:** Use the `enabled` option in `useQuery` to conditionally execute queries.

```typescript
const { data: user } = useQuery(['user', userId], () => fetchUser(userId));

const { data: posts } = useQuery(
  ['posts', user?.id],
  () => fetchPosts(user.id),
  {
    enabled: !!user
  }
);
```

**Anti-patterns:**

- **Directly Calling API in Components:** Avoid making API calls directly within components.
- **Ignoring Error Handling:** Always handle errors properly and provide user-friendly error messages.
- **Over-fetching Data:** Fetch only the data that is required by the component.
- **Deeply Nested Queries:** Avoid deeply nesting queries as this can lead to performance issues.

**State Management:**

- **Local vs. Global State:** Use local state for component-specific data and global state for shared data.
- **react-query as a State Manager:** Leverage react-query's built-in caching and state management capabilities.

**Error Handling:**

- **Centralized Error Handling:** Implement centralized error handling for consistent error messages.
- **Retry Logic:** Use react-query's retry configuration options.
- **Error Boundaries:** Use Error Boundaries to catch rendering errors.

#### Performance Considerations

**Optimization Techniques:**

- **Query Invalidation:** Invalidate queries when data changes to ensure UI is up-to-date.
- **Stale-While-Revalidate:** Use `staleTime` and `cacheTime` options to configure data freshness.
- **Window Focus Refetching:** Configure refetching on window focus to keep data fresh.
- **Polling/Refetch Intervals:** Use `refetchInterval` for data that changes frequently.

**Memory Management:**

- **Query Cache Management:** Configure the `cacheTime` option to control how long data is stored.
- **Garbage Collection:** Use the `gcTime` option to configure inactive query cleanup.

**Rendering Optimization:**

- **Memoization:** Use `React.memo` to prevent unnecessary re-renders.
- **Virtualization:** Use virtualization techniques for large lists of data.

#### Security Best Practices

**Common Vulnerabilities:**

- **Cross-Site Scripting (XSS):** Sanitize user input using libraries like DOMPurify.
- **Cross-Site Request Forgery (CSRF):** Implement CSRF protection.
- **Injection Attacks:** Validate user input and use parameterized queries.

**Authentication and Authorization:**

- **JSON Web Tokens (JWT):** Use JWTs for authentication with secure storage.
- **Role-Based Access Control (RBAC):** Implement RBAC using middleware or custom hooks.

**Secure API Communication:**

- **HTTPS:** Use HTTPS for all API communication.
- **API Rate Limiting:** Implement rate limiting to prevent abuse.
- **CORS:** Configure CORS properly to prevent unauthorized cross-origin requests.

#### Testing Approaches

**Unit Testing:**

- **Test Custom Hooks:** Unit test custom react-query hooks using libraries like `msw`.
- **Test Components in Isolation:** Use `react-testing-library` for component testing.

**Integration Testing:**

- **Test Data Flow:** Verify data fetching and display workflows.
- **Test Error Handling:** Test error scenarios and recovery.

**End-to-End Testing:**

- **Simulate User Interactions:** Use Cypress or Playwright for end-to-end testing.
- **Test Critical Paths:** Focus on critical user flows like login and checkout.

### Shadcn UI Best Practices

This section provides comprehensive best practices for developing with Shadcn UI, covering code organization, performance, security, and testing.

#### Code Organization and Structure

**Directory Structure:**

- Organize components into logical directories based on functionality or domain.
- Separate components into their own files named after the component (e.g., `Button.tsx`).
- Consider using an `index.ts` file within each directory to export all components.
- Structure directories to reflect the UI hierarchy (e.g., `/components/layout`, `/components/ui`).

**File Naming Conventions:**

- Use PascalCase for component file names (e.g., `MyComponent.tsx`).
- Use camelCase for variable and function names (e.g., `handleClick`).
- Use descriptive names that clearly indicate the purpose of the component or function.

**Module Organization:**

- Break down complex components into smaller, reusable modules.
- Keep components focused on a single responsibility.
- Utilize shared utility functions and constants to avoid code duplication.
- Create a `utils` directory for helper functions.

**Component Architecture:**

- Favor composition over inheritance for flexible components.
- Design components with clear separation of concerns: presentational components (UI) and container components (logic).
- Use functional components with hooks for managing state and side effects.

#### Common Patterns and Anti-patterns

**Design Patterns:**

- Leverage existing Shadcn UI components whenever possible.
- Customize components using Tailwind CSS utility classes or CSS variables.
- Create compound components by combining existing Shadcn UI components.

**Recommended Approaches:**

- Use Shadcn UI's form components (e.g., `Input`, `Select`) for handling user input.
- Implement accessible components following ARIA guidelines and using appropriate HTML semantics.
- Use the `cn` utility (classnames library) provided by Shadcn UI to manage CSS class names effectively.

**Anti-patterns:**

- **Directly modifying Shadcn UI component code.**
- **Overusing custom CSS,** as Shadcn UI is built with Tailwind CSS.
- **Neglecting accessibility considerations.**
- **Creating overly complex components with too many responsibilities.**

**State Management:**

- Use React's built-in `useState` hook for simple component-level state.
- Consider using state management libraries like Zustand, Redux, or Recoil for complex application state.
- Avoid mutating state directly; always use setState function or state management library's update methods.

**Error Handling:**

- Implement error boundaries to catch errors in components and prevent application crashes.
- Use try-catch blocks for asynchronous operations and API calls.
- Provide informative error messages to users.
- Log errors to a monitoring service for debugging and analysis.

#### Performance Considerations

**Optimization Techniques:**

- Minimize re-renders by using `React.memo` for functional components.
- Optimize event handlers by using useCallback to prevent unnecessary re-creation of functions.
- Debounce or throttle expensive operations to reduce execution frequency.

**Memory Management:**

- Avoid memory leaks by properly cleaning up event listeners and timers in `useEffect` hooks.
- Release unused resources when they are no longer needed.

**Rendering Optimization:**

- Use virtualized lists or grids for rendering large datasets.
- Batch DOM updates to minimize reflows and repaints.
- Use CSS containment to isolate rendering changes to specific DOM parts.

**Bundle Size Optimization:**

- Remove unused code and dependencies using tree shaking.
- Minify JavaScript and CSS files to reduce their size.
- Compress images using optimization tools.

#### Security Best Practices

**Common Vulnerabilities:**

- Prevent cross-site scripting (XSS) attacks by sanitizing user input and escaping HTML entities.
- Protect against cross-site request forgery (CSRF) attacks using anti-CSRF tokens.
- Avoid storing sensitive information in client-side code.

**Input Validation:**

- Validate user input on both client-side and server-side.
- Use validation libraries like Zod or Yup to define data schemas.
- Sanitize user input to remove potentially harmful characters.

**Authentication and Authorization:**

- Use secure authentication protocols like OAuth 2.0 or OpenID Connect.
- Implement role-based access control (RBAC) to restrict access to sensitive resources.
- Store user credentials securely using hashing and salting.

#### Testing Approaches

**Unit Testing:**

- Write unit tests for individual components and functions.
- Use testing frameworks like Jest or Mocha.
- Test component behavior with different props and inputs.

**Integration Testing:**

- Write integration tests to verify components work together correctly.
- Test interaction between components and APIs.

**End-to-End Testing:**

- Write end-to-end tests to simulate user interactions.
- Use testing frameworks like Cypress or Playwright.

### Zod Best Practices

This section provides comprehensive guidelines for using the Zod library effectively, covering code organization, performance, security, and testing.

#### General Principles

- **Organize Zod schemas logically** for readability and maintainability. Group related schemas together and structure your Zod code for improved clarity.
- **Compose and reuse related schemas** to avoid repetition using Zod's composition features (e.g., `z.intersection`, `z.union`, `z.extend`).
- **Implement schema versioning** for better management as your application evolves.
- **Use Zod for type-safe data validation and transformation** to ensure data integrity throughout your application.

#### Code Organization and Structure

**Directory Structure:**

- Consider grouping Zod schemas within dedicated directories (e.g., `schemas/`, `models/schemas/`).
- Organize schemas by domain, feature, or data model.
- Use subdirectories for complex schemas or schema families.

**File Naming Conventions:**

- Name schema files descriptively (e.g., `user.schema.ts`, `product.schema.ts`).
- Use a consistent naming pattern throughout the project.
- Include the data model name or schema's purpose in the filename.

**Module Organization:**

- Export schemas as named exports from each module.
- Create index files (e.g., `index.ts`) to re-export schemas from subdirectories.
- Use clear and concise module names.

**Component Architecture:**

- Create a `components/schemas/` directory for component-specific schemas.
- Use Zod to validate props passed to React components using `z.infer` and `z.ZodType<Props>`.
- Create custom hooks that handle validation with Zod and store parsed results in React state.

#### Common Patterns and Anti-patterns

**Design Patterns:**

- **Schema Composition:** Use `z.intersection`, `z.union`, `z.extend`, and `z.optional` to combine and modify existing schemas.
- **Schema Transformation:** Use `.transform` to modify data during validation.
- **Custom Validation:** Use `.refine` and `.superRefine` for custom validation logic.
- **Default Values:** Use `.default` to assign default values to schema properties.

**Recommended Approaches:**

- **Form Validation:** Use Zod to validate form input data and display errors.
- **API Request Validation:** Use Zod to validate incoming API request bodies.
- **Data Serialization/Deserialization:** Use Zod to validate and transform data when serializing or deserializing.

**Anti-patterns:**

- **Overly Complex Schemas:** Avoid creating schemas that are too complex. Break them down into smaller, manageable schemas.
- **Ignoring Validation Errors:** Always handle validation errors and provide informative feedback.
- **Duplicated Schema Definitions:** Avoid duplicating schema definitions. Use schema composition to reuse existing schemas.

**Error Handling:**

- Use Zod's `.safeParse` method to handle validation errors gracefully.
- Provide informative error messages to users.
- Log validation errors for debugging purposes.

#### Performance Considerations

**Optimization Techniques:**

- **Schema Caching:** Cache frequently used schemas to avoid re-parsing them.
- **Pre-compilation:** Pre-compile schemas during build time to improve performance when possible.
- **Minimize Schema Complexity:** Keep schemas as simple as possible to reduce validation overhead.

**Memory Management:**

- Be mindful of memory usage with large schemas, especially when dealing with large datasets.
- Release unused schemas when they are no longer needed.

**Bundle Size Optimization:**

- Remove unused schemas and code from the bundle.
- Use tree shaking to eliminate dead code.

#### Security Best Practices

**Common Vulnerabilities:**

- **Injection Attacks:** Prevent injection attacks by validating and sanitizing user input data.
- **Cross-Site Scripting (XSS):** Prevent XSS attacks by encoding user input data before displaying it.
- **Denial of Service (DoS):** Prevent DoS attacks by limiting the size and complexity of input data.

**Input Validation:**

- Validate all user input data using Zod schemas.
- Enforce strict validation rules to prevent invalid or malicious data from entering the system.

**Authentication and Authorization:**

- Use Zod to validate user credentials during authentication.
- Use Zod to validate authorization tokens and permissions.

#### Testing Approaches

**Unit Testing:**

- Write unit tests for individual schemas to ensure they validate data correctly.
- Test different input scenarios, including valid and invalid data.
- Use mocking and stubbing to isolate schemas from external dependencies.

**Integration Testing:**

- Write integration tests to ensure schemas work correctly with other application parts.
- Test interaction between schemas and data sources (databases, APIs).

**End-to-End Testing:**

- Write end-to-end tests to ensure the entire application works correctly with Zod schemas.
- Test the user interface and data flow through the application.

#### Common Pitfalls and Gotchas

**Frequent Mistakes:**

- **Incorrect Schema Definitions:** Ensure schema definitions accurately reflect the expected data format.
- **Ignoring Validation Errors:** Always handle validation errors and provide informative feedback.
- **Overly Complex Schemas:** Avoid creating schemas that are too complex or difficult to understand.

**Edge Cases:**

- **Null and Undefined Values:** Handle null and undefined values correctly in schemas.
- **Empty Strings and Arrays:** Handle empty strings and arrays appropriately.
- **Date and Time Formats:** Use consistent date and time formats throughout the application.

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
    - Work Centers - `/production/work-centers`
    - Operations - `/production/operations`
    - Procedures - `/production/procedures`
    - Routings - `/production/routings`
  - Parts (with submenu) - `/parts/library`
    - Part Details Tabs: Details, Model, Instructions, Inventory, **Routings** (NEW)
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
  - Opens Sheet dialog from right or a centered Dialog
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
- **Datatable**: Full featured datatable with server-side filtering and sorting

### Responsive Behavior

- **Sidebar**: Collapsible on desktop, sheet overlay on mobile.
- **Tables**: Horizontal scroll on mobile
- **Forms**: Full-width on mobile, constrained width on desktop
- **Grid Layouts**: Responsive grid columns based on screen size
