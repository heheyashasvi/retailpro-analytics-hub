import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Package, 
  Shield, 
  Zap,
  Database,
  Cloud,
  ArrowRight,
  LogIn
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">E-commerce Admin</h1>
          </div>
          <Link href="/login">
            <Button className="flex items-center space-x-2">
              <LogIn className="h-4 w-4" />
              <span>Admin Login</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4">
            Server-Side Rendered Dashboard
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Professional E-commerce
            <span className="text-blue-600"> Admin Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A comprehensive, secure, and high-performance admin interface for managing your e-commerce operations. 
            Built with Next.js 14, TypeScript, and modern web technologies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="flex items-center space-x-2">
                <LogIn className="h-5 w-5" />
                <span>Access Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your e-commerce business efficiently and securely
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Package className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Product Management</CardTitle>
              <CardDescription>
                Complete CRUD operations for products with image upload, inventory tracking, and batch operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-step product creation forms</li>
                <li>• Cloudinary image optimization</li>
                <li>• Real-time inventory tracking</li>
                <li>• Bulk product operations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Data Visualization</CardTitle>
              <CardDescription>
                Interactive charts and metrics to track sales performance and inventory levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time sales analytics</li>
                <li>• Stock level monitoring</li>
                <li>• Revenue tracking charts</li>
                <li>• Performance insights</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Admin Management</CardTitle>
              <CardDescription>
                Secure user authentication with role-based access control and admin account management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• JWT-based authentication</li>
                <li>• Role-based permissions</li>
                <li>• Secure password hashing</li>
                <li>• Session management</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-10 w-10 text-red-600 mb-2" />
              <CardTitle>Security First</CardTitle>
              <CardDescription>
                Enterprise-grade security with CSRF protection, rate limiting, and input sanitization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• CSRF token protection</li>
                <li>• Rate limiting middleware</li>
                <li>• Input sanitization</li>
                <li>• Security headers</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-10 w-10 text-yellow-600 mb-2" />
              <CardTitle>High Performance</CardTitle>
              <CardDescription>
                Server-side rendering, optimized images, and efficient caching for lightning-fast performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Next.js 14 App Router</li>
                <li>• Server-side rendering</li>
                <li>• Image optimization</li>
                <li>• React Query caching</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Database className="h-10 w-10 text-indigo-600 mb-2" />
              <CardTitle>Robust Database</CardTitle>
              <CardDescription>
                Prisma ORM with SQLite for development and PostgreSQL-ready for production scaling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Prisma ORM integration</li>
                <li>• Type-safe database queries</li>
                <li>• Migration management</li>
                <li>• Database seeding</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built with Modern Technologies</h2>
            <p className="text-gray-600">
              Leveraging the latest and most reliable technologies for optimal performance and maintainability
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mb-2 mx-auto">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <p className="text-sm font-medium">Next.js 14</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <span className="text-white font-bold text-xl">TS</span>
              </div>
              <p className="text-sm font-medium">TypeScript</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <span className="text-white font-bold text-xl">TW</span>
              </div>
              <p className="text-sm font-medium">Tailwind CSS</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <p className="text-sm font-medium">Prisma ORM</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <Cloud className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm font-medium">Cloudinary</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <span className="text-white font-bold text-xl">RQ</span>
              </div>
              <p className="text-sm font-medium">React Query</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Manage Your E-commerce Business?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Access the admin dashboard to start managing your products, tracking sales, and growing your business.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="flex items-center space-x-2 mx-auto">
              <LogIn className="h-5 w-5" />
              <span>Access Admin Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <ShoppingCart className="h-6 w-6" />
            <span className="text-lg font-semibold">E-commerce Admin Dashboard</span>
          </div>
          <p className="text-gray-400 text-sm">
            Built with Next.js 14, TypeScript, and modern web technologies for optimal performance and security.
          </p>
        </div>
      </footer>
    </div>
  )
}