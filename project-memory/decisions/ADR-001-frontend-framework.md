# ADR-001: Frontend Framework

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform requires a modern, performant frontend framework capable of delivering an immersive 3D fashion experience with virtual try-on, real-time outfit visualization, and responsive garment browsing. Key requirements include server-side rendering for SEO and initial load performance, strong type safety for complex state management, seamless integration with 3D rendering libraries (Three.js), and compatibility with the Vercel deployment target specified in project requirements.

## DECISION
We will use **Next.js with React and TypeScript** as our frontend framework.

Next.js provides hybrid SSR/SSG capabilities, enabling pre-rendered static pages for garment catalogs and SEO-optimized product pages while supporting server-side rendering for dynamic user dashboards and virtual fitting rooms. TypeScript ensures type safety across the entire frontend codebase, reducing runtime errors in complex state interactions. React's component model aligns naturally with the declarative 3D scene management provided by React Three Fiber.

The framework was chosen over alternatives because it fulfills the project's core architectural needs without requiring additional tooling layers. Next.js 14+ with the App Router offers React Server Components, streaming, and incremental static regeneration, all critical for a content-rich fashion platform with frequent inventory updates.

## CONSEQUENCES

**Positive:**
- SSR and ISR provide excellent SEO for garment catalog pages and blog content
- Vercel deployment is first-class and optimized, reducing DevOps overhead
- TypeScript catches type errors during development, critical for complex garment metadata structures
- Large ecosystem of React libraries (TanStack Query, Zustand, Three.js wrappers) available
- React Server Components reduce client-side JavaScript bundle for static pages
- Built-in image optimization with next/image for garment photography

**Negative:**
- Next.js introduces tighter coupling to Vercel for optimal feature usage (ISR, Middleware, Edge Functions)
- Framework learning curve for team members unfamiliar with SSR patterns
- Build times increase with large static catalog pages during ISR regeneration
- App Router migration patterns still evolving in the Next.js ecosystem

## ALTERNATIVES CONSIDERED

### Vue.js (with Nuxt 3)
- **Pros:** Lighter learning curve, excellent SSR via Nuxt, reactive system similar to React
- **Cons:** Smaller ecosystem for 3D rendering libraries (Three.js wrappers less mature), team has more React experience, reduced library compatibility with React Three Fiber ecosystem

### Angular
- **Pros:** Strong opinionated structure, built-in dependency injection, comprehensive tooling
- **Cons:** Heavier bundle size, steeper learning curve, less compatible with Three.js/react-three-fiber, over-engineered for this application's complexity level

### Svelte (with SvelteKit)
- **Pros:** Minimal boilerplate, excellent performance, small bundle size
- **Cons:** Smaller ecosystem, fewer ready-made component libraries for fashion/e-commerce, limited WebGL/Three.js integration patterns, smaller talent pool

### Plain React (without Next.js)
- **Pros:** Maximum flexibility, no framework lock-in, simpler mental model
- **Cons:** No built-in SSR/SSG — requires manual setup with Vite + additional libraries, no standardized routing, no image optimization, no middleware/edge functions, increased DevOps complexity

## DATE
2026-05-25

## REVIEWERS
Lead Frontend Engineer, CTO, Product Manager
