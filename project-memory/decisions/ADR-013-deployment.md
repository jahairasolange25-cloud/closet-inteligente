# ADR-013: Deployment Infrastructure

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform requires a deployment infrastructure that supports: optimized hosting for Next.js applications with SSR/ISR capabilities, containerized backend services (NestJS, Python AI service, Redis), scalable PostgreSQL database with connection pooling, preview deployments for feature branch testing, CI/CD pipeline integration with GitHub Actions, and cost-effective scaling during early-stage growth. The team prefers managed services over raw infrastructure to reduce DevOps overhead while maintaining the ability to migrate to more custom setups as the platform scales.

## DECISION
We will use **Vercel for the frontend** and **Railway for the backend services**.

**Vercel** is chosen for frontend deployment because it is built by the creators of Next.js and provides first-class support for all Next.js features: SSR, ISR, Edge Functions, Middleware, Image Optimization, and Incremental Static Regeneration. Vercel's preview deployments automatically spin up for each pull request, enabling rapid iteration on UI changes with shareable URLs for designer and stakeholder review. The global edge network ensures low-latency delivery of static assets and server-rendered pages worldwide.

**Railway** is chosen for backend services because it provides container-based deployment with native PostgreSQL support, automatic HTTPS, custom domains, environment variable management, and simple horizontal scaling. Railway supports deploying multiple services within a project (NestJS API, Python AI service, Redis) with internal networking between them.

Docker containers for backend services ensure environment consistency across development, staging, and production. The AI Python service is deployed as a separate Railway service due to its different resource requirements (GPU support, longer startup times, different scaling needs).

## CONSEQUENCES

**Positive:**
- Vercel provides zero-configuration deployment for Next.js with automatic optimization
- Preview deployments for every PR enable visual regression testing and stakeholder review
- Railway's container-based deployment matches our Docker strategy, ensuring environment consistency
- Managed PostgreSQL on Railway reduces database administration overhead
- Automatic SSL/TLS certificate management via both platforms
- Separate scalability — frontend and backend can scale independently based on traffic patterns
- Railway's service mesh handles internal communication between backend services

**Negative:**
- Dual-provider approach increases operational complexity — two dashboards, two billing systems
- Vercel's edge functions have cold start latency and execution duration limits (10s on Hobby, 60s on Pro)
- Railway's GPU support is limited compared to dedicated GPU providers — may need to run AI service on a separate GPU instance (e.g., RunPod, Banana)
- Vercel's bandwidth costs at scale (over 100GB/month on Pro plan)
- Railway's observability (logs, metrics) is less mature than dedicated monitoring solutions
- Migration from Railway to alternative container hosting (AWS ECS, GCP Cloud Run) requires reconfiguration of networking and CI/CD

## ALTERNATIVES CONSIDERED

### AWS (ECS + CloudFront + RDS)
- **Pros:** Full control over infrastructure, extensive service ecosystem, enterprise compliance, best-in-class GPU instances for AI
- **Cons:** Significant DevOps overhead for setup and maintenance, complex IAM and networking configuration, unpredictable costs, over-engineered for the platform's current stage

### Google Cloud Platform (Cloud Run + Cloud SQL + GKE)
- **Pros:** Serverless containers with Cloud Run, managed PostgreSQL via Cloud SQL, strong AI/ML services
- **Cons:** Similar complexity to AWS, Cloud Run's request timeout limit (60 minutes) may affect AI inference jobs, requires Kubernetes for stateful workloads, less optimized for Next.js than Vercel

### Heroku
- **Pros:** Simple deployment with git push, managed PostgreSQL add-on, straightforward scaling
- **Cons:** Significantly higher cost per dyno, no built-in Next.js optimization, limited container customization, no preview deployments, declining platform investment from Salesforce, cold start latency on free tier

### DigitalOcean App Platform
- **Pros:** Simple pricing, managed PostgreSQL, straightforward deployment from GitHub, good documentation
- **Cons:** Less optimized for Next.js than Vercel, fewer regions, no built-in edge functions, no preview deployments, manual scaling required, limited GPU support for AI services

## DATE
2026-05-25

## REVIEWERS
DevOps Engineer, CTO, Lead Backend Engineer
