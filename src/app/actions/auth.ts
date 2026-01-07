'use server'

import { redirect } from 'next/navigation'
import { authService } from '@/services/auth'
import { AdminCredentials, CreateAdminRequest } from '@/types'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string

  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required'
    }
  }

  const credentials: AdminCredentials = { email, password }
  const result = await authService.login(credentials)

  if (result.success) {
    // Redirect to dashboard or original destination
    redirect(redirectTo || '/dashboard')
  }

  return result
}

export async function logoutAction() {
  await authService.logout()
  redirect('/login')
}

export async function createAdminAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as 'admin' | 'super_admin'

  // Get current session
  const currentAdmin = await authService.getCurrentSession()
  
  if (!currentAdmin) {
    return {
      success: false,
      error: 'Authentication required'
    }
  }

  if (!email || !password || !name) {
    return {
      success: false,
      error: 'All fields are required'
    }
  }

  // Validate password strength
  const passwordValidation = authService.validatePassword(password)
  if (!passwordValidation.isValid) {
    return {
      success: false,
      error: passwordValidation.errors.join(', ')
    }
  }

  try {
    const adminData: CreateAdminRequest = {
      email,
      password,
      name,
      role: role || 'admin'
    }

    const newAdmin = await authService.createAdmin(adminData, currentAdmin)
    
    return {
      success: true,
      admin: newAdmin
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create admin'
    }
  }
}

export async function getCurrentUser() {
  return await authService.getCurrentSession()
}