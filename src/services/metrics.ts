import { prisma } from '@/lib/db'
import { 
  SalesMetrics, 
  StockMetrics, 
  TimeSeries, 
  ProductSalesData, 
  CategoryStockData,
  DateRange,
  Product 
} from '@/types'

export class MetricsService {
  // Get comprehensive sales metrics for a date range
  async getSalesMetrics(dateRange?: DateRange): Promise<SalesMetrics> {
    try {
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: 30 days ago
      const endDate = dateRange?.end || new Date() // Default: now

      // Get total sales for the period
      const totalSalesResult = await prisma.salesData.aggregate({
        where: {
          saleDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          totalAmount: true,
          quantity: true,
        },
      })

      const totalSales = totalSalesResult._sum.totalAmount || 0

      // Get sales by day for the period
      const salesByPeriod = await this.getSalesByPeriod(startDate, endDate)

      // Get top products by sales
      const topProducts = await this.getTopProductsBySales(startDate, endDate, 10)

      return {
        totalSales,
        salesByPeriod,
        topProducts,
      }
    } catch (error) {
      console.error('Get sales metrics error:', error)
      throw error
    }
  }

  // Get stock metrics for all products
  async getStockMetrics(): Promise<StockMetrics> {
    try {
      // Get total product count
      const totalProducts = await prisma.product.count({
        where: {
          status: {
            in: ['active', 'inactive'], // Exclude drafts from stock metrics
          },
        },
      })

      // Get all products first, then filter for low stock in application logic
      const allProducts = await prisma.product.findMany({
        where: {
          status: {
            in: ['active', 'inactive'],
          },
        },
        include: {
          images: true,
        },
      })

      // Filter for low stock products in application logic
      const lowStockProducts = allProducts.filter(product => {
        const threshold = product.lowStockThreshold || 10
        return product.stock <= threshold
      })

      // Get stock by category
      const stockByCategory = await this.getStockByCategory()

      return {
        totalProducts,
        lowStockProducts: lowStockProducts.map(this.mapPrismaProductToProduct),
        stockByCategory,
      }
    } catch (error) {
      console.error('Get stock metrics error:', error)
      throw error
    }
  }

  // Get sales data grouped by time period (daily)
  private async getSalesByPeriod(startDate: Date, endDate: Date): Promise<TimeSeries[]> {
    try {
      // Get raw sales data grouped by date
      const salesData = await prisma.salesData.groupBy({
        by: ['saleDate'],
        where: {
          saleDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          totalAmount: true,
        },
        orderBy: {
          saleDate: 'asc',
        },
      })

      // Convert to TimeSeries format and fill gaps
      const salesMap = new Map<string, number>()
      
      salesData.forEach(sale => {
        const dateKey = sale.saleDate.toISOString().split('T')[0] // YYYY-MM-DD format
        salesMap.set(dateKey, (salesMap.get(dateKey) || 0) + (sale._sum.totalAmount || 0))
      })

      // Fill in missing dates with 0 sales
      const timeSeries: TimeSeries[] = []
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0]
        timeSeries.push({
          date: dateKey,
          value: salesMap.get(dateKey) || 0,
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }

      return timeSeries
    } catch (error) {
      console.error('Get sales by period error:', error)
      throw error
    }
  }

  // Get top products by sales volume
  private async getTopProductsBySales(startDate: Date, endDate: Date, limit: number = 10): Promise<ProductSalesData[]> {
    try {
      const topProducts = await prisma.salesData.groupBy({
        by: ['productId'],
        where: {
          saleDate: {
            gte: startDate,
            lte: endDate,
          },
          productId: {
            not: null,
          },
        },
        _sum: {
          totalAmount: true,
          quantity: true,
        },
        orderBy: {
          _sum: {
            totalAmount: 'desc',
          },
        },
        take: limit,
      })

      // Get product names for the top products
      const productIds = topProducts.map(p => p.productId).filter(Boolean) as string[]
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      })

      const productMap = new Map(products.map(p => [p.id, p.name]))

      return topProducts.map(sale => ({
        productId: sale.productId!,
        productName: productMap.get(sale.productId!) || 'Unknown Product',
        totalSales: sale._sum.totalAmount || 0,
        quantity: sale._sum.quantity || 0,
      }))
    } catch (error) {
      console.error('Get top products by sales error:', error)
      throw error
    }
  }

  // Get stock metrics grouped by category
  private async getStockByCategory(): Promise<CategoryStockData[]> {
    try {
      const categoryStats = await prisma.product.groupBy({
        by: ['category'],
        where: {
          status: {
            in: ['active', 'inactive'],
          },
        },
        _sum: {
          stock: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            stock: 'desc',
          },
        },
      })

      return categoryStats.map(stat => ({
        category: stat.category,
        totalStock: stat._sum.stock || 0,
        productCount: stat._count.id,
      }))
    } catch (error) {
      console.error('Get stock by category error:', error)
      throw error
    }
  }

  // Get product performance metrics for a specific product
  async getProductPerformance(productId: string, dateRange?: DateRange): Promise<{
    productId: string
    productName: string
    totalSales: number
    totalQuantitySold: number
    averageOrderValue: number
    salesTrend: TimeSeries[]
    currentStock: number
    stockTurnover: number
  }> {
    try {
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const endDate = dateRange?.end || new Date()

      // Get product details
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          stock: true,
        },
      })

      if (!product) {
        throw new Error('Product not found')
      }

      // Get sales metrics for this product
      const salesMetrics = await prisma.salesData.aggregate({
        where: {
          productId,
          saleDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          totalAmount: true,
          quantity: true,
        },
        _count: {
          id: true,
        },
      })

      const totalSales = salesMetrics._sum.totalAmount || 0
      const totalQuantitySold = salesMetrics._sum.quantity || 0
      const orderCount = salesMetrics._count.id || 0
      const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0

      // Get sales trend for this product
      const salesTrend = await this.getProductSalesTrend(productId, startDate, endDate)

      // Calculate stock turnover (quantity sold / average stock)
      const stockTurnover = product.stock > 0 ? totalQuantitySold / product.stock : 0

      return {
        productId: product.id,
        productName: product.name,
        totalSales,
        totalQuantitySold,
        averageOrderValue,
        salesTrend,
        currentStock: product.stock,
        stockTurnover,
      }
    } catch (error) {
      console.error('Get product performance error:', error)
      throw error
    }
  }

  // Get sales trend for a specific product
  private async getProductSalesTrend(productId: string, startDate: Date, endDate: Date): Promise<TimeSeries[]> {
    try {
      const salesData = await prisma.salesData.groupBy({
        by: ['saleDate'],
        where: {
          productId,
          saleDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          totalAmount: true,
        },
        orderBy: {
          saleDate: 'asc',
        },
      })

      // Convert to TimeSeries format and fill gaps
      const salesMap = new Map<string, number>()
      
      salesData.forEach(sale => {
        const dateKey = sale.saleDate.toISOString().split('T')[0]
        salesMap.set(dateKey, (salesMap.get(dateKey) || 0) + (sale._sum.totalAmount || 0))
      })

      // Fill in missing dates with 0 sales
      const timeSeries: TimeSeries[] = []
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0]
        timeSeries.push({
          date: dateKey,
          value: salesMap.get(dateKey) || 0,
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }

      return timeSeries
    } catch (error) {
      console.error('Get product sales trend error:', error)
      throw error
    }
  }

  // Create sample sales data for testing/demo purposes
  async createSampleSalesData(): Promise<void> {
    try {
      // Get all active products
      const products = await prisma.product.findMany({
        where: {
          status: 'active',
        },
        select: {
          id: true,
          price: true,
        },
      })

      if (products.length === 0) {
        console.log('No active products found for sample sales data')
        return
      }

      // Generate sample sales data for the last 30 days
      const salesData = []
      const now = new Date()
      
      for (let i = 0; i < 30; i++) {
        const saleDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        
        // Generate 0-5 random sales per day
        const salesCount = Math.floor(Math.random() * 6)
        
        for (let j = 0; j < salesCount; j++) {
          const randomProduct = products[Math.floor(Math.random() * products.length)]
          const quantity = Math.floor(Math.random() * 3) + 1 // 1-3 items
          const unitPrice = randomProduct.price
          const totalAmount = quantity * unitPrice
          
          salesData.push({
            productId: randomProduct.id,
            quantity,
            unitPrice,
            totalAmount,
            saleDate: new Date(saleDate.getTime() + Math.random() * 24 * 60 * 60 * 1000), // Random time during the day
          })
        }
      }

      // Insert sample sales data
      if (salesData.length > 0) {
        await prisma.salesData.createMany({
          data: salesData,
        })
        console.log(`Created ${salesData.length} sample sales records`)
      }
    } catch (error) {
      console.error('Create sample sales data error:', error)
      throw error
    }
  }

  // Helper method to map Prisma product to Product type
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

  // Utility method to get date range presets
  static getDateRangePresets(): Record<string, DateRange> {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return {
      today: {
        start: today,
        end: now,
      },
      yesterday: {
        start: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        end: new Date(today.getTime() - 1),
      },
      last7Days: {
        start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now,
      },
      last30Days: {
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
      },
      thisMonth: {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
      },
      lastMonth: {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      },
    }
  }
}

export const metricsService = new MetricsService()