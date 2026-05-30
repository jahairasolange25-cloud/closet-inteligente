# ADR-011: File Storage

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform manages a large volume of media files: high-resolution garment photographs (front, back, detail shots, flat lays), user-uploaded photos for virtual try-on and wardrobe digitization, 3D model files in glTF/GLB format for garments and avatars, AI processing results (segmentation masks, style analysis overlays), user profile images, and temporary processing files. These files require transformation capabilities (resize, crop, format conversion, compression), CDN delivery for fast global access, signed URLs for secure temporary access, and integration with image optimization pipelines.

## DECISION
We will use **Cloudinary as the primary file storage** with **Google Drive as a secondary/backup storage** for specific use cases.

Cloudinary provides an all-in-one media management platform that covers the project's key requirements:
- **Image transformation** — resize, crop, format optimization (WebP/AVIF), quality compression via URL parameters, eliminating the need for a separate image processing pipeline
- **CDN delivery** — global CDN with automatic optimizations based on device and network
- **Signed URLs** — secure temporary access for private user garment photos
- **Upload widgets** — direct browser uploads with progress tracking, reducing server load
- **AI integration** — Cloudinary's AI Background Removal complements custom Detectron2 pipeline
- **Video support** — 360-degree garment rotation videos and styling tutorial support

Google Drive is used as a secondary backup for sensitive user data (original unprocessed photos, large 3D model source files) and for internal team asset management where Cloudinary's transformation features aren't needed.

## CONSEQUENCES

**Positive:**
- Image transformations via URL parameters eliminate the need for a dedicated image processing microservice
- CDN delivery provides fast global asset loading for garment photos and 3D textures
- Signed URLs enable secure temporary access for private wardrobes without complex auth middleware
- Upload widgets reduce server load by handling direct browser-to-cloud uploads
- Automatic format selection (WebP/AVIF) improves page load performance without manual optimization
- Built-in AI features (background removal, tagging) complement the custom AI pipeline

**Negative:**
- Cloudinary vendor lock-in — migration would require rewriting all upload and transformation logic
- API pricing at scale — CDN bandwidth and transformation credits become significant cost at high traffic
- Google Drive integration adds a second storage provider, increasing operational complexity
- 3D model file type support is limited — Cloudinary primarily optimized for images/video, glTF storage may need CDN-only usage
- Upload widgets have limited customization for complex upload workflows (multi-garment upload, progress tracking across files)
- Signed URL expiration management requires careful UX design — expired URLs break inline images

## ALTERNATIVES CONSIDERED

### AWS S3 (with CloudFront CDN)
- **Pros:** Industry-standard object storage, extremely scalable, fine-grained access policies, lower cost at scale, no vendor lock-in for image processing (can use Sharp separately)
- **Cons:** No built-in image transformation — requires separate Lambda@Edge or dedicated image processing service, higher initial setup complexity, no upload widgets, S3 ACL/bucket policies are complex to configure correctly, CloudFront cache invalidation is expensive

### Google Cloud Storage
- **Pros:** Strong integration with Google Cloud ecosystem, fine-grained IAM, consistent performance
- **Cons:** Same image transformation gap as S3, no built-in CDN optimization, less mature ecosystem for media management, higher egress costs, fewer integration libraries for Node.js compared to Cloudinary

### Supabase Storage
- **Pros:** Direct integration with existing Supabase database, RLS policies for access control, simple API, bucket-based organization
- **Cons:** Limited image transformation capabilities (no on-the-fly resize/format conversion), no global CDN without additional configuration, newer service with less mature features, limited upload widget support, no AI-powered image features

## DATE
2026-05-25

## REVIEWERS
Lead Backend Engineer, DevOps Engineer, CTO
