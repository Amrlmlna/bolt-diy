import React from 'react';
import { LottieSpinner } from './LottieSpinner';

interface LoadingWrapperProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  size?: number;
  className?: string;
}

export function LoadingWrapper({
  isLoading,
  message = 'Loading...',
  children,
  size = 48,
  className = '',
}: LoadingWrapperProps) {
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full w-full ${className}`}>
        <LottieSpinner size={size} />
        <p className="mt-4 text-gray-400 text-sm">{message}</p>
      </div>
    );
  }

  return <>{children}</>;
}

// Full screen loading component
export function FullScreenLoading({
  message = 'Loading BIT Studio...',
  subtitle = 'Preparing your development environment...',
}: {
  message?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        <LottieSpinner size={96} />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-500 mb-2">{message}</h1>
          <p className="text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
