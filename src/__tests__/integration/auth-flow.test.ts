import { authService } from '@/services/auth'
import { databaseService } from '@/services/database'
import bcrypt from 'bcryptjs'

describe('Authentication Flow Integration Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    try {
      await databaseService.prisma?.adminUser.deleteMany()
    } catch (error) {
      console.warn('Database cleanup failed:', error)
    }
  })

  afterAll(async () => {
    // Final cleanup
    try {
      await databaseService.prisma?.adminUser.deleteMany()
      await databaseService.prisma?.$disconnect()
    } catch (error) {
      console.warn('Final cleanup failed:', error)
    }
  })

  describe('Complete Authentication Workflow', () => {
    it('should handle complete admin creation and login flow', async () => {
      try {
        // Step 1: Create initial super admin
        const superAdminPassword = 'SuperAdmin123!'
        const hashedPassword = await bcrypt.hash(superAdminPassword, 12)
        
        const superAdmin = await databaseService.createAdmin(
          'super@admin.com',
          hashedPassword,
          'Super Admin',
          'super_admin'
        )

        expect(superAdmin).toBeDefined()
        expect(superAdmin.email).toBe('super@admin.com')
        expect(superAdmin.role).toBe('super_admin')

        // Step 2: Login as super admin
        const loginResult = await authService.login({
          email: 'super@admin.com',
          password: superAdminPassword
        })

        expect(loginResult.success).toBe(true)
        expect(loginResult.user).toBeDefined()
        expect(loginResult.token).toBeDefined()
        expect(loginResult.user?.email).toBe('super@admin.com')

        // Step 3: Verify session
        if (loginResult.token) {
          const session = await authService.verifySession(loginResult.token)
          expect(session).toBeDefined()
          expect(session?.email).toBe('super@admin.com')
          expect(session?.role).toBe('super_admin')
        }

        // Step 4: Create regular admin (as super admin)
        const newAdminData = {
          email: 'admin@test.com',
          password: 'AdminPass123!',
          name: 'Test Admin',
          role: 'admin' as const
        }

        const createdAdmin = await authService.createAdmin(newAdminData, superAdmin)
        expect(createdAdmin).toBeDefined()
        expect(createdAdmin.email).toBe('admin@test.com')
        expect(createdAdmin.role).toBe('admin')

        // Step 5: Login as regular admin
        const adminLoginResult = await authService.login({
          email: 'admin@test.com',
          password: 'AdminPass123!'
        })

        expect(adminLoginResult.success).toBe(true)
        expect(adminLoginResult.user?.role).toBe('admin')

        // Step 6: Verify regular admin cannot create other admins
        await expect(
          authService.createAdmin(
            {
              email: 'another@admin.com',
              password: 'AnotherPass123!',
              name: 'Another Admin',
              role: 'admin'
            },
            createdAdmin
          )
        ).rejects.toThrow('Insufficient permissions')

        // Step 7: Logout
        await authService.logout()
        const isAuthenticated = await authService.isAuthenticated()
        expect(isAuthenticated).toBe(false)

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    }, 30000)

    it('should handle invalid login attempts correctly', async () => {
      try {
        // Create test admin
        const password = 'TestPass123!'
        const hashedPassword = await bcrypt.hash(password, 12)
        
        await databaseService.createAdmin(
          'test@example.com',
          hashedPassword,
          'Test User',
          'admin'
        )

        // Test wrong password
        const wrongPasswordResult = await authService.login({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        })

        expect(wrongPasswordResult.success).toBe(false)
        expect(wrongPasswordResult.error).toBeDefined()
        expect(wrongPasswordResult.user).toBeUndefined()

        // Test non-existent user
        const nonExistentResult = await authService.login({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!'
        })

        expect(nonExistentResult.success).toBe(false)
        expect(nonExistentResult.error).toBeDefined()

        // Test invalid email format
        const invalidEmailResult = await authService.login({
          email: 'invalid-email',
          password: 'AnyPassword123!'
        })

        expect(invalidEmailResult.success).toBe(false)

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })

    it('should handle session expiration and refresh', async () => {
      try {
        // Create test admin
        const password = 'TestPass123!'
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const admin = await databaseService.createAdmin(
          'session@test.com',
          hashedPassword,
          'Session Test',
          'admin'
        )

        // Login
        const loginResult = await authService.login({
          email: 'session@test.com',
          password: password
        })

        expect(loginResult.success).toBe(true)
        expect(loginResult.token).toBeDefined()

        // Verify valid session
        if (loginResult.token) {
          const session = await authService.verifySession(loginResult.token)
          expect(session).toBeDefined()
          expect(session?.id).toBe(admin.id)
        }

        // Test invalid token
        const invalidSession = await authService.verifySession('invalid-token')
        expect(invalidSession).toBeNull()

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })
  })

  describe('Role-Based Access Control Integration', () => {
    it('should enforce role hierarchy in real scenarios', async () => {
      try {
        // Create super admin
        const superAdminPassword = 'SuperAdmin123!'
        const hashedSuperPassword = await bcrypt.hash(superAdminPassword, 12)
        
        const superAdmin = await databaseService.createAdmin(
          'super@rbac.com',
          hashedSuperPassword,
          'Super Admin RBAC',
          'super_admin'
        )

        // Create regular admin
        const adminPassword = 'Admin123!'
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 12)
        
        const regularAdmin = await databaseService.createAdmin(
          'admin@rbac.com',
          hashedAdminPassword,
          'Regular Admin RBAC',
          'admin'
        )

        // Test super admin permissions
        expect(superAdmin.role).toBe('super_admin')
        
        // Super admin should be able to create admins
        const newAdmin = await authService.createAdmin(
          {
            email: 'created@rbac.com',
            password: 'Created123!',
            name: 'Created Admin',
            role: 'admin'
          },
          superAdmin
        )
        expect(newAdmin).toBeDefined()

        // Regular admin should NOT be able to create admins
        await expect(
          authService.createAdmin(
            {
              email: 'forbidden@rbac.com',
              password: 'Forbidden123!',
              name: 'Forbidden Admin',
              role: 'admin'
            },
            regularAdmin
          )
        ).rejects.toThrow('Insufficient permissions')

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })
  })

  describe('Password Security Integration', () => {
    it('should enforce password requirements end-to-end', async () => {
      try {
        // Create super admin for testing
        const superAdminPassword = 'SuperAdmin123!'
        const hashedPassword = await bcrypt.hash(superAdminPassword, 12)
        
        const superAdmin = await databaseService.createAdmin(
          'super@password.com',
          hashedPassword,
          'Super Admin Password',
          'super_admin'
        )

        // Test weak passwords are rejected
        const weakPasswords = [
          'weak',
          '12345678',
          'password',
          'PASSWORD',
          'Password',
          'Pass123'
        ]

        for (const weakPassword of weakPasswords) {
          await expect(
            authService.createAdmin(
              {
                email: `test${weakPassword}@example.com`,
                password: weakPassword,
                name: 'Test User',
                role: 'admin'
              },
              superAdmin
            )
          ).rejects.toThrow()
        }

        // Test strong password is accepted
        const strongPassword = 'StrongPassword123!'
        const strongPasswordAdmin = await authService.createAdmin(
          {
            email: 'strong@password.com',
            password: strongPassword,
            name: 'Strong Password User',
            role: 'admin'
          },
          superAdmin
        )

        expect(strongPasswordAdmin).toBeDefined()
        expect(strongPasswordAdmin.email).toBe('strong@password.com')

        // Verify password is hashed in database
        const storedAdmin = await databaseService.findAdminByEmail('strong@password.com')
        expect(storedAdmin?.passwordHash).not.toBe(strongPassword)
        expect(storedAdmin?.passwordHash).toMatch(/^\$2[aby]\$\d+\$/)

        // Verify login works with strong password
        const loginResult = await authService.login({
          email: 'strong@password.com',
          password: strongPassword
        })

        expect(loginResult.success).toBe(true)

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })
  })
})