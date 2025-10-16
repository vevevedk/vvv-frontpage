import React from 'react';
import { 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  SignalSlashIcon,
  LockClosedIcon 
} from '@heroicons/react/24/outline';

type ErrorType = 'general' | 'network' | 'forbidden' | 'notfound' | 'server';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  showIcon?: boolean;
  className?: string;
}

const errorConfig: Record<ErrorType, {
  icon: any;
  defaultTitle: string;
  defaultMessage: string;
  iconColor: string;
}> = {
  general: {
    icon: ExclamationTriangleIcon,
    defaultTitle: 'Something went wrong',
    defaultMessage: 'An unexpected error occurred. Please try again.',
    iconColor: 'text-yellow-500',
  },
  network: {
    icon: SignalSlashIcon,
    defaultTitle: 'Connection error',
    defaultMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
    iconColor: 'text-red-500',
  },
  forbidden: {
    icon: LockClosedIcon,
    defaultTitle: 'Access denied',
    defaultMessage: 'You do not have permission to access this resource.',
    iconColor: 'text-red-500',
  },
  notfound: {
    icon: XCircleIcon,
    defaultTitle: 'Not found',
    defaultMessage: 'The requested resource could not be found.',
    iconColor: 'text-gray-500',
  },
  server: {
    icon: XCircleIcon,
    defaultTitle: 'Server error',
    defaultMessage: 'The server encountered an error. Please try again later.',
    iconColor: 'text-red-500',
  },
};

export default function ErrorState({
  type = 'general',
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
  showIcon = true,
  className = '',
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {showIcon && (
        <div className="mb-4">
          <Icon className={`h-16 w-16 ${config.iconColor}`} />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || config.defaultTitle}
      </h3>
      
      <p className="text-sm text-gray-600 max-w-md mb-6">
        {message || config.defaultMessage}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

// Compact error message for inline use
export function InlineError({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-3">
      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-700">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-medium text-red-800 hover:text-red-900 underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// Full page error
export function FullPageError({
  type = 'general',
  title,
  message,
  onRetry,
}: Omit<ErrorStateProps, 'className'>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <ErrorState
        type={type}
        title={title}
        message={message}
        onRetry={onRetry}
        className="bg-white rounded-lg shadow-lg p-8 max-w-lg"
      />
    </div>
  );
}


