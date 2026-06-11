# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Installation and Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

### Testing
This project does not have a dedicated test framework configured in package.json. Testing is primarily done manually through browser interaction.

### Environment Variables
No environment variables are required for basic local development. The application uses Supabase for backend services, but public keys are embedded in the code.

### Debugging
- The application uses React DevTools for component inspection
- Console.log statements are used sparingly for debugging collaboration features
- Error boundaries are not implemented; runtime errors will break the UI

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with CSS custom properties for design tokens
- **Editor**: CodeMirror 6 via `@uiw/react-codemirror`
- **State Management**: React hooks (useState, useEffect, useContext patterns)
- **Real-time Collaboration**: Supabase Presence + diff-match-patch for operational transforms
- **Markdown Processing**: `react-markdown` with remark-gfm and rehype plugins

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── globals.css         # Design tokens, utilities, base styles
│   ├── layout.ts           # Root layout
│   └── editor/             # Main editor route
│       └── page.tsx        # Primary editor implementation
├── components/             # Reusable UI components
│   ├── Header.tsx          # Top app bar with navigation and actions
│   ├── Toolbar.tsx         # Formatting toolbar (bold, italic, etc.)
│   ├── EditorPane.tsx      # CodeMirror 6 editor with custom theming
│   ├── PreviewPane.tsx     # Markdown preview with syntax highlighting
│   ├── OutlineSidebar.tsx  # Document outline with heading navigation
│   ├── StatusBar.tsx       # Bottom status bar (word count, cursor, etc.)
│   ├── CommandPalette.tsx  # Ctrl+K command interface
│   ├── SettingsModal.tsx   # Theme and preference settings
│   ├── GuidedTour.tsx      # Onboarding tour
│   ├── MetadataPanel.tsx   # Document properties editor
│   ├── ConfirmModal.tsx    # Confirmation dialogs
│   └── Toast.tsx           # Notification system
├── lib/                    # Utilities and helpers
│   ├── theme.ts            # Theme management and CSS variable injection
│   ├── useUser.ts          # Supabase user authentication hook
│   ├── supabase.ts         # Supabase client initialization
│   ├── document-utils.ts   # DOCX to markdown conversion
│   └── utils.ts            # Miscellaneous utility functions
└── types/                  # TypeScript type definitions
    └── index.ts            # Shared interfaces (ViewMode, EditorAPI, etc.)
```

### Key Architectural Patterns

#### 1. Editor-Centric Design
The editor is built around a central `EditorContent` component in `src/app/editor/page.tsx` that manages:
- Tab state (multiple document support)
- View modes (editor/split/preview)
- Collaboration state (Supabase presence)
- UI state (sidebar, focus mode, zen mode, etc.)
- Persistence (auto-save to Supabase/localStorage)

#### 2. Component Composition
UI follows a compositional pattern where:
- Components are designed to be reusable and composable
- Styling is done through Tailwind classes and CSS custom properties
- Components receive data and callbacks as props
- State is lifted to the nearest common ancestor (typically `EditorContent`)

#### 3. Design System
Styling uses a token-based approach:
- CSS custom properties defined in `:root` in `globals.css`
- Tokens include colors (`--accent`, `--ink`, `--paper`), radii (`--r-sm`, `--r-md`), spacing
- Theme switching is handled by `applySettings()` in `lib/theme.ts` which updates inline styles
- Tailwind classes build upon these tokens for component styling

#### 4. Real-time Collaboration
Collaboration architecture:
- Uses Supabase Presence for user awareness
- Operational transforms via diff-match-patch for conflict-free text editing
- Local optimistic updates with remote synchronization
- Cursor tracking and presence indicators
- Fallback polling mechanism for reliability

#### 5. State Management Patterns
- **Local Component State**: useState for UI toggles, form inputs
- **Shared State**: State lifted to `EditorContent` for tab/view/collaboration data
- **Refs**: useRef for direct DOM access (editor instances, containers)
- **Effects**: useEffect for subscriptions, persistence, side effects
- **Callbacks**: useCallback for stable function references (especially for editor actions)

#### 6. Editor Integration
The CodeMirror 6 editor (`EditorPane.js`) features:
- Custom theme generation from CSS variables
- Extension composition (markdown language, line wrapping, etc.)
- Remote patch application for collaboration
- Widget-based remote cursor rendering
- Accessibility enhancements (ARIA labels, keyboard navigation)

### Important Files to Understand First

1. **src/app/editor/page.tsx** - Main application logic, state management, and component orchestration
2. **src/components/EditorPane.tsx** - CodeMirror 6 integration and custom theming
3. **src/components/PreviewPane.tsx** - Markdown rendering with syntax highlighting
4. **src/components/Toolbar.tsx** - Action interface for text formatting
5. **src/components/OutlineSidebar.tsx** - Document navigation and heading parsing
6. **src/components/StatusBar.tsx** - Document statistics and UI controls
7. **src/lib/theme.ts** - Design token management and theme switching
8. **src/types/index.ts** - Shared TypeScript interfaces

### Common Development Tasks

#### Adding a New Toolbar Action
1. Add the action type to `ToolbarAction` union in `Toolbar.tsx`
2. Add the corresponding icon import from `lucide-react`
3. Add the action item to the appropriate group in `GROUPS` array
4. Add the action handler to the `handleCommand` function in `page.tsx`
5. Add shortcut definition if applicable

#### Modifying the Design System
1. Edit CSS variables in `src/app/globals.css :root`
2. Use the `applySettings()` function from `lib/theme.ts` to update variables at runtime
3. Reference variables using `var(--variable-name)` in CSS or Tailwind arbitrary values
4. Theme objects in `theme.ts` map names to dark/variant configurations

#### Implementing a New View Mode
1. Add the new mode to `ViewMode` type in `types/index.ts`
2. Update the view mode switcher in `Header.tsx`
3. Modify conditional rendering logic in `page.tsx` editor body
4. Adjust sidebar and toolbar behavior as needed
5. Update mobile view logic if applicable

#### Extending Collaboration Features
1. Modify the presence tracking in `page.tsx` presence effect
2. Update the `Collaborator` type in `types/index.ts` if needed
3. Adjust conflict resolution logic in patch handling
4. Update UI components to display new collaborator data

### Code Quality Patterns

#### TypeScript Usage
- Strict type checking enabled
- Interface segregation for component props
- Generic types used for reusable patterns (e.g., EditorAPI)
- Type assertions minimized, preferring proper typing

#### Performance Considerations
- Virtual scrolling not implemented (documents expected to be moderate size)
- Memoization with useMemo/useCallback for expensive computations
- Debounced auto-save (800ms)
- Efficient diff operations with diff-match-patch
- Lazy loading of heavy components via dynamic imports

#### Accessibility Features
- ARIA labels and roles throughout
- Keyboard navigation support
- Focus management
- Color contrast adherence to WCAG through design tokens
- Screen reader notifications for important events

#### Error Handling
- Try/catch blocks around async operations
- Error UI states for loading failures
- Console logging for development debugging
- Graceful degradation for missing features

### Directory-Specific Guidelines

#### /src/components
- Follow existing component patterns (props destructuring, default exports)
- Use Tailwind for styling with occasional custom CSS in JSX
- Place component-specific styles in JSX style attributes when necessary
- Export interfaces with components when they're tightly coupled
- Use lazy loading for heavy components with Suspense fallback

#### /src/lib
- Pure utility functions with minimal side effects
- Custom hooks follow `use*` naming convention
- Theme-related functions in theme.ts
- API/service integration in respective files
- Keep functions small and focused

#### /src/types
- Export interfaces and types used across multiple files
- Keep type definitions close to where they're used if not widely shared
- Use descriptive names and JSDoc comments for complex types
- Separate primitive types from complex domain models

### When Making Changes

1. **Styling Changes**: Always use CSS variables from globals.css rather than hardcoded values
2. **New Features**: Follow existing patterns for state management and component composition
3. **Performance**: Profile with React DevTools Profiler for expensive renders
4. **Collaboration**: Test with multiple users when modifying presence or patch logic
5. **Accessibility**: Verify keyboard navigation and screen reader compatibility
6. **Type Safety**: Leverage TypeScript to catch errors at compile time

This codebase prioritizes developer experience through clear separation of concerns, reusable components, and a well-defined design system that allows for theming without touching component styles.