// Application constants

export const APP_CONFIG = {
  name: 'E-commerce Admin Dashboard',
  description: 'Server-side rendered admin dashboard for e-commerce product management',
  version: '1.0.0',
} as const

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
} as const

export const ADMIN_ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PRODUCT_NAME_MAX_LENGTH: 255,
  PRODUCT_DESCRIPTION_MAX_LENGTH: 2000,
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/dashboard/products',
  PRODUCT_CREATE: '/dashboard/products/create',
  PRODUCT_EDIT: '/dashboard/products/edit',
  ADMIN_MANAGEMENT: '/dashboard/admin',
} as const