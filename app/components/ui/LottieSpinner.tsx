import Lottie from 'lottie-react';
import animationData from '../../../public/jKEmx3IZrP.json';
import React from 'react';

interface LottieSpinnerProps {
  size?: number;
  className?: string;
}

export function LottieSpinner({ size = 96, className = '' }: LottieSpinnerProps) {
  return (
    <Lottie animationData={animationData} loop autoplay style={{ width: size, height: size }} className={className} />
  );
}
