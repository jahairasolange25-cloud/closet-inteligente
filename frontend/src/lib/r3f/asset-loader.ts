/**
 * Asset loading contracts for the R3F rendering module.
 *
 * These interfaces define the stable contract between the rendering layer
 * and future asset pipelines (GLTF, textures). Stub implementations are
 * provided — replace with real loaders when the AI service produces assets.
 */

export interface GLTFLoadResult {
  url: string;
  /** Base64 or object URL of the loaded model */
  blob: string;
  metadata: {
    triangleCount: number;
    hasSkeleton: boolean;
  };
}

export interface TextureLoadResult {
  url: string;
  width: number;
  height: number;
}

export type AssetLoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface AssetLoadError {
  url: string;
  reason: string;
  retryable: boolean;
}

export interface GLTFLoader {
  load(url: string, signal?: AbortSignal): Promise<GLTFLoadResult>;
}

export interface TextureLoader {
  load(url: string, signal?: AbortSignal): Promise<TextureLoadResult>;
}

// Stub implementations — replace when real assets are available

export class StubGLTFLoader implements GLTFLoader {
  async load(url: string, signal?: AbortSignal): Promise<GLTFLoadResult> {
    // Simulate network delay
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, 300);
      signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); });
    });
    return {
      url,
      blob: '',
      metadata: { triangleCount: 0, hasSkeleton: false },
    };
  }
}

export class StubTextureLoader implements TextureLoader {
  async load(url: string, signal?: AbortSignal): Promise<TextureLoadResult> {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, 100);
      signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); });
    });
    return { url, width: 512, height: 512 };
  }
}
