'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, BarChart3, Users, Package, Settings } from 'lucide-react'

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: Package, label: 'Add Product', href: '/dashboard/products/new' },
    { icon: Users, label: 'User Mgmt', href: '/dashboard/admin' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons */}
      <div className={`flex flex-col space-y-3 mb-4 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {actions.map((action, index) => (
          <div
            key={action.label}
            className="flex items-center space-x-3"
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <span className="bg-gray-800 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg">
              {action.label}
            </span>
            <Button
              size="sm"
              className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 animate-bounce"
              onClick={() => window.location.href = action.href}
            >
              <action.icon className="w-5 h-5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="lg"
        className={`w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'} animate-pulse-glow`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className="w-8 h-8" />
      </Button>
    </div>
  )
}