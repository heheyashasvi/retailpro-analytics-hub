'use client'

import Image from 'next/image'
import { useState } from 'react'
import { LoadingSpinner } from './loading-spinner'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  fill?: boolean
  quality?: number
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
  fill = false,
  quality = 75,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Generate optimized Cloudinary URL if it's a Cloudinary image
  const getOptimizedSrc = (originalSrc: string, width?: number, height?: number) => {
    if (originalSrc.includes('cloudinary.com')) {
      // Extract the base URL and add optimization parameters
      const parts = originalSrc.split('/upload/')
      if (parts.length === 2) {
        const transformations = []
        
        if (width && height) {
          transformations.push(`w_${width},h_${height},c_fill`)
        } else if (width) {
          transformations.push(`w_${width}`)
        } else if (height) {
          transformations.push(`h_${height}`)
        }
        
        transformations.push(`q_${quality}`, 'f_auto')
        
        return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`
      }
    }
    
    return originalSrc
  }

  const optimizedSrc = getOptimizedSrc(src, width, height)

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
     {isLoading && (
  <LoadingSpinner
    className={`absolute inset-0 ${fill ? 'w-full h-full' : `w-[${width}px] h-[${height}px]`}`}
  />
)}

      <Image
        src={optimizedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        quality={quality}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        {...props}
      />
    </div>
  )
}

// Preset components for common use cases
export function ProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={300}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}

export function ProductThumbnail({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={80}
      height={80}
      className={className}
      quality={60}
    />
  )
}

export function HeroImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority
      className={className}
      sizes="100vw"
      quality={85}
    />
  )

}
