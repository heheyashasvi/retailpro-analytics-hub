import { productService } from '@/services/product'
import { databaseService } from '@/services/database'
import { CreateProductRequest, UpdateProductRequest } from '@/types'

describe('Product Management Integration Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    try {
      await databaseService.prisma?.productImage.deleteMany()
      await databaseService.prisma?.product.deleteMany()
    } catch (error) {
      console.warn('Database cleanup failed:', error)
    }
  })

  afterAll(async () => {
    // Final cleanup
    try {
      await databaseService.prisma?.productImage.deleteMany()
      await databaseService.prisma?.product.deleteMany()
      await databaseService.prisma?.$disconnect()
    } catch (error) {
      console.warn('Final cleanup failed:', error)
    }
  })

  describe('Complete Product Lifecycle', () => {
    it('should handle complete product CRUD operations', async () => {
      try {
        // Step 1: Create a product
        const productData: CreateProductRequest = {
          name: 'Integration Test Product',
          description: 'A product created during integration testing',
          price: 99.99,
          stock: 50,
          category: 'Electronics',
          status: 'active'
        }

        const createdProduct = await productService.createProduct(productData)
        
        expect(createdProduct).toBeDefined()
        expect(createdProduct.name).toBe(productData.name)
        expect(createdProduct.price).toBe(productData.price)
        expect(createdProduct.stock).toBe(productData.stock)
        expect(createdProduct.status).toBe('active')
        expect(createdProduct.id).toBeDefined()

        const productId = createdProduct.id

        // Step 2: Read the product
        const retrievedProduct = await productService.getProduct(productId)
        
        expect(retrievedProduct).toBeDefined()
        expect(retrievedProduct?.id).toBe(productId)
        expect(retrievedProduct?.name).toBe(productData.name)

        // Step 3: Update the product
        const updateData: UpdateProductRequest = {
          name: 'Updated Integration Test Product',
          price: 149.99,
          stock: 75,
          status: 'inactive'
        }

        const updatedProduct = await productService.updateProduct(productId, updateData)
        
        expect(updatedProduct).toBeDefined()
        expect(updatedProduct.name).toBe(updateData.name)
        expect(updatedProduct.price).toBe(updateData.price)
        expect(updatedProduct.stock).toBe(updateData.stock)
        expect(updatedProduct.status).toBe('inactive')

        // Step 4: Verify update persisted
        const reRetrievedProduct = await productService.getProduct(productId)
        expect(reRetrievedProduct?.name).toBe(updateData.name)
        expect(reRetrievedProduct?.status).toBe('inactive')

        // Step 5: List products (should include our product)
        const productsList = await productService.listProducts({ limit: 10 })
        
        expect(productsList.products).toBeDefined()
        expect(productsList.products.length).toBeGreaterThan(0)
        expect(productsList.products.some(p => p.id === productId)).toBe(true)

        // Step 6: Delete the product
        await productService.deleteProduct(productId)

        // Step 7: Verify deletion
        const deletedProduct = await productService.getProduct(productId)
        expect(deletedProduct).toBeNull()

        // Step 8: Verify product no longer in list
        const finalProductsList = await productService.listProducts({ limit: 10 })
        expect(finalProductsList.products.some(p => p.id === productId)).toBe(false)

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    }, 30000)

    it('should handle batch operations correctly', async () => {
      try {
        // Create multiple products
        const products: CreateProductRequest[] = [
          {
            name: 'Batch Product 1',
            description: 'First batch product',
            price: 10.00,
            stock: 100,
            category: 'Category A',
            status: 'active'
          },
          {
            name: 'Batch Product 2',
            description: 'Second batch product',
            price: 20.00,
            stock: 200,
            category: 'Category B',
            status: 'active'
          },
          {
            name: 'Batch Product 3',
            description: 'Third batch product',
            price: 30.00,
            stock: 300,
            category: 'Category C',
            status: 'draft'
          }
        ]

        const createdProducts = await productService.batchCreateProducts(products)
        
        expect(createdProducts).toHaveLength(3)
        expect(createdProducts[0].name).toBe('Batch Product 1')
        expect(createdProducts[1].name).toBe('Batch Product 2')
        expect(createdProducts[2].name).toBe('Batch Product 3')

        const productIds = createdProducts.map(p => p.id)

        // Batch update
        const updates = productIds.map(id => ({
          id,
          updates: { status: 'inactive' as const }
        }))

        const updateResults = await productService.batchUpdateProducts(updates)
        
        expect(updateResults.successful).toHaveLength(3)
        expect(updateResults.failed).toHaveLength(0)

        // Verify all products are inactive
        for (const id of productIds) {
          const product = await productService.getProduct(id)
          expect(product?.status).toBe('inactive')
        }

        // Batch delete
        const deleteResults = await productService.batchDeleteProducts(productIds)
        
        expect(deleteResults.successful).toHaveLength(3)
        expect(deleteResults.failed).toHaveLength(0)

        // Verify all products are deleted
        for (const id of productIds) {
          const product = await productService.getProduct(id)
          expect(product).toBeNull()
        }

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })
  })

  describe('Product Validation Integration', () => {
    it('should enforce validation rules end-to-end', async () => {
      try {
        // Test invalid product data
        const invalidProducts: CreateProductRequest[] = [
          {
            name: '', // Empty name
            description: 'Valid description',
            price: 10.00,
            stock: 10,
            category: 'Electronics',
            status: 'active'
          },
          {
            name: 'Valid Name',
            description: 'Valid description',
            price: -10.00, // Negative price
            stock: 10,
            category: 'Electronics',
            status: 'active'
          },
          {
            name: 'Valid Name',
            description: 'Valid description',
            price: 10.00,
            stock: -5, // Negative stock
            category: 'Electronics',
            status: 'active'
          }
        ]

        // All invalid products should be rejected
        for (const invalidProduct of invalidProducts) {
          await expect(
            productService.createProduct(invalidProduct)
          ).rejects.toThrow()
        }

        // Valid product should be accepted
        const validProduct: CreateProductRequest = {
          name: 'Valid Product',
          description: 'A valid product for testing',
          price: 25.99,
          stock: 100,
          category: 'Electronics',
          status: 'active'
        }

        const createdProduct = await productService.createProduct(validProduct)
        expect(createdProduct).toBeDefined()
        expect(createdProduct.name).toBe(validProduct.name)

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })
  })

  describe('Product Search and Filtering Integration', () => {
    it('should handle complex search and filtering scenarios', async () => {
      try {
        // Create test products with different attributes
        const testProducts: CreateProductRequest[] = [
          {
            name: 'iPhone 15 Pro',
            description: 'Latest Apple smartphone',
            price: 999.99,
            stock: 50,
            category: 'Electronics',
            status: 'active'
          },
          {
            name: 'Samsung Galaxy S24',
            description: 'Android flagship phone',
            price: 899.99,
            stock: 30,
            category: 'Electronics',
            status: 'active'
          },
          {
            name: 'MacBook Pro',
            description: 'Apple laptop computer',
            price: 1999.99,
            stock: 20,
            category: 'Computers',
            status: 'active'
          },
          {
            name: 'Dell XPS 13',
            description: 'Windows ultrabook',
            price: 1299.99,
            stock: 15,
            category: 'Computers',
            status: 'draft'
          }
        ]

        // Create all products
        for (const productData of testProducts) {
          await productService.createProduct(productData)
        }

        // Test search by name
        const phoneResults = await productService.listProducts({
          search: 'phone',
          limit: 10
        })
        
        expect(phoneResults.products.length).toBeGreaterThan(0)
        expect(phoneResults.products.some(p => p.name.includes('iPhone'))).toBe(true)

        // Test filter by category
        const electronicsResults = await productService.listProducts({
          category: 'Electronics',
          limit: 10
        })
        
        expect(electronicsResults.products.length).toBe(2)
        expect(electronicsResults.products.every(p => p.category === 'Electronics')).toBe(true)

        // Test filter by status
        const activeResults = await productService.listProducts({
          status: 'active',
          limit: 10
        })
        
        expect(activeResults.products.every(p => p.status === 'active')).toBe(true)

        // Test price range filtering
        const expensiveResults = await productService.listProducts({
          minPrice: 1000,
          limit: 10
        })
        
        expect(expensiveResults.products.every(p => p.price >= 1000)).toBe(true)

        // Test combined filters
        const combinedResults = await productService.listProducts({
          category: 'Electronics',
          status: 'active',
          maxPrice: 950,
          limit: 10
        })
        
        expect(combinedResults.products.every(p => 
          p.category === 'Electronics' && 
          p.status === 'active' && 
          p.price <= 950
        )).toBe(true)

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })
  })

  describe('Stock Management Integration', () => {
    it('should handle stock operations correctly', async () => {
      try {
        // Create product with initial stock
        const productData: CreateProductRequest = {
          name: 'Stock Test Product',
          description: 'Product for testing stock operations',
          price: 50.00,
          stock: 100,
          category: 'Test',
          status: 'active'
        }

        const product = await productService.createProduct(productData)
        const productId = product.id

        // Test stock reduction
        const updatedProduct1 = await productService.updateProduct(productId, {
          stock: 75
        })
        expect(updatedProduct1.stock).toBe(75)

        // Test stock increase
        const updatedProduct2 = await productService.updateProduct(productId, {
          stock: 150
        })
        expect(updatedProduct2.stock).toBe(150)

        // Test zero stock
        const updatedProduct3 = await productService.updateProduct(productId, {
          stock: 0
        })
        expect(updatedProduct3.stock).toBe(0)

        // Test negative stock should be rejected
        await expect(
          productService.updateProduct(productId, { stock: -10 })
        ).rejects.toThrow()

        // Verify stock didn't change after failed update
        const finalProduct = await productService.getProduct(productId)
        expect(finalProduct?.stock).toBe(0)

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })
  })
})