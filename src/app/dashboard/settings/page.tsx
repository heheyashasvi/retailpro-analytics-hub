import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { authService } from '@/services/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  Store, 
  Mail, 
  Bell, 
  Shield, 
  Database,
  Palette,
  Globe
} from 'lucide-react'

export default async function SettingsPage() {
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Store Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" defaultValue="My Ecommerce Store" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-description">Description</Label>
              <Textarea 
                id="store-description" 
                defaultValue="A modern ecommerce platform for all your shopping needs"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-email">Contact Email</Label>
              <Input id="store-email" type="email" defaultValue="contact@store.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-phone">Phone Number</Label>
              <Input id="store-phone" defaultValue="+1 (555) 123-4567" />
            </div>
            <Button>Save Store Settings</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">Receive email alerts for important events</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-gray-600">Get notified when products are low in stock</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>New Order Notifications</Label>
                <p className="text-sm text-gray-600">Receive alerts for new customer orders</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>System Updates</Label>
                <p className="text-sm text-gray-600">Get notified about system maintenance</p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
            <Button>Save Notification Settings</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-600">Add an extra layer of security</p>
              </div>
              <Badge variant="outline">Not Enabled</Badge>
            </div>
            <Button>Update Password</Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select 
                id="timezone" 
                className="w-full p-2 border border-gray-300 rounded-md"
                defaultValue="UTC"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <select 
                id="currency" 
                className="w-full p-2 border border-gray-300 rounded-md"
                defaultValue="USD"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-gray-600">Temporarily disable the store</p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Debug Mode</Label>
                <p className="text-sm text-gray-600">Enable detailed error logging</p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
            <Button>Save System Settings</Button>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database & Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Database Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant="default">Connected</Badge>
                <span className="text-sm text-gray-600">SQLite Database</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Last Backup</Label>
              <p className="text-sm text-gray-600">January 7, 2026 at 2:30 PM</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Automatic Backups</Label>
                <p className="text-sm text-gray-600">Daily database backups</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Create Backup Now
              </Button>
              <Button variant="outline" className="w-full">
                Download Database
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md"
                defaultValue="light"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded border-2 border-blue-600"></div>
                <div className="w-8 h-8 bg-green-600 rounded border-2 border-transparent hover:border-gray-300"></div>
                <div className="w-8 h-8 bg-purple-600 rounded border-2 border-transparent hover:border-gray-300"></div>
                <div className="w-8 h-8 bg-red-600 rounded border-2 border-transparent hover:border-gray-300"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Compact Mode</Label>
                <p className="text-sm text-gray-600">Reduce spacing for more content</p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
            <Button>Save Appearance Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}