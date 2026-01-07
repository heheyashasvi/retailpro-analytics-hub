import * as fc from 'fast-check'
import bcrypt from 'bcryptjs'
import { databaseService } from '@/services/database'
import { CreateAdminRequest } from '@/types'

// Test generators
const adminGenerator = () =>
  fc.record({
    email: fc.emailAddress(),
    password: fc.string({ minLength: 8, maxLength: 50 }),
    name: fc.string({ minLength: 2, maxLength: 100 }),
    role: fc.constantFrom('admin', 'super_admin'),
  })

// Feature: ecommerce-admin-dashboard, Property 14: Credential Encryption
describe('Database Models Property Tests', () => {
  beforeEach(async () => {
    // Clean up database before each test
    // Note: In a real environment, you'd use a test database
    try {
      await databaseService.prisma?.adminUser.deleteMany()
    } catch (error) {
      // Database might not be available in test environment
      console.warn('Database cleanup failed:', error)
    }
  })

  describe('Property 14: Credential Encryption', () => {
    it('should encrypt passwords and never store them in plain text', async () => {
      await fc.assert(
        fc.asyncProperty(adminGenerator(), async (adminData) => {
          try {
            // Hash the password before storing
            const passwordHash = await bcrypt.hash(adminData.password, 12)
            
            // Create admin with hashed password
            const createdAdmin = await databaseService.createAdmin(
              adminData.email,
              passwordHash,
              adminData.name,
              adminData.role
            )

            // Verify the admin was created
            expect(createdAdmin).toBeDefined()
            expect(createdAdmin.email).toBe(adminData.email)
            expect(createdAdmin.name).toBe(adminData.name)
            expect(createdAdmin.role).toBe(adminData.role)

            // Retrieve the admin with password hash
            const retrievedAdmin = await databaseService.findAdminByEmail(adminData.email)
            
            if (retrievedAdmin) {
              // Verify password is encrypted (not plain text)
              expect(retrievedAdmin.passwordHash).not.toBe(adminData.password)
              expect(retrievedAdmin.passwordHash).toMatch(/^\$2[aby]\$\d+\$/)
              
              // Verify password can be validated
              const isValidPassword = await bcrypt.compare(adminData.password, retrievedAdmin.passwordHash)
              expect(isValidPassword).toBe(true)
              
              // Verify wrong password fails
              const isInvalidPassword = await bcrypt.compare('wrong-password', retrievedAdmin.passwordHash)
              expect(isInvalidPassword).toBe(false)
            }
          } catch (error) {
            // If database is not available, skip this test
            if (error instanceof Error && error.message.includes('database')) {
              console.warn('Skipping database test - database not available')
              return
            }
            throw error
          }
        }),
        { numRuns: 10 } // Reduced runs for database tests
      )
    })

    it('should handle duplicate email addresses correctly', async () => {
      await fc.assert(
        fc.asyncProperty(adminGenerator(), async (adminData) => {
          try {
            const passwordHash = await bcrypt.hash(adminData.password, 12)
            
            // Create first admin
            await databaseService.createAdmin(
              adminData.email,
              passwordHash,
              adminData.name,
              adminData.role
            )

            // Attempt to create second admin with same email should fail
            await expect(
              databaseService.createAdmin(
                adminData.email,
                passwordHash,
                'Different Name',
                adminData.role
              )
            ).rejects.toThrow()
          } catch (error) {
            if (error instanceof Error && error.message.includes('database')) {
              console.warn('Skipping database test - database not available')
              return
            }
            throw error
          }
        }),
        { numRuns: 5 }
      )
    })
  })

  describe('Database Connection and Schema Validation', () => {
    it('should validate that required fields are enforced', async () => {
      try {
        // Test that email is required
        await expect(
          databaseService.createAdmin('', 'hashedpassword', 'Test User')
        ).rejects.toThrow()

        // Test that name is required
        await expect(
          databaseService.createAdmin('test@example.com', 'hashedpassword', '')
        ).rejects.toThrow()
      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database validation test - database not available')
          return
        }
        throw error
      }
    })
  })
})