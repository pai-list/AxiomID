# Expert Typography & Design System

> **Version:** 1.0.0 | **Last Updated:** 2026-06-03 | **Status:** Active

## Design Principles

### 1. Information Density
- One file = one concept
- Maximum knowledge per byte
- Zero filler content

### 2. Cognitive Load Management
- Progressive disclosure
- Visual hierarchy through typography
- Consistent patterns across all documents

### 3. Dual Consumption
- Human-readable (Obsidian, browser)
- Machine-parseable (frontmatter, structured data)

---

## Typography System

### Font Stack
```css
/* Primary: Code-first, zero-dependency */
font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;

/* Fallback: Human-readable */
font-family: 'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;

/* Display: Headers and titles */
font-family: 'SF Mono', 'Fira Code', monospace;
font-weight: 600;
letter-spacing: -0.02em;
```

### Type Scale (Modular, 1.25 ratio)
```css
--text-xs: 0.64rem;    /* 10.24px - captions */
--text-sm: 0.8rem;     /* 12.8px - labels */
--text-base: 1rem;     /* 16px - body */
--text-lg: 1.25rem;    /* 20px - subheadings */
--text-xl: 1.563rem;   /* 25px - section headers */
--text-2xl: 1.953rem;  /* 31.25px - page titles */
--text-3xl: 2.441rem;  /* 39.06px - hero text */
```

### Line Heights
```css
--leading-tight: 1.2;   /* Headers */
--leading-normal: 1.5;  /* Body text */
--leading-relaxed: 1.75; /* Long-form reading */
```

---

## Visual Hierarchy

### Section Headers
```markdown
# Level 1: Page Title
> **Font:** 2rem, weight 700, tracking -0.02em
> **Purpose:** Document identity
> **Example:** `# Authentication System`

## Level 2: Section
> **Font:** 1.5rem, weight 600, tracking -0.01em
> **Purpose:** Major divisions
> **Example:** `## Overview`

### Level 3: Subsection
> **Font:** 1.25rem, weight 500
> **Purpose:** Logical groupings
> **Example:** `### Configuration`

#### Level 4: Detail
> **Font:** 1rem, weight 500, color: text-secondary
> **Purpose:** Specific topics
> **Example:** `#### Error Handling`
```

### Content Blocks

#### Code Blocks
```markdown
```language
// Monospace, syntax highlighted
// Line numbers for reference
// Max width: 80 chars per line
```​
```

#### Callouts
```markdown
> **Note:** Informational context
> **Warning:** Requires attention
> **Critical:** Breaking change or security issue
> **Success:** Verified working state
```

#### Tables
```markdown
| Column | Alignment | Width |
|--------|-----------|-------|
| ID     | Left      | 80px  |
| Name   | Left      | auto  |
| Status | Center    | 100px |
```

---

## Color System

### Semantic Colors
```css
--color-success: #10B981;   /* Green - verified, passing */
--color-warning: #F59E0B;   /* Amber - attention needed */
--color-error: #EF4444;     /* Red - failure, critical */
--color-info: #3B82F6;      /* Blue - informational */
--color-neutral: #6B7280;   /* Gray - secondary text */
```

### Background Colors
```css
--bg-primary: #FFFFFF;      /* Main background */
--bg-secondary: #F9FAFB;    /* Code blocks, cards */
--bg-tertiary: #F3F4F6;     /* Borders, dividers */
--bg-inverse: #111827;      /* Dark mode primary */
```

### Status Colors
```css
--status-active: #10B981;
--status-proposed: #3B82F6;
--status-deprecated: #EF4444;
--status-reviewing: #F59E0B;
--status-superseded: #6B7280;
```

---

## Spacing System

### Base Unit: 4px
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Layout Spacing
```css
--section-gap: 3rem;      /* Between major sections */
--block-gap: 1.5rem;      /* Between content blocks */
--inline-gap: 0.5rem;     /* Between inline elements */
--padding-page: 2rem;     /* Page margins */
--padding-card: 1.5rem;   /* Card/padding internal */
```

---

## Iconography

### System Icons (Emoji)
```markdown
🔴 Critical/Failure   - Blockers, critical path
🟡 Warning/Attention   - Needs review, deprecated
🟢 Success/Active      - Verified, passing
🔵 Info/Note           - Context, documentation
⚪ Neutral/Inactive    - Pending, proposed
```

### Status Indicators
```markdown
✅ Complete           - Task finished
🔄 In Progress        - Currently working
⏳ Pending            - Waiting for dependency
❌ Failed             - Error occurred
⚠️  Warning           - Requires attention
```

### File Type Icons
```markdown
📄 Document           - Markdown, text
📁 Directory          - Folder
🔧 Tool               - Utility, script
🧪 Test               - Test file
📦 Package            - Dependency, library
```

---

## Document Structure

### Frontmatter Schema
```yaml
---
type: decision | lesson | failure | architecture | fact | guide
status: proposed | active | reviewing | deprecated | superseded
importance: critical | high | medium | low
domains:
  - passport
  - pi
  - authentication
confidence: 0.0-1.0
verification: tests | build | runtime | manual | unverified
files:
  - src/path/to/file.ts
related:
  - DEC-XXX
  - LESSON-XXX
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - tag1
  - tag2
---
```

### Document Layout
```markdown
# Title
> One-line summary

## Context
> Why this exists

## Content
> Main information

## Impact
> What this affects

## Related
> Links to other documents

## Metadata
> Technical details
```

---

## Code Documentation Style

### Function Documentation
```typescript
/**
 * Authenticates agent using AxiomID credentials.
 * 
 * @param credentials - Agent authentication data
 * @returns Promise resolving to authentication result
 * @throws AuthenticationError if credentials invalid
 * 
 * @example
 * ```typescript
 * const result = await authenticate({
 *   agentId: 'agent-123',
 *   apiKey: '...'
 * });
 * ```
 */
```

### Class Documentation
```typescript
/**
 * Manages digital passport lifecycle.
 * 
 * Handles creation, verification, and revocation of
 * agent passports following W3C VC standard.
 * 
 * @see {@link https://www.w3.org/TR/vc-data-model/} W3C VC Spec
 */
```

### Variable Documentation
```typescript
/** Maximum retry attempts for API calls */
const MAX_RETRIES = 3;

/** Default timeout in milliseconds */
const TIMEOUT_MS = 30000;
```

---

## Writing Style Rules

### Conciseness
```markdown
❌ "In order to authenticate the agent, it is necessary to..."
✅ "To authenticate an agent..."

❌ "It should be noted that the system uses..."
✅ "The system uses..."
```

### Active Voice
```markdown
❌ "The authentication is performed by..."
✅ "The system authenticates..."

❌ "Files are processed by the pipeline..."
✅ "The pipeline processes files..."
```

### Technical Precision
```markdown
❌ "The API is fast"
✅ "API response time < 100ms (p95)"

❌ "Memory usage is low"
✅ "Memory usage: 45MB average, 120MB peak"
```

### Consistent Terminology
```markdown
❌ "agent" / "bot" / "AI" / "model"
✅ "agent" (always)

❌ "execute" / "run" / "perform"
✅ "execute" (for code), "run" (for tools)

❌ "data" / "information" / "content"
✅ "data" (structured), "content" (unstructured)
```

---

## Obsidian Integration

### Callout Types
```markdown
> [!note] Informational
> General information

> [!tip] Helpful
> Best practices

> [!info] Context
> Background information

> [!warning] Caution
> Requires attention

> [!danger] Critical
> Breaking change or security issue

> [!success] Verified
> Confirmed working

> [!question] Unknown
> Needs investigation

> [!example] Example
> Code or usage example
```

### Tags Convention
```markdown
#status/active
#status/proposed
#status/deprecated

#domain/passport
#domain/pi
#domain/auth

#type/decision
#type/lesson
#type/failure
#type/architecture

#priority/critical
#priority/high
#priority/medium
#priority/low
```

### Linking Convention
```markdown
<!-- Internal links -->
[[DEC-001]]
[[LESSON-001]]
[[passport-authentication]]

<!-- Reference links -->
[[DEC-001|Decision: Auth System]]
[[LESSON-001|Lesson: Pi Integration]]

<!-- Embeds -->
![[diagram.png]]
![[code-example.ts]]
```

---

## Agent-Specific Formatting

### Structured Output
```json
{
  "type": "extraction_result",
  "timestamp": "2026-06-03T00:00:00Z",
  "tool": "memory_extractor",
  "output": {
    "decisions": [...],
    "lessons": [...],
    "failures": [...]
  },
  "metrics": {
    "files_scanned": 1234,
    "items_extracted": 56,
    "confidence_avg": 0.85
  }
}
```

### Agent-Friendly Sections
```markdown
## Quick Reference
> One-line summaries for fast lookup

## Code Paths
> Exact file locations with line numbers

## Dependencies
> What this depends on

## Consumers
> What depends on this

## Validation
> How to verify this works
```

---

## Responsive Design

### Breakpoints
```css
/* Mobile: < 640px */
/* Tablet: 640px - 1024px */
/* Desktop: > 1024px */
```

### Container Widths
```css
--max-width-prose: 65ch;    /* Optimal reading width */
--max-width-content: 80ch;  /* Code-heavy content */
--max-width-wide: 120ch;    /* Tables, diagrams */
```

---

## Accessibility

### Contrast Ratios
```css
/* Normal text: 4.5:1 minimum */
/* Large text: 3:1 minimum */
/* UI components: 3:1 minimum */
```

### Focus States
```css
/* Visible focus ring */
:focus-visible {
  outline: 2px solid var(--color-info);
  outline-offset: 2px;
}
```

### Screen Reader Support
```markdown
<!-- Alt text for images -->
![Architecture diagram showing...](diagram.png)

<!-- ARIA labels for interactive elements -->
[Link text](url "Description for screen readers")
```

---

## Print Styles

```css
@media print {
  /* Remove navigation */
  nav, .sidebar { display: none; }
  
  /* Ensure page breaks */
  h1, h2 { page-break-after: avoid; }
  pre { page-break-inside: avoid; }
  
  /* Show URLs */
  a[href]:after { content: " (" attr(href) ")"; }
}
```

---

## Maintenance

### Review Cycle
- **Weekly:** Check for broken links, outdated status
- **Monthly:** Review writing style consistency
- **Quarterly:** Update typography scale if needed

### Version Control
- All design changes tracked in git
- Semantic versioning for style guides
- Deprecation notices for removed patterns
