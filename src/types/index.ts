// Core domain types based on the design document

export interface Product {
  id: string
  name: string
  description: string
  price: number
  costPrice?: number
  stock: number
  lowStockThreshold?: number
  category: string
  images: ProductImage[]
  status: 'active' | 'inactive' | 'draft'
  specifications?: Record<string, string>
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ProductImage {
  id: string
  url: string
  altText: string
  isPrimary: boolean
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'super_admin'
  createdAt: Date
}

export interface AdminCredentials {
  email: string
  password: string
}

export interface CreateProductRequest {
  name: string
  description: string
  price: number
  costPrice?: number
  stock: number
  lowStockThreshold?: number
  category: string
  status: 'active' | 'inactive' | 'draft'
  specifications?: Record<string, string>
  tags?: string[]
  images?: Array<{
    url: string
    altText: string
    isPrimary: boolean
  }>
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: number
  costPrice?: number
  stock?: number
  lowStockThreshold?: number
  category?: string
  status?: 'active' | 'inactive' | 'draft'
  specifications?: Record<string, string>
  tags?: string[]
}

export interface ProductFilters {
  category?: string
  status?: 'active' | 'inactive' | 'draft'
  search?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}

export interface ProductList {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BatchProductUpdate {
  id: string
  updates: UpdateProductRequest
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface AuthResult {
  success: boolean
  user?: AdminUser
  token?: string
  error?: string
}

export interface CreateAdminRequest {
  email: string
  password: string
  name: string
  role?: 'admin' | 'super_admin'
}

// Form data types for multi-step product form
export interface ProductFormData {
  step1: BasicProductInfo
  step2: ProductDetails
  step3: ProductImages
  step4: PricingAndStock
}

export interface BasicProductInfo {
  name: string
  category: string
  status: 'active' | 'inactive' | 'draft'
}

export interface ProductDetails {
  description: string
  specifications: Record<string, string>
  tags: string[]
}

export interface ProductImages {
  images: File[]
  primaryImageIndex: number
  altTexts: string[]
}

export interface PricingAndStock {
  price: number
  costPrice: number
  stock: number
  lowStockThreshold: number
}

// Data visualization types
export interface SalesMetrics {
  totalSales: number
  salesByPeriod: TimeSeries[]
  topProducts: ProductSalesData[]
}

export interface StockMetrics {
  totalProducts: number
  lowStockProducts: Product[]
  stockByCategory: CategoryStockData[]
}

export interface TimeSeries {
  date: string
  value: number
}

export interface ProductSalesData {
  productId: string
  productName: string
  totalSales: number
  quantity: number
}

export interface CategoryStockData {
  category: string
  totalStock: number
  productCount: number
}

export interface DateRange {
  start: Date
  end: Date
}

// Image storage types
export interface ImageMetadata {
  filename: string
  size: number
  mimeType: string
}

export interface UploadResult {
  imageId: string
  url: string
  thumbnailUrl: string
  metadata: ImageMetadata
}

export interface OptimizedImages {
  thumbnail: string
  medium: string
  large: string
}

// Error response type
export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
  timestamp: string
}