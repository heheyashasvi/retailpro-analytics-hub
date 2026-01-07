'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

// Define the AdminUser type locally to avoid import issues
interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'super_admin'
  createdAt: Date
}

interface DashboardNavProps {
  user: AdminUser
}

export function DashboardNav({ user }: DashboardNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails on server, redirect to main page
      router.push('/')
      router.refresh()
    }
  }

  const navigation = [
    { name: 'Analytics Hub', href: '/dashboard' },
    { name: 'Product Catalog', href: '/dashboard/products' },
    { name: 'Sales Intelligence', href: '/dashboard/analytics' },
    { name: 'Inventory Insights', href: '/dashboard/inventory' },
    ...(user.role === 'super_admin' ? [
      { name: 'User Management', href: '/dashboard/admin' },
      { name: 'System Settings', href: '/dashboard/settings' },
    ] : []),
  ]

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return <div className="h-16 bg-white shadow-sm border-b" />
  }

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-white hover:text-indigo-100 transition-all duration-300 hover:scale-105">
                RetailPro Analytics
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-indigo-100 hover:text-white hover:border-indigo-300 border-b-2 border-transparent transition-all duration-300 hover:scale-105"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <div className="text-sm text-white">
              Welcome, <span className="font-medium">{user.name}</span>
              <span className="ml-2 px-2 py-1 text-xs bg-white bg-opacity-20 text-white rounded-full">
                {user.role === 'super_admin' ? 'System Admin' : 'Analyst'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center bg-white bg-opacity-10 text-white border-white border-opacity-30 hover:bg-white hover:bg-opacity-20"
            >
              Logout
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-indigo-100 hover:text-white hover:bg-white hover:bg-opacity-10"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="text-sm text-gray-700">
                {user.name} ({user.role})
              </div>
            </div>
            <div className="mt-3 px-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full flex items-center justify-center"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}