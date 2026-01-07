/**
 * Property-Based Tests for Data Consistency Under Concurrency
 * 
 * @jest-environment node
 * 
 * Feature: ecommerce-admin-dashboard, Property 13: Data Consistency Under Concurrency
 * 
 * Tests that verify concurrent data modification operations maintain consistency
 * and either complete successfully or fail atomically without corrupting data.
 * 
 * Validates: Requirements 8.2
 */

import { test, expect } from '@jest/globals'
import * as fc from 'fast-check'
import { testDatabaseService as databaseService } from './test-database'
import { productService } from '@/services/product'

// Test database setup
beforeAll(async () => {
  // Database is already configured in test-database.ts
})

beforeEach(async () => {
  // Clean up test data before each test
  try {
    await databaseService.prisma.productImage.deleteMany()
    await databaseService.prisma.product.deleteMany()
    await databaseService.prisma.adminUser.deleteMany()
    await databaseService.prisma.salesData.deleteMany()
  } catch (error) {
    // Ignore cleanup errors
  }
})

afterAll(async () => {
  // Clean up and disconnect
  try {
    await databaseService.prisma.productImage.deleteMany()
    await databaseService.prisma.product.deleteMany()
    await databaseService.prisma.adminUser.deleteMany()
    await databaseService.prisma.salesData.deleteMany()
    await databaseService.prisma.$disconnect()
  } catch (error) {
    // Ignore cleanup errors
  }
})

// Generators for test data
const productGenerator = () => fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99) }),
  stock: fc.integer({ min: 0, max: 1000 }),
  category: fc.constantFrom('Electronics', 'Clothing', 'Books', 'Home', 'Sports'),
  status: fc.constantFrom('active', 'inactive', 'draft'),
})

const stockUpdateGenerator = () => fc.record({
  productId: fc.string(),
  stockChange: fc.integer({ min: -100, max: 100 }),
  operation: fc.constantFrom('add', 'subtract', 'set'),
})

const priceUpdateGenerator = () => fc.record({
  productId: fc.string(),
  newPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99) }),
})

// Helper function to create a test product
async function createTestProduct(productData: any) {
  return await databaseService.createProduct({
    name: productData.name,
    description: productData.description,
    price: productData.price,
    stock: productData.stock,
    category: productData.category,
    status: productData.status,
    costPrice: productData.price * 0.7, // Default cost price
    lowStockThreshold: 10, // Default threshold
  })
}

// Helper function to simulate concurrent operations
async function runConcurrentOperations<T>(operations: (() => Promise<T>)[]): Promise<(T | Error)[]> {
  const results = await Promise.allSettled(operations)
  return results.map(result => 
    result.status === 'fulfilled' ? result.value : result.reason
  )
}

// Helper function to verify database consistency
async function verifyDatabaseConsistency(): Promise<boolean> {
  try {
    // Check that all products have valid data
    const products = await databaseService.prisma.product.findMany()
    
    for (const product of products) {
      // Verify basic constraints
      if (product.price < 0) return false
      if (product.stock < 0) return false
      if (!product.name || product.name.trim() === '') return false
      if (!['active', 'inactive', 'draft'].includes(product.status)) return false
    }
    
    // Check that all product images reference existing products
    const images = await databaseService.prisma.productImage.findMany()
    const productIds = new Set(products.map(p => p.id))
    
    for (const image of images) {
      if (!productIds.has(image.productId)) return false
    }
    
    return true
  } catch (error) {
    return false
  }
}

describe('Data Consistency Under Concurrency Property Tests', () => {
  
  test('Property 13.1: Concurrent stock updates maintain consistency', async () => {
    // Feature: ecommerce-admin-dashboard, Property 13: Data Consistency Under Concurrency
    
    // Clean up before test
    await databaseService.prisma.productImage.deleteMany()
    await databaseService.prisma.product.deleteMany()
    
    const productData = {
      name: 'Test Product',
      description: 'Test Description',
      price: 10.99,
      stock: 100,
      category: 'Electronics' as const,
      status: 'active' as const,
    }
    
    // Create initial product
    const product = await createTestProduct(productData)
    const initialStock = product.stock
    
    // Verify product was created
    const createdProduct = await databaseService.getProduct(product.id)
    expect(createdProduct).toBeTruthy()
    
    // Create simple concurrent stock update operations
    const operations = [
      async () => {
        try {
          return await databaseService.prisma.product.update({
            where: { id: product.id },
            data: { stock: Math.max(0, initialStock + 1) }
          })
        } catch (error) {
          return error
        }
      },
      async () => {
        try {
          return await databaseService.prisma.product.update({
            where: { id: product.id },
            data: { stock: Math.max(0, initialStock + 2) }
          })
        } catch (error) {
          return error
        }
      }
    ]
    
    // Run operations concurrently
    const results = await runConcurrentOperations(operations)
    
    // Verify database consistency
    const isConsistent = await verifyDatabaseConsistency()
    expect(isConsistent).toBe(true)
    
    // Verify final product state is valid (product should still exist)
    const finalProduct = await databaseService.getProduct(product.id)
    expect(finalProduct).toBeTruthy()
    if (finalProduct) {
      expect(finalProduct.stock).toBeGreaterThanOrEqual(0)
    }
    
    // At least one operation should have succeeded
    const successfulResults = results.filter(result => !(result instanceof Error))
    expect(successfulResults.length).toBeGreaterThan(0)
  })

  test('Property 13.2: Concurrent product creation maintains uniqueness constraints', () => {
    // Feature: ecommerce-admin-dashboard, Property 13: Data Consistency Under Concurrency
    fc.assert(fc.property(
      fc.array(productGenerator(), { minLength: 2, maxLength: 5 }),
      async (productsData) => {
        // Create concurrent product creation operations
        const operations = productsData.map(productData => async () => {
          return await createTestProduct(productData)
        })
        
        // Run operations concurrently
        const results = await runConcurrentOperations(operations)
        
        // Verify database consistency
        const isConsistent = await verifyDatabaseConsistency()
        expect(isConsistent).toBe(true)
        
        // Verify all created products have unique IDs
        const successfulResults = results.filter(result => !(result instanceof Error)) as any[]
        const productIds = successfulResults.map(product => product.id)
        const uniqueIds = new Set(productIds)
        expect(uniqueIds.size).toBe(productIds.length)
        
        // Verify all products exist in database
        for (const productId of productIds) {
          const product = await databaseService.getProduct(productId)
          expect(product).toBeTruthy()
        }
      }
    ), { numRuns: 50 })
  })

  test('Property 13.3: Concurrent product updates maintain data integrity', () => {
    // Feature: ecommerce-admin-dashboard, Property 13: Data Consistency Under Concurrency
    fc.assert(fc.property(
      productGenerator(),
      fc.array(fc.record({
        field: fc.constantFrom('name', 'price', 'stock', 'status'),
        value: fc.oneof(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99) }),
          fc.integer({ min: 0, max: 1000 }),
          fc.constantFrom('active', 'inactive', 'draft')
        )
      }), { minLength: 2, maxLength: 5 }),
      async (productData, updates) => {
        // Create initial product
        const product = await createTestProduct(productData)
        
        // Create concurrent update operations
        const operations = updates.map(update => async () => {
          const updateData: any = {}
          
          // Ensure type safety for updates
          switch (update.field) {
            case 'name':
              if (typeof update.value === 'string') {
                updateData.name = update.value
              }
              break
            case 'price':
              if (typeof update.value === 'number') {
                updateData.price = Math.max(0.01, update.value)
              }
              break
            case 'stock':
              if (typeof update.value === 'number' && Number.isInteger(update.value)) {
                updateData.stock = Math.max(0, update.value)
              }
              break
            case 'status':
              if (typeof update.value === 'string' && ['active', 'inactive', 'draft'].includes(update.value)) {
                updateData.status = update.value
              }
              break
          }
          
          if (Object.keys(updateData).length > 0) {
            return await databaseService.prisma.product.update({
              where: { id: product.id },
              data: updateData
            })
          }
          
          return product // No update needed
        })
        
        // Run operations concurrently
        const results = await runConcurrentOperations(operations)
        
        // Verify database consistency
        const isConsistent = await verifyDatabaseConsistency()
        expect(isConsistent).toBe(true)
        
        // Verify final product state is valid
        const finalProduct = await databaseService.getProduct(product.id)
        expect(finalProduct).toBeTruthy()
        expect(finalProduct!.price).toBeGreaterThan(0)
        expect(finalProduct!.stock).toBeGreaterThanOrEqual(0)
        expect(['active', 'inactive', 'draft']).toContain(finalProduct!.status)
        
        // At least one operation should have succeeded
        const successfulResults = results.filter(result => !(result instanceof Error))
        expect(successfulResults.length).toBeGreaterThan(0)
      }
    ), { numRuns: 50 })
  })

  test('Property 13.4: Concurrent product deletion maintains referential integrity', () => {
    // Feature: ecommerce-admin-dashboard, Property 13: Data Consistency Under Concurrency
    fc.assert(fc.property(
      fc.array(productGenerator(), { minLength: 2, maxLength: 5 }),
      async (productsData) => {
        // Create initial products
        const products = []
        for (const productData of productsData) {
          const product = await createTestProduct(productData)
          products.push(product)
          
          // Add some images to test cascade deletion
          await databaseService.prisma.productImage.create({
            data: {
              productId: product.id,
              url: `https://example.com/image-${product.id}.jpg`,
              altText: `Image for ${product.name}`,
              isPrimary: true
            }
          })
        }
        
        // Create concurrent deletion operations
        const operations = products.map(product => async () => {
          return await databaseService.deleteProduct(product.id)
        })
        
        // Run operations concurrently
        const results = await runConcurrentOperations(operations)
        
        // Verify database consistency
        const isConsistent = await verifyDatabaseConsistency()
        expect(isConsistent).toBe(true)
        
        // Verify that deleted products and their images are gone
        for (const product of products) {
          const deletedProduct = await databaseService.getProduct(product.id)
          
          if (deletedProduct === null) {
            // If product is deleted, its images should also be deleted
            const orphanedImages = await databaseService.prisma.productImage.findMany({
              where: { productId: product.id }
            })
            expect(orphanedImages).toHaveLength(0)
          }
        }
        
        // At least some operations should have succeeded
        const successfulResults = results.filter(result => !(result instanceof Error))
        expect(successfulResults.length).toBeGreaterThan(0)
      }
    ), { numRuns: 30 })
  })

  test('Property 13.5: Concurrent read-write operations maintain consistency', () => {
    // Feature: ecommerce-admin-dashboard, Property 13: Data Consistency Under Concurrency
    fc.assert(fc.property(
      productGenerator(),
      fc.integer({ min: 2, max: 8 }),
      async (productData, operationCount) => {
        // Create initial product
        const product = await createTestProduct(productData)
        
        // Create mixed read and write operations
        const operations = []
        
        for (let i = 0; i < operationCount; i++) {
          if (i % 2 === 0) {
            // Read operation
            operations.push(async () => {
              return await databaseService.getProduct(product.id)
            })
          } else {
            // Write operation
            operations.push(async () => {
              return await databaseService.prisma.product.update({
                where: { id: product.id },
                data: { 
                  stock: Math.max(0, product.stock + (i % 3 === 0 ? 1 : -1))
                }
              })
            })
          }
        }
        
        // Run operations concurrently
        const results = await runConcurrentOperations(operations)
        
        // Verify database consistency
        const isConsistent = await verifyDatabaseConsistency()
        expect(isConsistent).toBe(true)
        
        // Verify final product state is valid
        const finalProduct = await databaseService.getProduct(product.id)
        expect(finalProduct).toBeTruthy()
        expect(finalProduct!.stock).toBeGreaterThanOrEqual(0)
        
        // All read operations should have succeeded
        const readResults = results.filter((_, index) => index % 2 === 0)
        const successfulReads = readResults.filter(result => !(result instanceof Error))
        expect(successfulReads.length).toBeGreaterThan(0)
        
        // At least some write operations should have succeeded
        const writeResults = results.filter((_, index) => index % 2 === 1)
        const successfulWrites = writeResults.filter(result => !(result instanceof Error))
        expect(successfulWrites.length).toBeGreaterThan(0)
      }
    ), { numRuns: 50 })
  })

  test('Property 13.6: Transaction rollback maintains consistency on failure', () => {
    // Feature: ecommerce-admin-dashboard, Property 13: Data Consistency Under Concurrency
    fc.assert(fc.property(
      productGenerator(),
      async (productData) => {
        // Create initial product
        const product = await createTestProduct(productData)
        const initialStock = product.stock
        
        // Create operations that will intentionally fail partway through
        const operations = [
          // This should succeed
          async () => {
            return await databaseService.prisma.product.update({
              where: { id: product.id },
              data: { stock: initialStock + 10 }
            })
          },
          // This should fail (invalid status)
          async () => {
            return await databaseService.prisma.product.update({
              where: { id: product.id },
              data: { 
                stock: initialStock + 20,
                status: 'invalid_status' as any // This will cause a validation error
              }
            })
          },
          // This should succeed
          async () => {
            return await databaseService.prisma.product.update({
              where: { id: product.id },
              data: { stock: initialStock + 5 }
            })
          }
        ]
        
        // Run operations concurrently
        const results = await runConcurrentOperations(operations)
        
        // Verify database consistency
        const isConsistent = await verifyDatabaseConsistency()
        expect(isConsistent).toBe(true)
        
        // Verify final product state is valid
        const finalProduct = await databaseService.getProduct(product.id)
        expect(finalProduct).toBeTruthy()
        expect(finalProduct!.stock).toBeGreaterThanOrEqual(0)
        expect(['active', 'inactive', 'draft']).toContain(finalProduct!.status)
        
        // Should have both successful and failed operations
        const successfulResults = results.filter(result => !(result instanceof Error))
        const failedResults = results.filter(result => result instanceof Error)
        
        expect(successfulResults.length).toBeGreaterThan(0)
        expect(failedResults.length).toBeGreaterThan(0)
      }
    ), { numRuns: 50 })
  })

  test('Property 13.7: Concurrent operations with database constraints maintain integrity', () => {
    // Feature: ecommerce-admin-dashboard, Property 13: Data Consistency Under Concurrency
    fc.assert(fc.property(
      fc.array(productGenerator(), { minLength: 3, maxLength: 6 }),
      async (productsData) => {
        // Create initial products
        const products = []
        for (const productData of productsData) {
          const product = await createTestProduct(productData)
          products.push(product)
        }
        
        // Create operations that test various constraints
        const operations = []
        
        // Add operations that might violate constraints
        for (let i = 0; i < products.length; i++) {
          const product = products[i]
          
          // Try to set negative stock (should be prevented)
          operations.push(async () => {
            return await databaseService.prisma.product.update({
              where: { id: product.id },
              data: { stock: -10 }
            })
          })
          
          // Try to set negative price (should be prevented)
          operations.push(async () => {
            return await databaseService.prisma.product.update({
              where: { id: product.id },
              data: { price: -5.99 }
            })
          })
          
          // Valid update (should succeed)
          operations.push(async () => {
            return await databaseService.prisma.product.update({
              where: { id: product.id },
              data: { 
                stock: Math.max(0, product.stock + 1),
                price: Math.max(0.01, product.price + 0.01)
              }
            })
          })
        }
        
        // Run operations concurrently
        const results = await runConcurrentOperations(operations)
        
        // Verify database consistency
        const isConsistent = await verifyDatabaseConsistency()
        expect(isConsistent).toBe(true)
        
        // Verify all products still exist and have valid data
        for (const product of products) {
          const finalProduct = await databaseService.getProduct(product.id)
          expect(finalProduct).toBeTruthy()
          expect(finalProduct!.price).toBeGreaterThan(0)
          expect(finalProduct!.stock).toBeGreaterThanOrEqual(0)
        }
        
        // Should have both successful and failed operations
        const successfulResults = results.filter(result => !(result instanceof Error))
        const failedResults = results.filter(result => result instanceof Error)
        
        expect(successfulResults.length).toBeGreaterThan(0)
        // Some operations should fail due to constraint violations
        expect(failedResults.length).toBeGreaterThan(0)
      }
    ), { numRuns: 30 })
  })

  test('Property 13.8: High concurrency stress test maintains consistency', () => {
    // Feature: ecommerce-admin-dashboard, Property 13: Data Consistency Under Concurrency
    fc.assert(fc.property(
      productGenerator(),
      fc.integer({ min: 10, max: 20 }),
      async (productData, operationCount) => {
        // Create initial product
        const product = await createTestProduct(productData)
        
        // Create many concurrent operations of different types
        const operations = []
        
        for (let i = 0; i < operationCount; i++) {
          const operationType = i % 4
          
          switch (operationType) {
            case 0: // Stock update
              operations.push(async () => {
                return await databaseService.prisma.product.update({
                  where: { id: product.id },
                  data: { stock: Math.max(0, product.stock + (i % 2 === 0 ? 1 : -1)) }
                })
              })
              break
              
            case 1: // Price update
              operations.push(async () => {
                return await databaseService.prisma.product.update({
                  where: { id: product.id },
                  data: { price: Math.max(0.01, product.price + 0.01) }
                })
              })
              break
              
            case 2: // Read operation
              operations.push(async () => {
                return await databaseService.getProduct(product.id)
              })
              break
              
            case 3: // Status update
              operations.push(async () => {
                const statuses = ['active', 'inactive', 'draft']
                return await databaseService.prisma.product.update({
                  where: { id: product.id },
                  data: { status: statuses[i % statuses.length] }
                })
              })
              break
          }
        }
        
        // Run all operations concurrently
        const results = await runConcurrentOperations(operations)
        
        // Verify database consistency
        const isConsistent = await verifyDatabaseConsistency()
        expect(isConsistent).toBe(true)
        
        // Verify final product state is valid
        const finalProduct = await databaseService.getProduct(product.id)
        expect(finalProduct).toBeTruthy()
        expect(finalProduct!.price).toBeGreaterThan(0)
        expect(finalProduct!.stock).toBeGreaterThanOrEqual(0)
        expect(['active', 'inactive', 'draft']).toContain(finalProduct!.status)
        
        // Most operations should succeed under normal conditions
        const successfulResults = results.filter(result => !(result instanceof Error))
        expect(successfulResults.length).toBeGreaterThan(operationCount * 0.5) // At least 50% success rate
      }
    ), { numRuns: 20 }) // Fewer runs for stress test
  })
})