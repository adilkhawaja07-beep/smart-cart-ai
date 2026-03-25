import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderClassName?: string;
  onError?: () => void;
}

/**
 * OptimizedImage Component
 * 
 * Features:
 * - Blur-up skeleton effect while loading
 * - Smooth fade-in transition
 * - Fallback placeholder on error
 * - Lazy loading and async decoding
 * - CDN optimizations (width, quality, format)
 * 
 * Usage:
 * <OptimizedImage
 *   src="https://cdn.../image.jpg?width=400&quality=75&format=webp"
 *   alt="Product name"
 *   className="h-full w-full object-cover"
 * />
 */

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = 'h-full w-full object-cover',
  placeholderClassName = 'bg-muted',
  onError,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  if (imageError) {
    return (
      <div
        className={cn('animate-pulse', placeholderClassName, className)}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <div className="relative overflow-hidden bg-muted">
      {/* Skeleton loader (shown while image loads) */}
      {!isLoaded && (
        <div
          className={cn(
            'absolute inset-0 animate-pulse',
            placeholderClassName
          )}
          aria-hidden="true"
        />
      )}

      {/* Main image with fade-in transition */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
      />
    </div>
  );
};
