'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2 opacity-80" />
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">Ocurrió un error al cargar esta sección</h3>
          <p className="text-xs text-red-600 dark:text-red-500 mt-1 opacity-80">Por favor, recarga la página o intenta más tarde.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
