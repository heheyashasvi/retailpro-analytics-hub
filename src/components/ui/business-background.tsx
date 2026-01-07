'use client'

import { useEffect, useState } from 'react'

interface BusinessBackgroundProps {
  variant?: 'dashboard' | 'login'
  className?: string
}

export function BusinessBackground({ variant = 'dashboard', className = '' }: BusinessBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={`fixed inset-0 -z-10 ${className}`} />
  }

  if (variant === 'dashboard') {
    return (
      <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-indigo-50" />
        
        {/* Business analytics illustration background */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="animate-slow-pan">
            <defs>
              <pattern id="businessPattern" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
                {/* Analytics dashboard mockup */}
                <rect x="20" y="20" width="260" height="180" rx="8" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.3"/>
                
                {/* Chart bars */}
                <rect x="40" y="140" width="15" height="40" fill="#6366f1" opacity="0.4"/>
                <rect x="60" y="120" width="15" height="60" fill="#8b5cf6" opacity="0.4"/>
                <rect x="80" y="130" width="15" height="50" fill="#06b6d4" opacity="0.4"/>
                <rect x="100" y="110" width="15" height="70" fill="#10b981" opacity="0.4"/>
                <rect x="120" y="125" width="15" height="55" fill="#f59e0b" opacity="0.4"/>
                
                {/* Line chart */}
                <polyline points="150,160 170,140 190,150 210,120 230,130 250,110" 
                         fill="none" stroke="#8b5cf6" strokeWidth="3" opacity="0.5"/>
                <circle cx="150" cy="160" r="3" fill="#8b5cf6" opacity="0.6"/>
                <circle cx="170" cy="140" r="3" fill="#8b5cf6" opacity="0.6"/>
                <circle cx="190" cy="150" r="3" fill="#8b5cf6" opacity="0.6"/>
                <circle cx="210" cy="120" r="3" fill="#8b5cf6" opacity="0.6"/>
                <circle cx="230" cy="130" r="3" fill="#8b5cf6" opacity="0.6"/>
                <circle cx="250" cy="110" r="3" fill="#8b5cf6" opacity="0.6"/>
                
                {/* Pie chart */}
                <circle cx="200" cy="80" r="25" fill="none" stroke="#6366f1" strokeWidth="3" opacity="0.3"/>
                <path d="M 200 55 A 25 25 0 0 1 218 95 L 200 80 Z" fill="#6366f1" opacity="0.4"/>
                <path d="M 218 95 A 25 25 0 0 1 182 95 L 200 80 Z" fill="#8b5cf6" opacity="0.4"/>
                <path d="M 182 95 A 25 25 0 0 1 200 55 L 200 80 Z" fill="#06b6d4" opacity="0.4"/>
                
                {/* Shopping cart icon */}
                <path d="M50 240 L60 240 L62 250 L75 250 L77 240 L85 240" 
                      fill="none" stroke="#10b981" strokeWidth="2" opacity="0.4"/>
                <circle cx="65" cy="260" r="3" fill="#10b981" opacity="0.4"/>
                <circle cx="75" cy="260" r="3" fill="#10b981" opacity="0.4"/>
                
                {/* Dollar signs */}
                <text x="120" y="250" fontSize="20" fill="#f59e0b" opacity="0.4" fontFamily="Arial">$</text>
                <text x="140" y="270" fontSize="16" fill="#f59e0b" opacity="0.3" fontFamily="Arial">$</text>
                <text x="160" y="260" fontSize="18" fill="#f59e0b" opacity="0.4" fontFamily="Arial">$</text>
                
                {/* Package/inventory icons */}
                <rect x="200" y="230" width="20" height="15" rx="2" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.4"/>
                <line x1="200" y1="237" x2="220" y2="237" stroke="#06b6d4" strokeWidth="1" opacity="0.4"/>
                <line x1="210" y1="230" x2="210" y2="245" stroke="#06b6d4" strokeWidth="1" opacity="0.4"/>
                
                {/* Network/connection lines */}
                <line x1="50" y1="50" x2="100" y2="80" stroke="#8b5cf6" strokeWidth="1" opacity="0.2"/>
                <line x1="100" y1="80" x2="150" y2="60" stroke="#8b5cf6" strokeWidth="1" opacity="0.2"/>
                <line x1="150" y1="60" x2="200" y2="90" stroke="#8b5cf6" strokeWidth="1" opacity="0.2"/>
                <line x1="200" y1="90" x2="250" y2="70" stroke="#8b5cf6" strokeWidth="1" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#businessPattern)" />
          </svg>
        </div>
        
        {/* Floating data elements */}
        <div className="absolute inset-0 opacity-15">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${15 + (i * 12)}%`,
                top: `${10 + (i * 8)}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${6 + Math.random() * 4}s`
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40">
                {i % 4 === 0 && (
                  // Bar chart mini
                  <g>
                    <rect x="5" y="25" width="4" height="10" fill="#6366f1" opacity="0.6"/>
                    <rect x="12" y="20" width="4" height="15" fill="#8b5cf6" opacity="0.6"/>
                    <rect x="19" y="22" width="4" height="13" fill="#06b6d4" opacity="0.6"/>
                    <rect x="26" y="18" width="4" height="17" fill="#10b981" opacity="0.6"/>
                  </g>
                )}
                {i % 4 === 1 && (
                  // Trending arrow
                  <path d="M5 25 L15 15 L25 20 L35 10" stroke="#10b981" strokeWidth="2" fill="none" opacity="0.6"/>
                )}
                {i % 4 === 2 && (
                  // Pie chart segment
                  <g>
                    <circle cx="20" cy="20" r="12" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.4"/>
                    <path d="M 20 8 A 12 12 0 0 1 28 26 L 20 20 Z" fill="#8b5cf6" opacity="0.5"/>
                  </g>
                )}
                {i % 4 === 3 && (
                  // Shopping bag
                  <g>
                    <rect x="10" y="15" width="20" height="18" rx="2" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.5"/>
                    <path d="M15 15 C15 12 17 10 20 10 C23 10 25 12 25 15" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.5"/>
                  </g>
                )}
              </svg>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Login variant
  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
      
      {/* Business/analytics themed background */}
      <div className="absolute inset-0 opacity-15">
        <svg width="100%" height="100%" className="animate-drift-slow">
          <defs>
            <pattern id="loginPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              {/* Analytics dashboard elements */}
              <rect x="20" y="20" width="160" height="100" rx="5" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.4"/>
              
              {/* Mini chart */}
              <rect x="30" y="80" width="8" height="25" fill="#6366f1" opacity="0.3"/>
              <rect x="42" y="70" width="8" height="35" fill="#8b5cf6" opacity="0.3"/>
              <rect x="54" y="75" width="8" height="30" fill="#06b6d4" opacity="0.3"/>
              <rect x="66" y="65" width="8" height="40" fill="#10b981" opacity="0.3"/>
              
              {/* Line graph */}
              <polyline points="90,90 110,80 130,85 150,70 170,75" 
                       fill="none" stroke="#8b5cf6" strokeWidth="2" opacity="0.4"/>
              
              {/* Business icons scattered */}
              <circle cx="50" cy="150" r="8" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.3"/>
              <text x="46" y="155" fontSize="10" fill="#f59e0b" opacity="0.4">$</text>
              
              <rect x="120" y="140" width="12" height="10" rx="1" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3"/>
              <line x1="120" y1="145" x2="132" y2="145" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loginPattern)" />
        </svg>
      </div>
      
      {/* Subtle floating elements */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-slow"
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${15 + (i * 12)}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          >
            <svg width="30" height="30" viewBox="0 0 30 30">
              <circle cx="15" cy="15" r="10" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.4"/>
              <path d="M 15 5 A 10 10 0 0 1 22 18 L 15 15 Z" fill="#8b5cf6" opacity="0.3"/>
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}