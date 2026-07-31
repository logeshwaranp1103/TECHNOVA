import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Something went wrong</h1>
          <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
            An unexpected error occurred in the application. Please reload the portal.
          </p>
          <div className="mt-6">
            <Button
              variant="accent"
              size="md"
              leftIcon={<RefreshCw className="w-4 h-4 text-slate-950" />}
              onClick={() => window.location.reload()}
            >
              Reload Portal
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
