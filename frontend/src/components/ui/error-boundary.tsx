'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center" role="alert">
          <AlertTriangle className="h-12 w-12 text-error-400" aria-hidden />
          <div>
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
              Algo salió mal
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              {this.state.error?.message ?? 'Error inesperado'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => this.reset()}>
            Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
