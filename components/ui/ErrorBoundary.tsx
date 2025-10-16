import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorState from './ErrorState';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console with full context
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // In production, you could send this to an error tracking service
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary when resetOnPropsChange changes
    if (
      this.props.resetOnPropsChange !== undefined &&
      this.props.resetOnPropsChange !== prevProps.resetOnPropsChange &&
      this.state.hasError
    ) {
      this.resetError();
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Prevent infinite error loops - if error count exceeds 3, show persistent error
      const showRetry = this.state.errorCount < 3;

      return (
        <ErrorState
          type="general"
          title="Something went wrong"
          message={
            showRetry
              ? this.state.error.message || 'An unexpected error occurred. Please try refreshing the page.'
              : 'Multiple errors detected. Please refresh the page or contact support if the problem persists.'
          }
          onRetry={showRetry ? this.resetError : undefined}
          retryLabel="Try again"
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Functional wrapper for easier use with hooks
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}


