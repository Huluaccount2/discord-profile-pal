
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="bg-red-900/90 backdrop-blur-xl border-red-700/50 p-6 shadow-2xl h-full">
          <div className="text-center text-white">
            <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
            <p className="text-red-200 mb-4">
              An error occurred while loading the component.
            </p>
            <details className="text-left">
              <summary className="cursor-pointer text-red-300">Error details</summary>
              <pre className="mt-2 text-xs text-red-200 overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try again
            </button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
