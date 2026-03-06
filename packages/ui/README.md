# @deepcrawl/ui

Professional UI component library for DeepCrawl built with shadcn/ui, Tailwind CSS, and React.

## Overview

This package provides a shared, reusable UI component library used across all DeepCrawl applications. Built on top of shadcn/ui and Tailwind CSS, it delivers accessible, high-performance components with consistent design language, dark mode support, and full TypeScript safety.

## Features

### Design & Usability
- **Accessibility First**: WCAG 2.1 compliant with proper ARIA attributes, keyboard navigation, and screen reader support
- **Responsive Design**: Mobile-first approach with breakpoint-based responsive utilities
- **Dark/Light Themes**: Seamless theme switching with CSS variables and system preference detection
- **Consistent Spacing**: 4px grid system for predictable layout and alignment
- **Typography Scale**: Harmonious typography system optimized for readability

### Component Quality
- **Primitive-Based**: Built on Radix UI primitives for accessibility and reliability
- **TypeScript-First**: End-to-end type safety with comprehensive IntelliSense support
- **Tree-Shakable**: Only used components are included in bundles
- **Performance Optimized**: Minimal re-renders and efficient rendering paths
- **Extendable**: Easy to customize variants and extend with new functionality

### Developer Experience
- **Consistent API**: Predictable component props and behavior patterns
- **Comprehensive Docs**: JSDoc comments and usage examples
- **Theme Integration**: Built-in CSS variables for easy customization
- **Utility Functions**: Helper classes for common styling patterns (cn, twMerge, etc.)
- **Storybook Ready**: Component stories for visual testing and documentation

## Architecture

### Package Structure
```
src/
  components/
    ui/                   # shadcn/ui primitives and custom components
      button/             # Button variants and sizes
      card/               # Card containers with headers/footers
      dialog/             # Modal dialogs and popovers
      form/               # Form fields and validation
      navigation/         # Menus, tabs, breadcrumbs
      data-display/       # Tables, charts, badges, avatars
      feedback/           # Alerts, toasts, progress, tooltips
      layout/             # Sheets, drawers, accordions, separators
    icons/                # Custom SVG icon components (GitHub, Google, etc.)
    theme/                # Theme toggles and context providers
    mdx/                  # MDX components for documentation
  hooks/                  # Custom React hooks (use-mobile, use-is-mac, etc.)
  lib/                    # Utility functions (cn, formatDate, etc.)
  styles/                 # Global CSS and CSS variables
```

### Styling System
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **CSS Variables**: Design tokens for colors, spacing, radius, and shadows
- **Dark Mode**: Automatic class-based switching via `dark:` variants
- **Responsive Prefixes**: Mobile-first breakpoint system (sm, md, lg, xl, 2xl)
- **Arbitrary Values**: Support for custom values when needed (`[#1a1a1a]`)

## Usage

### Component Import
```tsx
import { 
  Button, 
  ButtonVariant, 
  ButtonSize 
} from "@deepcrawl/ui/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter 
} from "@deepcrawl/ui/components/ui/card";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogDescription 
} from "@deepcrawl/ui/components/ui/dialog";
```

### Basic Usage
```tsx
export function ExampleComponent() {
  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold">Component Title</h2>
        <p className="text-sm text-muted-foreground">
          Component description or subtitle
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Component content goes here...</p>
        <Button 
          variant="default" 
          size="lg" 
          className="w-full"
        >
          Primary Action
        </Button>
      </CardContent>
    </Card>
  );
}
```

### With Icons
```tsx
import { GithubIcon } from "@deepcrawl/ui/components/icons/provider-icons";
import { GoogleIcon } from "@deepcrawl/ui/components/icons/provider-icons";

export function AuthButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button variant="outline">
        <GithubIcon className="mr-2 h-4 w-4" />
        Sign in with GitHub
      </Button>
      <Button variant="outline">
        <GoogleIcon className="mr-2 h-4 w-4" />
        Sign in with Google
      </Button>
    </div>
  );
}
```

### Form Integration
```tsx
import { 
  Input, 
  InputProps 
} from "@deepcrawl/ui/components/ui/input";
import { 
  Label 
} from "@deepcrawl/ui/components/ui/label";
import { 
  Button 
} from "@deepcrawl/ui/components/ui/button";

export function LoginForm() {
  return (
    <form className="space-y-4">
      <Label htmlFor="email">Email Address</Label>
      <Input
        id="email"
        type="email"
        placeholder="you@example.com"
        required
      />
      
      <Label htmlFor="password">Password</Label>
      <Input
        id="password"
        type="password"
        placeholder="••••••••"
        required
      />
      
      <Button type="submit" variant="default">
        Sign In
      </Button>
    </form>
  );
}
```

## Development Guidelines

### Adding Components
Components should be added through the Next.js app to ensure proper sharing:
```bash
# From the apps/app directory
pnpm ui add <component-name>
```

This automatically adds the component to the shared UI package.

### Styling Best Practices
1. **Use Utility Classes**: Prefer Tailwind utility classes over custom CSS
2. **Leverage Variants**: Use component variants (size, variant) before custom styling
3. **Responsive First**: Start with mobile styles, enhance for larger screens
4. **Accessibility Always**: Include proper labels, ARIA attributes, and keyboard support
5. **Theme Aware**: Use `dark:` variants and CSS variables for theme support
6. **Consistency**: Follow existing patterns in the codebase

### Theme Customization
The theme system uses CSS variables for easy customization:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
}
```

## Component Catalog

### Layout & Containers
- **Card**: Flexible content containers with header/footer variants
- **Sheet**: Slide-out panels for mobile and desktop
- **Dialog**: Modal dialogs with backdrop and focus trapping
- **Accordion**: Vertically stacked expandable/collapsible panels
- **Separator**: Visual dividers between content sections
- **Tabs**: Tabbed navigation with horizontal and vertical variants

### Form Elements
- **Button**: Multiple variants (default, destructive, outline, secondary, ghost, link)
- **Input**: Text, email, password, number, telephone, URL inputs
- **Textarea**: Multi-line text input with auto-resize option
- **Select**: Dropdown selection with search and virtual scroll options
- **Checkbox**: Boolean input with indeterminate state support
- **Radio Button**: Mutual exclusion radio button groups
- **Switch**: Toggle switch for binary choices
- **File Upload**: File input with drag-and-drop preview

### Data Display
- **Table**: Sortable, filterable, paginated data tables
- **Badge**: Status indicators with variant colors
- **Avatar**: User profile images with fallback initials
- **Image**: Optimized image component with loading states
- **Tooltip**: Contextual help and information popovers
- **Tag**: Categorization labels with customizable appearance

### Feedback & Interaction
- **Alert**: Informational, warning, error, and success messages
- **Toast**: Non-blocking notifications with auto-dismiss
- **Progress Bar**: Visual indicators for ongoing operations
- **Skeleton Loader**: Placeholder components during data loading
- **Hover Card**: Cards that appear on hover for additional context

### Navigation
- **Breadcrumb**: Hierarchical navigation trail
- **Dropdown Menu**: Contextual menus with keyboard navigation
- **Menubar**: Horizontal or vertical menu bars
- **Command Palette**: Searchable action interface (Cmd+K)
- **Sidebar**: Collapsible navigation panels
- **Tabs**: Horizontal and vertical tabbed interfaces

## Development Commands

```bash
# Install dependencies (if developing this package)
pnpm install

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Run tests
pnpm test

# Build package
pnpm build

# Watch for changes during development
pnpm dev

# Format code
pnpm format
```

## Contributing

Please read our [CONTRIBUTING.md](../CONTRIBUTING.md) for details on:
- Code review process
- Component creation guidelines
- Accessibility requirements
- Testing standards
- Documentation expectations

## License

MIT License - see the [root LICENSE](../LICENSE) file for details.

---

*Built with ❤️ for the DeepCrawl ecosystem - Professional UI components for AI-powered applications.*