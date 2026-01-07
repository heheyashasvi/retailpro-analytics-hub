import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { authService } from '@/services/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Shield, Settings, Plus } from 'lucide-react'

export default async function AdminManagementPage() {
  // Get token from cookies
  const cookieStore = cookies()
  const token = cookieStore.get('admin-token')?.value

  if (!token) {
    redirect('/login')
  }

  // Verify session and check if user is super admin
  const user = await authService.verifySession(token)
  
  if (!user || user.role !== 'super_admin') {
    redirect('/dashboard')
  }

  // For now, we'll show a placeholder. In a real app, you'd fetch admin users from the database
  const adminUsers = [
    {
      id: '1',
      name: 'Ishaan Arora',
      email: 'ishaan@example.com',
      role: 'super_admin',
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date('2024-01-07')
    },
    {
      id: '2', 
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      createdAt: new Date('2024-01-02'),
      lastLogin: new Date('2024-01-06')
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
          <p className="text-muted-foreground">
            Manage administrator accounts and permissions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              {adminUsers.filter(u => u.role === 'super_admin').length} super admins
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Current active sessions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Level</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">High</div>
            <p className="text-xs text-muted-foreground">
              All security features enabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Administrator Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {adminUsers.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{admin.name}</h3>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                    <p className="text-xs text-gray-500">
                      Created: {admin.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-xs text-gray-500">
                      {admin.lastLogin.toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Require 2FA for all admin accounts</p>
              </div>
              <Badge variant="outline">Recommended</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Session Timeout</h4>
                <p className="text-sm text-gray-600">Automatically log out inactive sessions</p>
              </div>
              <Badge variant="secondary">24 hours</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Password Policy</h4>
                <p className="text-sm text-gray-600">Enforce strong password requirements</p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}