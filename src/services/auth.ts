import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { databaseService } from './database'
import { AdminCredentials, AdminUser, AuthResult, CreateAdminRequest } from '@/types'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRES_IN = '7d'

export class AuthService {
  // Login functionality
  async login(credentials: AdminCredentials): Promise<AuthResult & { token?: string }> {
    try {
      // Find admin by email
      const admin = await databaseService.findAdminByEmail(credentials.email)
      
      if (!admin) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, admin.passwordHash)
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          adminId: admin.id,
          email: admin.email,
          role: admin.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      )

      // Return success with user data (without password hash)
      const { passwordHash, ...userWithoutPassword } = admin
      
      return {
        success: true,
        user: userWithoutPassword,
        token
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'An error occurred during login'
      }
    }
  }

  // Logout functionality
  async logout(): Promise<void> {
    // Logout will be handled by clearing cookies in the API route
  }

  // Verify session from token
  async verifySession(token?: string): Promise<AdminUser | null> {
    try {
      if (!token) {
        return null
      }

      // Try to verify JWT token with better error handling
      let decoded: any
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (jwtError) {
        return null
      }
      
      if (!decoded || !decoded.adminId) {
        return null
      }

      // Get current admin data from database
      const admin = await databaseService.findAdminById(decoded.adminId)
      
      return admin
    } catch (error) {
      console.error('Session verification error:', error)
      return null
    }
  }

  // Get current session (for server components)
  async getCurrentSession(): Promise<AdminUser | null> {
    try {
      const { cookies } = await import('next/headers')
      const token = cookies().get('admin-token')?.value
      
      if (!token) {
        return null
      }
      
      return await this.verifySession(token)
    } catch (error) {
      console.error('getCurrentSession error:', error)
      return null
    }
  }

  // Create new admin (only for existing admins)
  async createAdmin(adminData: CreateAdminRequest, currentAdmin: AdminUser): Promise<AdminUser> {
    // Only super_admin can create other admins
    if (currentAdmin.role !== 'super_admin') {
      throw new Error('Insufficient permissions to create admin accounts')
    }

    // Validate password strength
    const passwordValidation = this.validatePassword(adminData.password)
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '))
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminData.password, 12)

    // Create admin in database
    const newAdmin = await databaseService.createAdmin(
      adminData.email,
      passwordHash,
      adminData.name,
      adminData.role || 'admin'
    )

    return newAdmin
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession()
    return session !== null
  }

  // Check if user has specific role
  async hasRole(requiredRole: 'admin' | 'super_admin'): Promise<boolean> {
    const session = await this.getCurrentSession()
    
    if (!session) return false
    
    if (requiredRole === 'admin') {
      return session.role === 'admin' || session.role === 'super_admin'
    }
    
    return session.role === requiredRole
  }

  // Validate password strength
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export const authService = new AuthService()