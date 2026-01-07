'use client'

import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query'
import { AdminUser, AdminCredentials, CreateAdminRequest } from '@/types'
import { useRouter } from 'next/navigation'

// API functions for authentication
const authApi = {
  getCurrentUser: async (): Promise<AdminUser | null> => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        if (response.status === 401) {
          return null // Not authenticated
        }
        throw new Error('Failed to fetch current user')
      }
      
      const result = await response.json()
      if (!result.success) {
        return null
      }
      
      return result.data
    } catch (error) {
      return null
    }
  },

  login: async (credentials: AdminCredentials): Promise<AdminUser> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error?.message || 'Login failed')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Login failed')
    }
    
    return result.data.user
  },

  logout: async (): Promise<void> => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    })
    
    if (!response.ok) {
      throw new Error('Logout failed')
    }
  },

  createAdmin: async (adminData: CreateAdminRequest): Promise<AdminUser> => {
    const response = await fetch('/api/admin/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    })
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error?.message || 'Failed to create admin')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create admin')
    }
    
    return result.data
  },
}

// Query keys for authentication
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}

// Custom hooks for authentication
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: authApi.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth failures
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      // Update the user cache
      queryClient.setQueryData(authKeys.user(), user)
      
      // Redirect to dashboard
      router.push('/dashboard')
    },
    onError: (error) => {
      // Clear any existing user data on login failure
      queryClient.setQueryData(authKeys.user(), null)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear()
      
      // Redirect to login
      router.push('/login')
    },
    onError: () => {
      // Even if logout fails on server, clear local cache
      queryClient.clear()
      router.push('/login')
    },
  })
}

export function useCreateAdmin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: authApi.createAdmin,
    onSuccess: () => {
      // Invalidate any admin-related queries if they exist
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })
}

// Utility hook to check authentication status
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser()
  
  return {
    isAuthenticated: !!user,
    user,
    isLoading,
  }
}

// Utility hook to check if user has specific role
export function useHasRole(requiredRole: 'admin' | 'super_admin') {
  const { data: user } = useCurrentUser()
  
  if (!user) return false
  
  if (requiredRole === 'admin') {
    return user.role === 'admin' || user.role === 'super_admin'
  }
  
  return user.role === 'super_admin'
}