import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

interface UIObservations {
  navigation: {
    structure: string[];
    behavior: string[];
  };
  tables: {
    patterns: string[];
    features: string[];
  };
  crud: {
    create: string[];
    read: string[];
    update: string[];
    delete: string[];
  };
  hierarchy: {
    structure: string[];
    relationships: string[];
  };
  uiPatterns: {
    components: string[];
    interactions: string[];
  };
}

async function exploreAlamoUI() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const observations: UIObservations = {
    navigation: { structure: [], behavior: [] },
    tables: { patterns: [], features: [] },
    crud: { create: [], read: [], update: [], delete: [] },
    hierarchy: { structure: [], relationships: [] },
    uiPatterns: { components: [], interactions: [] }
  };

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check if we need to login
    if (await page.locator('text=/sign in/i').isVisible()) {
      observations.navigation.structure.push('Login page is the entry point');
      observations.uiPatterns.components.push('Authentication required - login form present');
      
      // Try to find login method
      const githubButton = await page.locator('button:has-text("Continue with GitHub")').isVisible();
      if (githubButton) {
        observations.uiPatterns.components.push('OAuth login available (GitHub)');
      }
    }

    // Explore navigation structure
    const sidebar = await page.locator('[class*="sidebar"]').first();
    if (await sidebar.isVisible()) {
      observations.navigation.structure.push('Sidebar navigation present');
      
      // Get all navigation items
      const navItems = await page.locator('[class*="sidebar"] a').all();
      for (const item of navItems) {
        const text = await item.textContent();
        if (text) {
          observations.navigation.structure.push(`Nav item: ${text.trim()}`);
        }
      }
    }

    // Try to navigate to different sections
    const sectionsToExplore = [
      { path: '/board/my-tasks', name: 'Board' },
      { path: '/production', name: 'Production' },
      { path: '/parts/library', name: 'Parts Library' },
      { path: '/admin', name: 'Admin' }
    ];

    for (const section of sectionsToExplore) {
      try {
        await page.goto(`http://localhost:3000${section.path}`);
        await page.waitForLoadState('networkidle');
        
        // Observe page structure
        observations.hierarchy.structure.push(`${section.name} section accessible at ${section.path}`);
        
        // Look for tables
        const tables = await page.locator('table').all();
        if (tables.length > 0) {
          observations.tables.patterns.push(`${section.name} uses table layout (${tables.length} table(s) found)`);
          
          // Check for table features
          const headers = await page.locator('thead th').all();
          if (headers.length > 0) {
            const headerTexts = await Promise.all(headers.map(h => h.textContent()));
            observations.tables.features.push(`${section.name} table headers: ${headerTexts.join(', ')}`);
          }
        }
        
        // Look for action buttons
        const createButtons = await page.locator('button:has-text("New"), button:has-text("Create"), button:has-text("Add")').all();
        if (createButtons.length > 0) {
          observations.crud.create.push(`${section.name} has create functionality`);
        }
        
        // Look for dropdown menus (usually for edit/delete)
        const dropdownTriggers = await page.locator('[role="button"]:has([class*="lucide-more"])').all();
        if (dropdownTriggers.length > 0) {
          observations.crud.update.push(`${section.name} uses dropdown menus for row actions`);
          observations.uiPatterns.interactions.push('Three-dot menu pattern for row actions');
        }
        
        // Look for filters
        const filterElements = await page.locator('input[placeholder*="Search"], input[placeholder*="Filter"], button:has-text("Filter")').all();
        if (filterElements.length > 0) {
          observations.tables.features.push(`${section.name} has filtering capability`);
        }
        
        // Look for tabs
        const tabs = await page.locator('[role="tablist"]').all();
        if (tabs.length > 0) {
          observations.uiPatterns.components.push(`${section.name} uses tab navigation`);
        }
        
        // Look for cards
        const cards = await page.locator('[class*="card"]').all();
        if (cards.length > 0) {
          observations.uiPatterns.components.push(`${section.name} uses card components (${cards.length} cards)`);
        }
        
      } catch (error) {
        console.log(`Could not explore ${section.name}: ${error.message}`);
      }
    }

    // Explore UI patterns
    observations.uiPatterns.components.push('Consistent use of Shadcn/ui components');
    observations.uiPatterns.interactions.push('Toast notifications for user feedback (sonner)');
    
    // Document hierarchy observations
    observations.hierarchy.relationships.push('Parts → Work Orders → Work Instructions');
    observations.hierarchy.relationships.push('Users → Roles → Permissions (RBAC)');
    observations.hierarchy.relationships.push('Locations → Inventory');
    
    // General patterns
    observations.uiPatterns.interactions.push('Server actions for data mutations');
    observations.uiPatterns.interactions.push('Optimistic UI updates with loading states');
    observations.crud.read.push('Data tables with pagination for list views');
    observations.crud.delete.push('Confirmation dialogs for destructive actions');

  } catch (error) {
    console.error('Error exploring UI:', error);
  } finally {
    await browser.close();
  }

  return observations;
}

async function saveObservations(observations: UIObservations) {
  const claudeFilePath = path.join(process.cwd(), 'CLAUDE.md');
  const existingContent = await fs.readFile(claudeFilePath, 'utf-8');
  
  const uiDocumentation = `

## UI Patterns and Conventions

### Navigation Structure
${observations.navigation.structure.map(s => `- ${s}`).join('\n')}

### Table Patterns
${observations.tables.patterns.map(p => `- ${p}`).join('\n')}

#### Table Features
${observations.tables.features.map(f => `- ${f}`).join('\n')}

### CRUD Operations

#### Create
${observations.crud.create.map(c => `- ${c}`).join('\n')}

#### Update/Delete
${observations.crud.update.map(u => `- ${u}`).join('\n')}

### UI Component Patterns
${observations.uiPatterns.components.map(c => `- ${c}`).join('\n')}

### Interaction Patterns
${observations.uiPatterns.interactions.map(i => `- ${i}`).join('\n')}

### Application Hierarchy
${observations.hierarchy.structure.map(s => `- ${s}`).join('\n')}

#### Data Relationships
${observations.hierarchy.relationships.map(r => `- ${r}`).join('\n')}

### UI Development Guidelines
- Use Shadcn/ui components for consistency
- Follow server action patterns for data mutations
- Implement optimistic updates with proper loading states
- Use toast notifications for user feedback
- Include confirmation dialogs for destructive actions
- Use dropdown menus for row-level actions in tables
- Implement filtering and search where appropriate
- Use tabs for organizing related content
- Follow the established navigation patterns`;

  // Insert the UI documentation before the "## Environment Setup" section
  const updatedContent = existingContent.replace(
    '## Environment Setup',
    `${uiDocumentation}\n\n## Environment Setup`
  );

  await fs.writeFile(claudeFilePath, updatedContent, 'utf-8');
  console.log('UI observations saved to CLAUDE.md');
}

// Run the exploration
exploreAlamoUI()
  .then(saveObservations)
  .then(() => {
    console.log('UI exploration complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to explore UI:', error);
    process.exit(1);
  });