import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { authService } from '@/services/auth'
import { QueryProvider } from '@/components/providers/query-provider'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { BusinessBackground } from '@/components/ui/business-background'
import { FloatingActionButton } from '@/components/ui/floating-action-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get token from cookies
  const cookieStore = cookies()
  const token = cookieStore.get('admin-token')?.value

  if (!token) {
    redirect('/login')
  }

  // Verify session
  const user = await authService.verifySession(token)
  
  if (!user) {
    redirect('/login')
  }

  return (
    <QueryProvider>
      <div className="min-h-screen relative">
        <BusinessBackground variant="dashboard" />
        <DashboardNav user={user} />
        <main className="py-6 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <FloatingActionButton />
      </div>
    </QueryProvider>
  )
}