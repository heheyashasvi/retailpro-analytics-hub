import { prisma } from '@/lib/db'
import { Product, AdminUser, CreateProductRequest, UpdateProductRequest, ProductFilters, ProductList } from '@/types'

export class DatabaseService {
  public prisma = prisma

  // Product operations
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        costPrice: data.costPrice,
        stock: data.stock,
        lowStockThreshold: data.lowStockThreshold,
        category: data.category,
        status: data.status,
        specifications: data.specifications ? JSON.stringify(data.specifications) : null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
      },
      include: {
        images: true,
      },
    })

    // If images are provided, add them
    if (data.images && data.images.length > 0) {
      for (const imageData of data.images) {
        await this.addProductImage(product.id, imageData)
      }
      
      // Fetch the product again with images
      const productWithImages = await prisma.product.findUnique({
        where: { id: product.id },
        include: { images: true },
      })
      
      return this.mapPrismaProductToProduct(productWithImages!)
    }

    return this.mapPrismaProductToProduct(product)
  }

  async getProduct(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
      },
    })

    return product ? this.mapPrismaProductToProduct(product) : null
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold }),
        ...(data.category && { category: data.category }),
        ...(data.status && { status: data.status }),
        ...(data.specifications !== undefined && { specifications: data.specifications ? JSON.stringify(data.specifications) : null }),
        ...(data.tags !== undefined && { tags: data.tags ? JSON.stringify(data.tags) : null }),
      },
      include: {
        images: true,
      },
    })

    return this.mapPrismaProductToProduct(product)
  }

  async deleteProduct(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id },
    })
  }

  // Product image operations
  async addProductImage(productId: string, imageData: {
    url: string
    altText?: string
    isPrimary?: boolean
  }): Promise<void> {
    // If this is set as primary, make sure no other images are primary
    if (imageData.isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      })
    }

    await prisma.productImage.create({
      data: {
        productId,
        url: imageData.url,
        altText: imageData.altText || '',
        isPrimary: imageData.isPrimary || false,
      },
    })
  }

  async removeProductImage(productId: string, imageId: string): Promise<void> {
    await prisma.productImage.delete({
      where: {
        id: imageId,
        productId, // Ensure the image belongs to the product
      },
    })
  }

  async updateProductImage(productId: string, imageId: string, updates: {
    altText?: string
    isPrimary?: boolean
  }): Promise<void> {
    // If setting as primary, make sure no other images are primary
    if (updates.isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      })
    }

    await prisma.productImage.update({
      where: {
        id: imageId,
        productId, // Ensure the image belongs to the product
      },
      data: updates,
    })
  }

  async getProductImages(productId: string): Promise<Array<{
    id: string
    url: string
    altText: string
    isPrimary: boolean
  }>> {
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: [
        { isPrimary: 'desc' }, // Primary images first
        { createdAt: 'asc' },  // Then by creation order
      ],
    })

    return images.map(img => ({
      id: img.id,
      url: img.url,
      altText: img.altText || '',
      isPrimary: img.isPrimary,
    }))
  }

  async removeAllProductImages(productId: string): Promise<string[]> {
    // Get all image URLs before deleting (for cleanup)
    const images = await prisma.productImage.findMany({
      where: { productId },
      select: { url: true },
    })

    // Delete all images for the product
    await prisma.productImage.deleteMany({
      where: { productId },
    })

    return images.map(img => img.url)
  }

  async listProducts(filters: ProductFilters): Promise<ProductList> {
    const {
      category,
      status,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = filters

    const where: any = {}

    if (category) where.category = category
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = minPrice
      if (maxPrice) where.price.lte = maxPrice
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    return {
      products: products.map(this.mapPrismaProductToProduct),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  // Admin operations
  async createAdmin(email: string, passwordHash: string, name: string, role: 'admin' | 'super_admin' = 'admin'): Promise<AdminUser> {
    const admin = await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        name,
        role,
      },
    })

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role as 'admin' | 'super_admin',
      createdAt: admin.createdAt,
    }
  }

  async findAdminByEmail(email: string): Promise<(AdminUser & { passwordHash: string }) | null> {
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    })

    return admin ? {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role as 'admin' | 'super_admin',
      createdAt: admin.createdAt,
      passwordHash: admin.passwordHash,
    } : null
  }

  async findAdminById(id: string): Promise<AdminUser | null> {
    const admin = await prisma.adminUser.findUnique({
      where: { id },
    })

    return admin ? {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role as 'admin' | 'super_admin',
      createdAt: admin.createdAt,
    } : null
  }

  // Helper methods
  private mapPrismaProductToProduct(prismaProduct: any): Product {
    return {
      id: prismaProduct.id,
      name: prismaProduct.name,
      description: prismaProduct.description || '',
      price: Number(prismaProduct.price),
      costPrice: prismaProduct.costPrice ? Number(prismaProduct.costPrice) : undefined,
      stock: prismaProduct.stock,
      lowStockThreshold: prismaProduct.lowStockThreshold,
      category: prismaProduct.category,
      status: prismaProduct.status as 'active' | 'inactive' | 'draft',
      specifications: prismaProduct.specifications ? JSON.parse(prismaProduct.specifications) : {},
      tags: prismaProduct.tags ? JSON.parse(prismaProduct.tags) : [],
      images: prismaProduct.images?.map((img: any) => ({
        id: img.id,
        url: img.url,
        altText: img.altText || '',
        isPrimary: img.isPrimary,
      })) || [],
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    }
  }
}

export const databaseService = new DatabaseService()