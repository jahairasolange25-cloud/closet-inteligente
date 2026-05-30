'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Box } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class R3FErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[R3FErrorBoundary] WebGL/R3F crash:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-8 text-center aspect-[3/4] w-full max-w-sm mx-auto"
          role="alert"
        >
          <Box className="h-10 w-10 text-neutral-400" aria-hidden />
          <p className="text-sm text-neutral-500">
            El renderizado 3D no está disponible
          </p>
          <p className="text-xs text-neutral-400">
            {this.state.error?.message ?? 'Error de WebGL'}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
