# ADR-002: Backend Framework

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital backend must support a fashion platform with garment inventory management, user accounts, outfit composition, real-time virtual try-on coordination, AI model inference orchestration, WebSocket connections for collaborative styling sessions, and secure file upload processing. The architecture requires a modular, testable structure that can scale with the introduction of new AI features and third-party integrations. Strong TypeScript support is critical to share types with the frontend and maintain consistency across the full stack.

## DECISION
We will use **NestJS with Node.js** as the backend framework.

NestJS provides a structured, opinionated architecture built around modules, controllers, providers, and dependency injection — enabling clean separation of concerns across domains (garments, users, outfits, AI orchestration, notifications). Its decorator-based system integrates naturally with TypeScript and supports WebSocket gateways through Socket.IO integration. NestJS's platform-agnostic design allows us to use Express under the hood while maintaining the ability to switch to Fastify if performance requirements demand it.

The framework excels for this project because of built-in support for:
- **Modular architecture** — each domain (auth, garments, users, outfits, ai, notifications) maps to a NestJS module
- **WebSocket gateways** — native Socket.IO integration for real-time virtual fitting rooms
- **Guards and interceptors** — declarative auth, rate limiting, logging, and transformation pipelines
- **Swagger/OpenAPI** — automatic API documentation generation for frontend consumption
- **Testing utilities** — built-in dependency override for unit and integration testing

## CONSEQUENCES

**Positive:**
- Clean separation of concerns via modules, making the codebase navigable as it grows
- Dependency injection simplifies testing and service replacement
- WebSocket support via Socket.IO decorators reduces boilerplate for real-time features
- Type-safe RPC between frontend and backend using shared types
- Built-in validation (class-validator, class-transformer) for API input sanitization
- Mature ecosystem with guards, interceptors, pipes, and exception filters

**Negative:**
- NestJS adds abstraction overhead compared to raw Express — more files and boilerplate per feature
- Decorator-based architecture can feel magical and hard to debug for new team members
- Framework version upgrades (e.g., NestJS 10 to 11) can introduce breaking changes in module/DI patterns
- Performance overhead from the DI container and proxy wrappers, though negligible for this scale

## ALTERNATIVES CONSIDERED

### Express.js (raw)
- **Pros:** Maximum simplicity, minimal abstraction, largest Node.js ecosystem, well-understood by all developers
- **Cons:** No built-in module structure — leads to disorganized codebases at scale, manual DI setup, no native WebSocket integration, no built-in validation or documentation generation, requires significant boilerplate for enterprise patterns

### Fastify
- **Pros:** Higher performance than Express, schema-based serialization, low overhead
- **Cons:** Smaller ecosystem, fewer middlewares, NestJS compatibility available but less mature, team less familiar

### Django (Python)
- **Pros:** Batteries-included, excellent ORM, mature admin interface, strong community
- **Cons:** Breaks full-stack TypeScript consistency, slower request handling for WebSocket/realtime, separate language requirement increases cognitive overhead for team, Python async ecosystem less mature for WebSocket-heavy workloads

### Spring Boot (Java/Kotlin)
- **Pros:** Enterprise-grade, excellent performance, mature ecosystem, strong typing
- **Cons:** Significantly heavier resource footprint, different language breaks stack consistency, higher complexity for API development, slower iteration speed during development

## DATE
2026-05-25

## REVIEWERS
Lead Backend Engineer, CTO, Tech Lead
