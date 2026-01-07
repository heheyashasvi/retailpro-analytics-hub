import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { authService } from '@/services/auth'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BusinessBackground } from '@/components/ui/business-background'

export default async function LoginPage() {
  // Check if user is already logged in
  const cookieStore = cookies()
  const token = cookieStore.get('admin-token')?.value

  if (token) {
    const user = await authService.verifySession(token)
    if (user) {
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <BusinessBackground variant="login" />
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            RetailPro Analytics Hub
          </h1>
          <p className="text-gray-600">
            Advanced Business Intelligence Platform
          </p>
        </div>

        <Card className="shadow-xl border-0 glass">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-white">Analytics Access</CardTitle>
            <CardDescription className="text-indigo-100">
              Enter your credentials to access the intelligence platform
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 bg-white bg-opacity-90 backdrop-blur-sm">
            <Suspense fallback={<div>Loading...</div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-700 bg-white bg-opacity-80 backdrop-blur-sm rounded-lg p-4 glass">
          <p className="font-medium text-gray-800">Demo Access:</p>
          <p className="font-mono text-indigo-600">admin@ecommerce.com / admin123456</p>
        </div>
      </div>
    </div>
  )
}