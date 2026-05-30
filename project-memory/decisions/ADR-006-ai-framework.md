# ADR-006: AI Framework

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform requires AI capabilities for multiple fashion-specific features: garment segmentation and extraction from user-uploaded photos (removing backgrounds, isolating clothing items), virtual try-on by mapping garment images onto user photos or 3D avatars, style classification and recommendation based on garment attributes and user preferences, fit prediction using body measurements and garment dimensions, color palette analysis, and outfit compatibility scoring. The AI pipeline must integrate with Detectron2 for instance segmentation, OpenCV for image processing, MediaPipe for body landmark detection and pose estimation, and Hugging Face Transformers for vision-language models that can describe and tag garments.

## DECISION
We will use **PyTorch** as the primary deep learning framework.

PyTorch is chosen over TensorFlow because of its tight integration with the Detectron2 ecosystem (built on PyTorch), which is the leading framework for instance segmentation tasks essential to garment extraction. PyTorch's dynamic computation graph provides the flexibility needed to experiment with custom model architectures for fashion-specific tasks like garment deformation estimation and fit prediction. The research community's strong preference for PyTorch (over 80% of papers at CVPR/ECCV use PyTorch) ensures access to state-of-the-art models for fashion AI tasks.

The AI service runs as a separate Python service communicating with the NestJS backend via REST API (for batch jobs) and Redis pub/sub (for real-time inference requests). Models are versioned using DVC (Data Version Control) and stored in cloud storage. GPU inference is handled via NVIDIA Triton Inference Server for production deployment.

## CONSEQUENCES

**Positive:**
- Direct access to Detectron2 for state-of-the-art instance segmentation of garments
- Dynamic graphs enable flexible model architectures for fashion-specific custom models
- Rich ecosystem of pre-trained models and transfer learning resources for fashion AI
- Hugging Face Transformers with PyTorch backend for vision-language models (BLIP, CLIP)
- Large research community ensures ongoing improvements in fashion AI techniques
- Python ecosystem provides OpenCV, NumPy, Pillow for preprocessing and post-processing pipelines

**Negative:**
- Python service introduces a polyglot architecture — separate language from the main Node.js stack
- Model inference requires GPU resources, increasing infrastructure cost and complexity
- Model versioning and deployment pipeline adds DevOps overhead
- Inference latency varies significantly based on model complexity and hardware
- PyTorch -> TorchScript/ONNX export needed for optimized production inference
- Memory management for GPU models requires careful orchestration to avoid OOM errors

## ALTERNATIVES CONSIDERED

### TensorFlow
- **Pros:** Mature production ecosystem (TF Serving, TF Lite, TF.js), broader deployment targets including mobile and web
- **Cons:** Limited integration with Detectron2 (Facebook AI Research built on PyTorch), static graph makes custom architecture prototyping slower, declining research community adoption, more complex API surface

### Keras (as standalone, TensorFlow-backed)
- **Pros:** High-level API, rapid prototyping, good for standard architectures
- **Cons:** Limited flexibility for custom layers needed in garment segmentation, same Detectron2 compatibility issue as TensorFlow, abstraction hides important details for production optimization

### ONNX Runtime
- **Pros:** Framework-agnostic, optimized for production inference, cross-platform (can run on Node.js)
- **Cons:** Not suitable for model development/training — only for inference, limited support for custom operations in fashion models, model conversion step required (PyTorch -> ONNX), smaller ecosystem for fashion-specific pre-trained models

## DATE
2026-05-25

## REVIEWERS
AI/ML Lead, CTO, Data Scientist
