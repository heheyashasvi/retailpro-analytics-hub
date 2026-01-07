'use client'

import { useEffect, useState } from 'react'

interface AnimatedBackgroundProps {
  variant?: 'dashboard' | 'login' | 'subtle'
  className?: string
}

export function AnimatedBackground({ variant = 'dashboard', className = '' }: AnimatedBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={`fixed inset-0 -z-10 ${className}`} />
  }

  if (variant === 'login') {
    return (
      <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        
        {/* Animated business/analytics themed background */}
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center animate-slow-zoom"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        
        {/* Analytics chart pattern */}
        <div 
          className="absolute inset-0 opacity-15 bg-repeat animate-float-slow"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 80 L30 60 L50 70 L70 40 L90 50' stroke='%238b5cf6' stroke-width='2' fill='none' opacity='0.3'/%3E%3Ccircle cx='10' cy='80' r='3' fill='%236366f1' opacity='0.4'/%3E%3Ccircle cx='30' cy='60' r='3' fill='%238b5cf6' opacity='0.4'/%3E%3Ccircle cx='50' cy='70' r='3' fill='%236366f1' opacity='0.4'/%3E%3Ccircle cx='70' cy='40' r='3' fill='%238b5cf6' opacity='0.4'/%3E%3Ccircle cx='90' cy='50' r='3' fill='%236366f1' opacity='0.4'/%3E%3C/svg%3E")`
          }}
        />
        
        {/* Floating geometric shapes */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-10 animate-float"
              style={{
                left: `${10 + (i * 12)}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + Math.random() * 3}s`
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-400">
                {i % 3 === 0 && <rect x="3" y="3" width="18" height="18" rx="2" />}
                {i % 3 === 1 && <circle cx="12" cy="12" r="9" />}
                {i % 3 === 2 && <polygon points="12,2 22,20 2,20" />}
              </svg>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'dashboard') {
    return (
      <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-indigo-50" />
        
        {/* Business analytics background pattern */}
        <div 
          className="absolute inset-0 opacity-25 bg-cover bg-center animate-slow-pan"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='analytics' x='0' y='0' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Crect x='0' y='30' width='8' height='10' fill='%236366f1' opacity='0.3'/%3E%3Crect x='10' y='20' width='8' height='20' fill='%238b5cf6' opacity='0.3'/%3E%3Crect x='20' y='25' width='8' height='15' fill='%2306b6d4' opacity='0.3'/%3E%3Crect x='30' y='15' width='8' height='25' fill='%2310b981' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23analytics)'/%3E%3C/svg%3E")`
          }}
        />
        
        {/* E-commerce icons pattern */}
        <div 
          className="absolute inset-0 opacity-15 bg-repeat animate-drift"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%236366f1' stroke-width='1' opacity='0.4'%3E%3C!-- Shopping cart --%3E%3Cpath d='M20 20h8l2 12h20l3-12h8M30 50h20M25 55h5M45 55h5' stroke-linecap='round'/%3E%3C!-- Graph line --%3E%3Cpath d='M70 30 L80 25 L90 35 L100 20' stroke='%238b5cf6'/%3E%3Ccircle cx='70' cy='30' r='2' fill='%236366f1'/%3E%3Ccircle cx='80' cy='25' r='2' fill='%238b5cf6'/%3E%3Ccircle cx='90' cy='35' r='2' fill='%236366f1'/%3E%3Ccircle cx='100' cy='20' r='2' fill='%238b5cf6'/%3E%3C!-- Package --%3E%3Crect x='15' y='70' width='20' height='15' rx='2' stroke='%2306b6d4'/%3E%3Cpath d='M15 77 L35 77 M25 70 L25 85' stroke='%2306b6d4'/%3E%3C!-- Dollar sign --%3E%3Cpath d='M75 75 Q70 70 70 75 Q70 80 75 80 Q80 80 80 85 Q80 90 75 90 M75 65 L75 95' stroke='%2310b981' stroke-width='2'/%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        
        {/* Data visualization elements */}
        <div className="absolute inset-0 opacity-10">
          {/* Animated bars representing data */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 bg-gradient-to-t from-indigo-400 to-transparent animate-data-pulse"
              style={{
                left: `${10 + (i * 7)}%`,
                bottom: '15%',
                height: `${30 + Math.random() * 50}px`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
          
          {/* Circular progress indicators */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`circle-${i}`}
              className="absolute animate-spin-slow opacity-20"
              style={{
                right: `${5 + (i * 15)}%`,
                top: `${10 + (i * 12)}%`,
                animationDuration: `${15 + i * 5}s`
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="15"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeDasharray="60 30"
                  opacity="0.3"
                />
              </svg>
            </div>
          ))}
        </div>
        
        {/* Network connection lines */}
        <div className="absolute inset-0 opacity-8">
          <svg width="100%" height="100%" className="animate-pulse-slow">
            <defs>
              <pattern id="network" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <line x1="0" y1="50" x2="100" y2="50" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.3" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="#6366f1" strokeWidth="0.5" opacity="0.3" />
                <circle cx="50" cy="50" r="2" fill="#06b6d4" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#network)" />
          </svg>
        </div>
      </div>
    )
  }

  // Subtle variant for other pages
  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-indigo-50" />
      <div 
        className="absolute inset-0 opacity-10 bg-repeat animate-drift-slow"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' opacity='0.2'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Cpath d='M20 20 L40 20 L40 40 L20 40 Z' fill='none' stroke='%236366f1' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
    </div>
  )
}