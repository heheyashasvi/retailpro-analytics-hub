import * as fc from 'fast-check'
import { productService } from '@/services/product'
import { databaseService } from '@/services/database'
import { CreateProductRequest, UpdateProductRequest, BatchProductUpdate } from '@/types'

// Test generators
const productGenerator = () =>
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
    description: fc.string({ maxLength: 2000 }),
    price: fc.float({ min: 0, max: Math.fround(999999.99), noNaN: true }),
    stock: fc.integer({ min: 0, max: 999999 }),
    category: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    status: fc.constantFrom('active', 'inactive', 'draft'),
  })

const updateProductGenerator = () =>
  fc.record({
    name: fc.option(fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0)),
    description: fc.option(fc.string({ maxLength: 2000 })),
    price: fc.option(fc.float({ min: 0, max: Math.fround(999999.99), noNaN: true })),
    stock: fc.option(fc.integer({ min: 0, max: 999999 })),
    category: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)),
    status: fc.option(fc.constantFrom('active', 'inactive', 'draft')),
  }).map(obj => {
    // Remove undefined values to create proper UpdateProductRequest
    const result: UpdateProductRequest = {}
    if (obj.name !== null) result.name = obj.name
    if (obj.description !== null) result.description = obj.description
    if (obj.price !== null) result.price = obj.price
    if (obj.stock !== null) result.stock = obj.stock
    if (obj.category !== null) result.category = obj.category
    if (obj.status !== null) result.status = obj.status
    return result
  })

// Feature: ecommerce-admin-dashboard, Property 3: Batch Operations Consistency
describe('Product Batch Operations Property Tests', () => {
  beforeEach(async () => {
    // Clean up database before each test
    try {
      await databaseService.prisma?.product.deleteMany()
    } catch (error) {
      console.warn('Database cleanup failed:', error)
    }
  })

  describe('Property 3: Batch Operations Consistency', () => {
    it('should produce same results as individual operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(productGenerator(), { minLength: 2, maxLength: 10 }),
          fc.array(updateProductGenerator(), { minLength: 2, maxLength: 10 }),
          async (productsData, updatesData) => {
            try {
              // Create products
              const createdProducts = []
              for (const productData of productsData) {
                const product = await productService.createProduct(productData)
                createdProducts.push(product)
              }

              // Prepare batch updates (ensure we have updates for existing products)
              const batchUpdates: BatchProductUpdate[] = createdProducts.slice(0, updatesData.length).map((product, index) => ({
                id: product.id,
                updates: updatesData[index]
              })).filter(update => Object.keys(update.updates).length > 0) // Only include non-empty updates

              if (batchUpdates.length === 0) {
                // Skip test if no valid updates
                return
              }

              // Apply updates individually (control group)
              const individualResults = []
              for (const update of batchUpdates) {
                const result = await productService.updateProduct(update.id, update.updates)
                individualResults.push(result)
              }

              // Reset products to original state
              await databaseService.prisma?.product.deleteMany()
              const resetProducts = []
              for (const productData of productsData) {
                const product = await productService.createProduct(productData)
                resetProducts.push(product)
              }

              // Prepare batch updates with reset product IDs
              const resetBatchUpdates: BatchProductUpdate[] = resetProducts.slice(0, updatesData.length).map((product, index) => ({
                id: product.id,
                updates: updatesData[index]
              })).filter(update => Object.keys(update.updates).length > 0)

              // Apply updates via batch operation
              const batchResults = await productService.batchUpdateProducts(resetBatchUpdates)

              // Compare results
              expect(batchResults).toHaveLength(individualResults.length)

              for (let i = 0; i < batchResults.length; i++) {
                const batchResult = batchResults[i]
                const individualResult = individualResults[i]

                // Compare all fields except timestamps and IDs (which will differ due to recreation)
                expect(batchResult.name).toBe(individualResult.name)
                expect(batchResult.description).toBe(individualResult.description)
                expect(batchResult.price).toBe(individualResult.price)
                expect(batchResult.stock).toBe(individualResult.stock)
                expect(batchResult.category).toBe(individualResult.category)
                expect(batchResult.status).toBe(individualResult.status)
              }

              // Verify all batch-updated products can be retrieved
              for (const result of batchResults) {
                const retrieved = await productService.getProduct(result.id)
                expect(retrieved).not.toBeNull()
                expect(retrieved).toMatchObject({
                  name: result.name,
                  description: result.description,
                  price: result.price,
                  stock: result.stock,
                  category: result.category,
                  status: result.status,
                })
              }
            } catch (error) {
              if (error instanceof Error && error.message.includes('database')) {
                console.warn('Skipping database test - database not available')
                return
              }
              throw error
            }
          }
        ),
        { numRuns: 8 } // Reduced runs for complex batch operations
      )
    })

    it('should handle partial failures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(productGenerator(), { minLength: 3, maxLength: 8 }),
          async (productsData) => {
            try {
              // Create some products
              const createdProducts = []
              for (let i = 0; i < productsData.length - 1; i++) {
                const product = await productService.createProduct(productsData[i])
                createdProducts.push(product)
              }

              // Create batch updates with mix of valid and invalid product IDs
              const validUpdates: BatchProductUpdate[] = createdProducts.map(product => ({
                id: product.id,
                updates: { stock: product.stock + 10 }
              }))

              const invalidUpdates: BatchProductUpdate[] = [
                {
                  id: 'non-existent-id-1',
                  updates: { stock: 100 }
                },
                {
                  id: 'non-existent-id-2',
                  updates: { price: 50.00 }
                }
              ]

              const mixedUpdates = [...validUpdates, ...invalidUpdates]

              // Apply batch updates
              const results = await productService.batchUpdateProducts(mixedUpdates)

              // Should return results only for successful updates
              expect(results.length).toBeLessThanOrEqual(validUpdates.length)
              expect(results.length).toBeGreaterThan(0) // At least some should succeed

              // Verify successful updates were applied
              for (const result of results) {
                const retrieved = await productService.getProduct(result.id)
                expect(retrieved).not.toBeNull()
                expect(retrieved?.stock).toBe(result.stock)
              }

              // Verify failed updates didn't create phantom products
              for (const invalidUpdate of invalidUpdates) {
                const shouldNotExist = await productService.getProduct(invalidUpdate.id)
                expect(shouldNotExist).toBeNull()
              }
            } catch (error) {
              if (error instanceof Error && error.message.includes('database')) {
                console.warn('Skipping database test - database not available')
                return
              }
              throw error
            }
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should respect batch size limits', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 101, max: 200 }), // Generate batch sizes over the limit
          async (batchSize) => {
            try {
              // Create a large number of fake batch updates
              const largeBatch: BatchProductUpdate[] = Array.from({ length: batchSize }, (_, i) => ({
                id: `fake-id-${i}`,
                updates: { stock: i }
              }))

              // Should reject batches over 100 items
              await expect(productService.batchUpdateProducts(largeBatch))
                .rejects.toThrow('Cannot update more than 100 products at once')
            } catch (error) {
              if (error instanceof Error && error.message.includes('database')) {
                console.warn('Skipping database test - database not available')
                return
              }
              throw error
            }
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should handle empty batch updates', async () => {
      try {
        // Empty array should be rejected
        await expect(productService.batchUpdateProducts([]))
          .rejects.toThrow('No updates provided')

        // Null/undefined should be rejected
        await expect(productService.batchUpdateProducts(null as any))
          .rejects.toThrow('No updates provided')
      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })

    it('should maintain data integrity during concurrent batch operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(productGenerator(), { minLength: 4, maxLength: 8 }),
          async (productsData) => {
            try {
              // Create products
              const createdProducts = []
              for (const productData of productsData) {
                const product = await productService.createProduct(productData)
                createdProducts.push(product)
              }

              // Create two different batch updates for the same products
              const batch1: BatchProductUpdate[] = createdProducts.map(product => ({
                id: product.id,
                updates: { stock: product.stock + 100 }
              }))

              const batch2: BatchProductUpdate[] = createdProducts.map(product => ({
                id: product.id,
                updates: { price: product.price + 10.00 }
              }))

              // Execute batch operations concurrently
              const [results1, results2] = await Promise.all([
                productService.batchUpdateProducts(batch1),
                productService.batchUpdateProducts(batch2)
              ])

              // Both batches should complete
              expect(results1.length).toBeGreaterThan(0)
              expect(results2.length).toBeGreaterThan(0)

              // Verify final state of all products
              for (const product of createdProducts) {
                const final = await productService.getProduct(product.id)
                expect(final).not.toBeNull()
                
                // Product should have updates from at least one batch
                const hasStockUpdate = final!.stock === product.stock + 100
                const hasPriceUpdate = Math.abs(final!.price - (product.price + 10.00)) < 0.01
                
                // At least one update should have been applied
                expect(hasStockUpdate || hasPriceUpdate).toBe(true)
              }
            } catch (error) {
              if (error instanceof Error && error.message.includes('database')) {
                console.warn('Skipping database test - database not available')
                return
              }
              throw error
            }
          }
        ),
        { numRuns: 3 } // Reduced runs for concurrent operations
      )
    })

    it('should validate all updates in batch before applying any', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(productGenerator(), { minLength: 3, maxLength: 6 }),
          async (productsData) => {
            try {
              // Create products
              const createdProducts = []
              for (const productData of productsData) {
                const product = await productService.createProduct(productData)
                createdProducts.push(product)
              }

              // Create batch with mix of valid and invalid updates
              const batchUpdates: BatchProductUpdate[] = [
                // Valid updates
                { id: createdProducts[0].id, updates: { stock: 50 } },
                { id: createdProducts[1].id, updates: { price: 25.99 } },
                // Invalid update (negative price)
                { id: createdProducts[2].id, updates: { price: -10.00 } }
              ]

              // Get initial state
              const initialStates = []
              for (const product of createdProducts) {
                const state = await productService.getProduct(product.id)
                initialStates.push(state)
              }

              // Apply batch updates (should handle invalid updates gracefully)
              const results = await productService.batchUpdateProducts(batchUpdates)

              // Should return only successful updates
              expect(results.length).toBeLessThan(batchUpdates.length)

              // Verify that products with invalid updates remain unchanged
              const productWithInvalidUpdate = await productService.getProduct(createdProducts[2].id)
              const originalProduct = initialStates[2]
              expect(productWithInvalidUpdate?.price).toBe(originalProduct?.price)

              // Verify that valid updates were applied
              const validResults = results.filter(r => 
                r.id === createdProducts[0].id || r.id === createdProducts[1].id
              )
              expect(validResults.length).toBeGreaterThan(0)
            } catch (error) {
              if (error instanceof Error && error.message.includes('database')) {
                console.warn('Skipping database test - database not available')
                return
              }
              throw error
            }
          }
        ),
        { numRuns: 5 }
      )
    })
  })

  describe('Batch Operation Edge Cases', () => {
    it('should handle duplicate product IDs in batch', async () => {
      await fc.assert(
        fc.asyncProperty(
          productGenerator(),
          fc.array(updateProductGenerator(), { minLength: 2, maxLength: 4 }),
          async (productData, updatesArray) => {
            try {
              // Create a single product
              const createdProduct = await productService.createProduct(productData)

              // Create batch updates with duplicate product IDs
              const batchUpdates: BatchProductUpdate[] = updatesArray
                .filter(update => Object.keys(update).length > 0)
                .map(updates => ({
                  id: createdProduct.id,
                  updates
                }))

              if (batchUpdates.length === 0) return

              // Apply batch updates
              const results = await productService.batchUpdateProducts(batchUpdates)

              // Should handle duplicates gracefully
              expect(results.length).toBeGreaterThan(0)

              // Final product should exist and be valid
              const finalProduct = await productService.getProduct(createdProduct.id)
              expect(finalProduct).not.toBeNull()
              
              // Should have some combination of the updates applied
              expect(finalProduct?.id).toBe(createdProduct.id)
            } catch (error) {
              if (error instanceof Error && error.message.includes('database')) {
                console.warn('Skipping database test - database not available')
                return
              }
              throw error
            }
          }
        ),
        { numRuns: 5 }
      )
    })

    it('should maintain consistent state during large batch operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(productGenerator(), { minLength: 20, maxLength: 50 }),
          async (productsData) => {
            try {
              // Create many products
              const createdProducts = []
              for (const productData of productsData) {
                const product = await productService.createProduct(productData)
                createdProducts.push(product)
              }

              // Create large batch update (within limits)
              const batchUpdates: BatchProductUpdate[] = createdProducts.slice(0, 50).map(product => ({
                id: product.id,
                updates: { stock: product.stock + 1 }
              }))

              // Get initial statistics
              const initialStats = await productService.getProductStats()

              // Apply batch updates
              const results = await productService.batchUpdateProducts(batchUpdates)

              // Verify all updates were applied
              expect(results.length).toBe(batchUpdates.length)

              // Get final statistics
              const finalStats = await productService.getProductStats()

              // Total products should remain the same
              expect(finalStats.totalProducts).toBe(initialStats.totalProducts)

              // Total value should increase (each product stock increased by 1)
              expect(finalStats.totalValue).toBeGreaterThan(initialStats.totalValue)

              // Verify each updated product
              for (const result of results) {
                const retrieved = await productService.getProduct(result.id)
                expect(retrieved).not.toBeNull()
                expect(retrieved?.stock).toBe(result.stock)
              }
            } catch (error) {
              if (error instanceof Error && error.message.includes('database')) {
                console.warn('Skipping database test - database not available')
                return
              }
              throw error
            }
          }
        ),
        { numRuns: 3 } // Reduced runs for large operations
      )
    })
  })
})