import { databaseService } from './database'
import { imageService } from './image'
import { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductFilters, 
  ProductList,
  BatchProductUpdate 
} from '@/types'

export class ProductService {
  // Create a new product
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      // Validate required fields
      if (!productData.name || !productData.category) {
        throw new Error('Product name and category are required')
      }

      if (productData.price < 0) {
        throw new Error('Product price cannot be negative')
      }

      if (productData.stock < 0) {
        throw new Error('Product stock cannot be negative')
      }

      // Create product in database
      const product = await databaseService.createProduct(productData)
      
      return product
    } catch (error) {
      console.error('Create product error:', error)
      throw error
    }
  }

  // Get a single product by ID
  async getProduct(id: string): Promise<Product | null> {
    try {
      if (!id) {
        throw new Error('Product ID is required')
      }

      const product = await databaseService.getProduct(id)
      return product
    } catch (error) {
      console.error('Get product error:', error)
      throw error
    }
  }

  // Update an existing product
  async updateProduct(id: string, updates: UpdateProductRequest): Promise<Product> {
    try {
      if (!id) {
        throw new Error('Product ID is required')
      }

      // Validate updates
      if (updates.price !== undefined && updates.price < 0) {
        throw new Error('Product price cannot be negative')
      }

      if (updates.stock !== undefined && updates.stock < 0) {
        throw new Error('Product stock cannot be negative')
      }

      // Check if product exists
      const existingProduct = await databaseService.getProduct(id)
      if (!existingProduct) {
        throw new Error('Product not found')
      }

      // Update product in database
      const updatedProduct = await databaseService.updateProduct(id, updates)
      
      return updatedProduct
    } catch (error) {
      console.error('Update product error:', error)
      throw error
    }
  }

  // Delete a product
  async deleteProduct(id: string): Promise<void> {
    try {
      if (!id) {
        throw new Error('Product ID is required')
      }

      // Check if product exists
      const existingProduct = await databaseService.getProduct(id)
      if (!existingProduct) {
        throw new Error('Product not found')
      }

      // Get all product images before deletion
      const productImages = await databaseService.getProductImages(id)
      
      // Delete product from database (this will cascade delete images due to foreign key)
      await databaseService.deleteProduct(id)

      // Clean up images from Cloudinary
      if (productImages.length > 0) {
        const imageIds = productImages.map(img => {
          // Extract Cloudinary public_id from URL
          const urlParts = img.url.split('/')
          const filename = urlParts[urlParts.length - 1]
          return filename.split('.')[0] // Remove file extension
        })

        try {
          await imageService.deleteImages(imageIds)
        } catch (imageError) {
          console.error('Failed to delete some images from Cloudinary:', imageError)
          // Don't throw error here as the product is already deleted from database
        }
      }
    } catch (error) {
      console.error('Delete product error:', error)
      throw error
    }
  }

  // List products with filtering and pagination
  async listProducts(filters: ProductFilters = {}): Promise<ProductList> {
    try {
      // Validate pagination parameters
      const page = Math.max(1, filters.page || 1)
      const limit = Math.min(100, Math.max(1, filters.limit || 10))

      // Validate price filters
      if (filters.minPrice !== undefined && filters.minPrice < 0) {
        throw new Error('Minimum price cannot be negative')
      }

      if (filters.maxPrice !== undefined && filters.maxPrice < 0) {
        throw new Error('Maximum price cannot be negative')
      }

      if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
        throw new Error('Minimum price cannot be greater than maximum price')
      }

      // Apply filters and get products
      const productList = await databaseService.listProducts({
        ...filters,
        page,
        limit
      })

      return productList
    } catch (error) {
      console.error('List products error:', error)
      throw error
    }
  }

  // Batch update multiple products
  async batchUpdateProducts(updates: BatchProductUpdate[]): Promise<{ successful: Product[], failed: string[] }> {
    try {
      if (!updates || updates.length === 0) {
        return { successful: [], failed: [] }
      }

      if (updates.length > 100) {
        throw new Error('Cannot update more than 100 products at once')
      }

      const successful: Product[] = []
      const failed: string[] = []

      // Process each update
      for (const update of updates) {
        try {
          const updatedProduct = await this.updateProduct(update.id, update.updates)
          successful.push(updatedProduct)
        } catch (error) {
          console.error(`Failed to update product ${update.id}:`, error)
          failed.push(update.id)
        }
      }

      return { successful, failed }
    } catch (error) {
      console.error('Batch update products error:', error)
      throw error
    }
  }

  // Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      if (!category) {
        throw new Error('Category is required')
      }

      const productList = await this.listProducts({ 
        category,
        limit: 1000 // Get all products in category
      })

      return productList.products
    } catch (error) {
      console.error('Get products by category error:', error)
      throw error
    }
  }

  // Get products by status
  async getProductsByStatus(status: 'active' | 'inactive' | 'draft'): Promise<Product[]> {
    try {
      if (!status) {
        throw new Error('Status is required')
      }

      const productList = await this.listProducts({ 
        status,
        limit: 1000 // Get all products with status
      })

      return productList.products
    } catch (error) {
      console.error('Get products by status error:', error)
      throw error
    }
  }

  // Search products by name or description
  async searchProducts(searchTerm: string, limit: number = 20): Promise<Product[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return []
      }

      const productList = await this.listProducts({ 
        search: searchTerm.trim(),
        limit: Math.min(100, Math.max(1, limit))
      })

      return productList.products
    } catch (error) {
      console.error('Search products error:', error)
      throw error
    }
  }

  // Get low stock products
  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    try {
      if (threshold < 0) {
        throw new Error('Stock threshold cannot be negative')
      }

      const productList = await this.listProducts({ 
        limit: 1000 // Get all products to filter by stock
      })

      // Filter products with stock below threshold
      const lowStockProducts = productList.products.filter(
        product => product.stock <= threshold
      )

      return lowStockProducts
    } catch (error) {
      console.error('Get low stock products error:', error)
      throw error
    }
  }

  // Get product statistics
  async getProductStats(): Promise<{
    totalProducts: number
    activeProducts: number
    draftProducts: number
    inactiveProducts: number
    totalValue: number
    averagePrice: number
    lowStockCount: number
  }> {
    try {
      const allProducts = await this.listProducts({ limit: 1000 })
      const products = allProducts.products

      const stats = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        draftProducts: products.filter(p => p.status === 'draft').length,
        inactiveProducts: products.filter(p => p.status === 'inactive').length,
        totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
        averagePrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0,
        lowStockCount: products.filter(p => p.stock <= 10).length
      }

      return stats
    } catch (error) {
      console.error('Get product stats error:', error)
      throw error
    }
  }

  // Validate product data
  validateProductData(productData: Partial<CreateProductRequest | UpdateProductRequest>): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Name validation
    if (productData.name !== undefined) {
      if (!productData.name || productData.name.trim().length === 0) {
        errors.push('Product name is required')
      } else if (productData.name.length > 255) {
        errors.push('Product name must be less than 255 characters')
      }
    }

    // Price validation
    if (productData.price !== undefined) {
      if (productData.price < 0) {
        errors.push('Product price cannot be negative')
      } else if (productData.price > 999999.99) {
        errors.push('Product price cannot exceed $999,999.99')
      }
    }

    // Stock validation
    if (productData.stock !== undefined) {
      if (productData.stock < 0) {
        errors.push('Product stock cannot be negative')
      } else if (productData.stock > 999999) {
        errors.push('Product stock cannot exceed 999,999 units')
      }
    }

    // Category validation
    if (productData.category !== undefined) {
      if (!productData.category || productData.category.trim().length === 0) {
        errors.push('Product category is required')
      } else if (productData.category.length > 100) {
        errors.push('Product category must be less than 100 characters')
      }
    }

    // Description validation
    if (productData.description !== undefined && productData.description !== null) {
      if (productData.description.length > 2000) {
        errors.push('Product description must be less than 2000 characters')
      }
    }

    // Status validation
    if (productData.status !== undefined) {
      const validStatuses = ['active', 'inactive', 'draft']
      if (!validStatuses.includes(productData.status)) {
        errors.push('Product status must be active, inactive, or draft')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Image management methods
  async addProductImage(productId: string, file: File, altText?: string, isPrimary?: boolean): Promise<{
    imageId: string
    url: string
    thumbnailUrl: string
  }> {
    try {
      if (!productId) {
        throw new Error('Product ID is required')
      }

      // Check if product exists
      const product = await databaseService.getProduct(productId)
      if (!product) {
        throw new Error('Product not found')
      }

      // Upload image to Cloudinary
      const uploadResult = await imageService.uploadImage(file, {
        filename: file.name,
        size: file.size,
        mimeType: file.type,
      })

      // Add image to database
      await databaseService.addProductImage(productId, {
        url: uploadResult.url,
        altText: altText || '',
        isPrimary: isPrimary || false,
      })

      return {
        imageId: uploadResult.imageId,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
      }
    } catch (error) {
      console.error('Add product image error:', error)
      throw error
    }
  }

  async removeProductImage(productId: string, imageId: string): Promise<void> {
    try {
      if (!productId || !imageId) {
        throw new Error('Product ID and Image ID are required')
      }

      // Get product images to find the image URL
      const productImages = await databaseService.getProductImages(productId)
      const imageToDelete = productImages.find(img => img.id === imageId)

      if (!imageToDelete) {
        throw new Error('Image not found')
      }

      // Remove from database
      await databaseService.removeProductImage(productId, imageId)

      // Extract Cloudinary public_id from URL and delete from Cloudinary
      try {
        const urlParts = imageToDelete.url.split('/')
        const filename = urlParts[urlParts.length - 1]
        const cloudinaryId = filename.split('.')[0]
        await imageService.deleteImage(cloudinaryId)
      } catch (cloudinaryError) {
        console.error('Failed to delete image from Cloudinary:', cloudinaryError)
        // Don't throw error here as the image is already removed from database
      }
    } catch (error) {
      console.error('Remove product image error:', error)
      throw error
    }
  }

  async updateProductImage(productId: string, imageId: string, updates: {
    altText?: string
    isPrimary?: boolean
  }): Promise<void> {
    try {
      if (!productId || !imageId) {
        throw new Error('Product ID and Image ID are required')
      }

      await databaseService.updateProductImage(productId, imageId, updates)
    } catch (error) {
      console.error('Update product image error:', error)
      throw error
    }
  }

  async getProductImages(productId: string): Promise<Array<{
    id: string
    url: string
    altText: string
    isPrimary: boolean
  }>> {
    try {
      if (!productId) {
        throw new Error('Product ID is required')
      }

      return await databaseService.getProductImages(productId)
    } catch (error) {
      console.error('Get product images error:', error)
      throw error
    }
  }

  async setProductImageAsPrimary(productId: string, imageId: string): Promise<void> {
    try {
      await this.updateProductImage(productId, imageId, { isPrimary: true })
    } catch (error) {
      console.error('Set product image as primary error:', error)
      throw error
    }
  }

  // Batch create multiple products
  async batchCreateProducts(products: CreateProductRequest[]): Promise<Product[]> {
    try {
      if (!products || products.length === 0) {
        return []
      }

      const createdProducts: Product[] = []
      
      for (const productData of products) {
        try {
          const product = await this.createProduct(productData)
          createdProducts.push(product)
        } catch (error) {
          console.error(`Failed to create product ${productData.name}:`, error)
          // Continue with other products, but log the error
        }
      }

      return createdProducts
    } catch (error) {
      console.error('Batch create products error:', error)
      throw error
    }
  }

  // Batch delete multiple products
  async batchDeleteProducts(productIds: string[]): Promise<{ successful: string[], failed: string[] }> {
    try {
      if (!productIds || productIds.length === 0) {
        return { successful: [], failed: [] }
      }

      const successful: string[] = []
      const failed: string[] = []

      for (const productId of productIds) {
        try {
          await this.deleteProduct(productId)
          successful.push(productId)
        } catch (error) {
          console.error(`Failed to delete product ${productId}:`, error)
          failed.push(productId)
        }
      }

      return { successful, failed }
    } catch (error) {
      console.error('Batch delete products error:', error)
      throw error
    }
  }
}

export const productService = new ProductService()