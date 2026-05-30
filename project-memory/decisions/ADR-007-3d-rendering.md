# ADR-007: 3D Rendering

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform features a 3D virtual wardrobe where users can visualize garments on customizable avatars, rotate and zoom into garment details from all angles, try on outfits virtually using their own body measurements, and view fabric draping and fit on a 3D model. The 3D rendering must run in the browser without plugins, integrate seamlessly with the React component tree, support glTF/GLB models (the standard for garment and avatar 3D assets), and perform well on mid-range mobile devices. Avatar creation will use Ready Player Me for cross-platform avatar generation, and garment models will be created in Blender.

## DECISION
We will use **React Three Fiber (R3F) with Three.js** for 3D rendering.

React Three Fiber provides a declarative, React-idiomatic wrapper around Three.js, enabling 3D scene management within React's component and state model. This allows the development team to compose 3D scenes using JSX, manage 3D object state with Zustand (same state manager as the rest of the app), and integrate 3D rendering into Next.js pages without context switching to imperative Three.js code.

Specific advantages for this project:
- **Declarative scene graph** — garments, avatars, lighting, and environment map to React components
- **Drei library** — provides pre-built components (OrbitControls, Environment, Loader, Text, Html) that accelerate development
- **Performance** — Three.js's WebGL renderer handles complex garment meshes with morph targets for cloth animation
- **Model loading** — useGLTF with Suspense integration handles glTF/GLB model streaming and caching
- **Avatar integration** — Ready Player Me provides glTF avatars compatible with R3F's loading pipeline
- **Cloth simulation** — Three.js examples / custom shaders for fabric draping effects

## CONSEQUENCES

**Positive:**
- React-idiomatic API eliminates context switching between React and Three.js code
- Zustand store integration enables UI-driven scene changes (color changes, garment swaps) without imperative Three.js code
- Drei ecosystem provides production-tested components (loading states, controls, post-processing)
- Suspense integration handles 3D model loading with React error boundaries and loading fallbacks
- Strong TypeScript support through @react-three/fiber types
- Active community and extensive examples for fashion/avatar use cases

**Negative:**
- Mobile performance limitations require aggressive LOD (Level of Detail) and polygon budget management
- WebGL context limitations (max texture size, max bones per mesh) affect high-detail garment models
- Memory management for 3D assets requires careful disposal to avoid leaks in long browsing sessions
- Browser compatibility issues with older WebGL 1.0 devices
- React Three Fiber version synchronization with Three.js core requires careful dependency management
- Asset pipeline from Blender to glTF requires manual optimization (mesh compression, texture atlasing)

## ALTERNATIVES CONSIDERED

### Unity WebGL
- **Pros:** Mature 3D engine with powerful rendering, physics, and animation systems, excellent for cloth simulation
- **Cons:** Large bundle size (~15MB+), no React integration, separate development workflow and tooling (C#), limited browser performance compared to native Three.js, slower iteration cycle for UI integration

### Babylon.js
- **Pros:** Powerful 3D engine with built-in physics, comprehensive documentation, good performance
- **Cons:** Less React integration — manual scene management required, smaller community than Three.js for fashion/avatar use cases, no declarative component model, steeper learning curve for React developers

### Pure WebGL (raw or with lightweight wrappers)
- **Pros:** Maximum performance, minimal bundle size, full control over rendering pipeline
- **Cons:** Extremely verbose — all rendering, lighting, and animation must be implemented from scratch, no scene graph, no asset loading pipeline, impractical for complex 3D scenes with multiple garment meshes

## DATE
2026-05-25

## REVIEWERS
Lead Frontend Engineer, 3D Artist, Technical Director
