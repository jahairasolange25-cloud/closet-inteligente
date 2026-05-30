# ADR-009: Styling Architecture

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform requires a styling solution that supports: a fashion-forward visual design with custom typography, color palettes, and spacing; responsive layouts across mobile, tablet, and desktop viewports; dark mode for virtual wardrobe browsing; design system tokens for consistent spacing, colors, and typography across components; performance-optimized CSS with minimal runtime overhead; and rapid iteration for UI prototypes and A/B testing of fashion layouts.

## DECISION
We will use **Tailwind CSS** as the styling framework.

Tailwind CSS provides utility-first CSS classes that enable rapid UI development directly in JSX. The design system tokens (colors, spacing, typography, breakpoints, shadows) are configured in tailwind.config.ts and extended with fashion-specific tokens: brand color palette, garment category colors, size chart gradients, and 3D viewer overlay styles. Tailwind's JIT (Just-In-Time) compiler generates only the CSS classes actually used in the codebase, resulting in minimal bundle sizes (<10KB gzipped for most pages).

Key usage patterns for this project:
- **Design system tokens** — custom colors for garment categories (tops, bottoms, dresses, outerwear), size chart colors, brand accent palette
- **Dark mode** — Tailwind's dark variant enables theme switching for wardrobe browsing at night
- **Responsive prefixes** — sm/md/lg/xl breakpoints for garment grid layouts, fitting room UI, and mobile navigation
- **Arbitrary values** — precise spacing and sizing for 3D viewer overlays and garment detail popups
- **Animation utilities** — micro-interactions for outfit composition drag-and-drop, garment hover states

## CONSEQUENCES

**Positive:**
- Rapid prototyping speed — no context switching between JSX and CSS files
- JIT compilation produces very small production CSS bundles, improving page load times
- Design system consistency enforced through tailwind.config.ts tokens
- Dark mode implementation requires only a class toggle and `dark:` variants
- Responsive design is intuitive with breakpoint prefixes directly in className strings
- Excellent performance — no runtime CSS-in-JS overhead that could compete with 3D rendering resources
- Tailwind's `@apply` directive enables component-level abstraction when utility classes become repetitive

**Negative:**
- JSX markup becomes verbose with long className strings — requires component extraction discipline
- Learning curve for developers unfamiliar with utility-first CSS
- Design system changes require config updates and potentially large-scale className audits
- CSS-in-JS solutions (like Styled Components) offer better dynamic styling for runtime theme changes
- Figma-to-Tailwind conversion requires manual token mapping or plugin tooling
- Custom animations may exceed Tailwind's defaults and require custom keyframe definitions

## ALTERNATIVES CONSIDERED

### Styled Components (CSS-in-JS)
- **Pros:** Dynamic styling based on props, colocation of styles with components, no class name collisions
- **Cons:** Runtime CSS injection overhead (competing with 3D rendering), larger bundle size, no built-in design system enforcement, slower development iteration compared to utility classes, SSR setup required with Next.js

### CSS Modules
- **Pros:** Zero runtime cost, native CSS, local scoping, good TypeScript integration
- **Cons:** No built-in design system tokens, verbose for responsive design (media queries in each module), no dark mode variants, slower iteration than utility classes, file proliferation

### Material UI
- **Pros:** Comprehensive component library, built-in design system, accessibility baked in
- **Cons:** Heavy bundle size (~100KB+), restrictive Material Design aesthetic — difficult to customize for fashion brand identity, override-heavy implementation for unique designs, performance overhead with JSS/styled engine

### Chakra UI
- **Pros:** Good accessibility, dark mode built-in, component library, responsive style props
- **Cons:** Tightly coupled to Chakra's component model — difficult to create custom fashion components, runtime style computation overhead, restrictive for complex layouts, smaller community than Tailwind

## DATE
2026-05-25

## REVIEWERS
Lead Frontend Engineer, UI/UX Designer, Design Lead
