import React from 'react';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'primary' | 'secondary' | 'white' | 'gray';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3 border-2',
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

const variantClasses: Record<SpinnerVariant, string> = {
  primary: 'border-primary border-t-transparent',
  secondary: 'border-secondary border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-400 border-t-transparent',
};

export default function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  className = '',
  label,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <p className="text-sm text-gray-600 font-medium">{label}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Preset loading components for common use cases
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" label={label || 'Loading...'} />
    </div>
  );
}

export function InlineLoader({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <LoadingSpinner size="sm" label={label} />
    </div>
  );
}

export function ButtonLoader() {
  return (
    <LoadingSpinner size="xs" variant="white" className="inline-block" />
  );
}

export function FullScreenLoader({ label }: { label?: string }) {
  return <LoadingSpinner size="xl" label={label} fullScreen />;
}


