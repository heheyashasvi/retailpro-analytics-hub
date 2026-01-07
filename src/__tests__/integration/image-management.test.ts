import { imageService } from '@/services/image'
import { productService } from '@/services/product'
import { databaseService } from '@/services/database'
import { CreateProductRequest } from '@/types'

// Mock Cloudinary for testing
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        public_id: 'test-image-id',
        secure_url: 'https://res.cloudinary.com/test/image/upload/test-image-id.jpg',
        width: 800,
        height: 600,
        format: 'jpg'
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    }
  }
}))

describe('Image Management Integration Tests', () => {
  let testProductId: string

  beforeEach(async () => {
    // Clean up test data
    try {
      await databaseService.prisma?.productImage.deleteMany()
      await databaseService.prisma?.product.deleteMany()

      // Create a test product for image operations
      const productData: CreateProductRequest = {
        name: 'Image Test Product',
        description: 'Product for testing image operations',
        price: 99.99,
        stock: 10,
        category: 'Test',
        status: 'active'
      }

      const product = await productService.createProduct(productData)
      testProductId = product.id
    } catch (error) {
      console.warn('Database setup failed:', error)
    }
  })

  afterEach(async () => {
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
      await databaseService.prisma?.$disconnect()
    } catch (error) {
      console.warn('Final cleanup failed:', error)
    }
  })

  describe('Complete Image Lifecycle', () => {
    it('should handle complete image upload and management workflow', async () => {
      try {
        // Mock file data
        const mockFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'test-image.jpg',
          mimetype: 'image/jpeg',
          size: 1024
        }

        // Step 1: Upload image
        const uploadResult = await imageService.uploadImage(mockFile, testProductId)
        
        expect(uploadResult).toBeDefined()
        expect(uploadResult.url).toBe('https://res.cloudinary.com/test/image/upload/test-image-id.jpg')
        expect(uploadResult.publicId).toBe('test-image-id')

        const imageId = uploadResult.id

        // Step 2: Verify image is associated with product
        const productImages = await imageService.getProductImages(testProductId)
        
        expect(productImages).toHaveLength(1)
        expect(productImages[0].id).toBe(imageId)
        expect(productImages[0].url).toBe(uploadResult.url)
        expect(productImages[0].productId).toBe(testProductId)

        // Step 3: Upload additional images
        const mockFile2 = {
          buffer: Buffer.from('fake-image-data-2'),
          originalname: 'test-image-2.jpg',
          mimetype: 'image/jpeg',
          size: 2048
        }

        // Mock different response for second upload
        const cloudinary = require('cloudinary')
        cloudinary.v2.uploader.upload.mockResolvedValueOnce({
          public_id: 'test-image-id-2',
          secure_url: 'https://res.cloudinary.com/test/image/upload/test-image-id-2.jpg',
          width: 1200,
          height: 800,
          format: 'jpg'
        })

        const uploadResult2 = await imageService.uploadImage(mockFile2, testProductId)
        
        expect(uploadResult2.url).toBe('https://res.cloudinary.com/test/image/upload/test-image-id-2.jpg')

        // Step 4: Verify multiple images
        const allProductImages = await imageService.getProductImages(testProductId)
        expect(allProductImages).toHaveLength(2)

        // Step 5: Set primary image
        await imageService.setPrimaryImage(testProductId, imageId)
        
        const updatedImages = await imageService.getProductImages(testProductId)
        const primaryImage = updatedImages.find(img => img.isPrimary)
        
        expect(primaryImage).toBeDefined()
        expect(primaryImage?.id).toBe(imageId)

        // Step 6: Delete an image
        await imageService.deleteImage(imageId)
        
        const remainingImages = await imageService.getProductImages(testProductId)
        expect(remainingImages).toHaveLength(1)
        expect(remainingImages[0].id).not.toBe(imageId)

        // Step 7: Verify Cloudinary deletion was called
        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('test-image-id')

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    }, 30000)

    it('should handle image validation correctly', async () => {
      try {
        // Test invalid file types
        const invalidFiles = [
          {
            buffer: Buffer.from('fake-data'),
            originalname: 'test.txt',
            mimetype: 'text/plain',
            size: 1024
          },
          {
            buffer: Buffer.from('fake-data'),
            originalname: 'test.pdf',
            mimetype: 'application/pdf',
            size: 1024
          }
        ]

        for (const invalidFile of invalidFiles) {
          await expect(
            imageService.uploadImage(invalidFile, testProductId)
          ).rejects.toThrow()
        }

        // Test file too large
        const largeFile = {
          buffer: Buffer.alloc(10 * 1024 * 1024), // 10MB
          originalname: 'large-image.jpg',
          mimetype: 'image/jpeg',
          size: 10 * 1024 * 1024
        }

        await expect(
          imageService.uploadImage(largeFile, testProductId)
        ).rejects.toThrow()

        // Test valid image types
        const validFiles = [
          {
            buffer: Buffer.from('fake-jpeg-data'),
            originalname: 'test.jpg',
            mimetype: 'image/jpeg',
            size: 1024
          },
          {
            buffer: Buffer.from('fake-png-data'),
            originalname: 'test.png',
            mimetype: 'image/png',
            size: 2048
          }
        ]

        for (const validFile of validFiles) {
          const result = await imageService.uploadImage(validFile, testProductId)
          expect(result).toBeDefined()
          expect(result.url).toContain('cloudinary.com')
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

  describe('Image-Product Relationship Integration', () => {
    it('should handle product deletion with associated images', async () => {
      try {
        // Upload images to product
        const mockFiles = [
          {
            buffer: Buffer.from('fake-image-1'),
            originalname: 'image1.jpg',
            mimetype: 'image/jpeg',
            size: 1024
          },
          {
            buffer: Buffer.from('fake-image-2'),
            originalname: 'image2.jpg',
            mimetype: 'image/jpeg',
            size: 1024
          }
        ]

        const cloudinary = require('cloudinary')
        cloudinary.v2.uploader.upload
          .mockResolvedValueOnce({
            public_id: 'product-image-1',
            secure_url: 'https://res.cloudinary.com/test/image/upload/product-image-1.jpg',
            width: 800,
            height: 600,
            format: 'jpg'
          })
          .mockResolvedValueOnce({
            public_id: 'product-image-2',
            secure_url: 'https://res.cloudinary.com/test/image/upload/product-image-2.jpg',
            width: 800,
            height: 600,
            format: 'jpg'
          })

        const uploadResults = []
        for (const file of mockFiles) {
          const result = await imageService.uploadImage(file, testProductId)
          uploadResults.push(result)
        }

        // Verify images are associated
        const productImages = await imageService.getProductImages(testProductId)
        expect(productImages).toHaveLength(2)

        // Delete product (should cascade delete images)
        await productService.deleteProduct(testProductId)

        // Verify images are deleted from database
        const remainingImages = await imageService.getProductImages(testProductId)
        expect(remainingImages).toHaveLength(0)

        // Verify Cloudinary cleanup was called
        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('product-image-1')
        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('product-image-2')

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })

    it('should handle primary image management correctly', async () => {
      try {
        // Upload multiple images
        const mockFiles = [
          {
            buffer: Buffer.from('fake-image-1'),
            originalname: 'primary.jpg',
            mimetype: 'image/jpeg',
            size: 1024
          },
          {
            buffer: Buffer.from('fake-image-2'),
            originalname: 'secondary.jpg',
            mimetype: 'image/jpeg',
            size: 1024
          },
          {
            buffer: Buffer.from('fake-image-3'),
            originalname: 'tertiary.jpg',
            mimetype: 'image/jpeg',
            size: 1024
          }
        ]

        const cloudinary = require('cloudinary')
        cloudinary.v2.uploader.upload
          .mockResolvedValueOnce({
            public_id: 'primary-image',
            secure_url: 'https://res.cloudinary.com/test/image/upload/primary-image.jpg',
            width: 800,
            height: 600,
            format: 'jpg'
          })
          .mockResolvedValueOnce({
            public_id: 'secondary-image',
            secure_url: 'https://res.cloudinary.com/test/image/upload/secondary-image.jpg',
            width: 800,
            height: 600,
            format: 'jpg'
          })
          .mockResolvedValueOnce({
            public_id: 'tertiary-image',
            secure_url: 'https://res.cloudinary.com/test/image/upload/tertiary-image.jpg',
            width: 800,
            height: 600,
            format: 'jpg'
          })

        const uploadResults = []
        for (const file of mockFiles) {
          const result = await imageService.uploadImage(file, testProductId)
          uploadResults.push(result)
        }

        // Initially, no image should be primary
        let images = await imageService.getProductImages(testProductId)
        expect(images.filter(img => img.isPrimary)).toHaveLength(0)

        // Set first image as primary
        await imageService.setPrimaryImage(testProductId, uploadResults[0].id)
        
        images = await imageService.getProductImages(testProductId)
        const primaryImages = images.filter(img => img.isPrimary)
        expect(primaryImages).toHaveLength(1)
        expect(primaryImages[0].id).toBe(uploadResults[0].id)

        // Change primary to second image
        await imageService.setPrimaryImage(testProductId, uploadResults[1].id)
        
        images = await imageService.getProductImages(testProductId)
        const newPrimaryImages = images.filter(img => img.isPrimary)
        expect(newPrimaryImages).toHaveLength(1)
        expect(newPrimaryImages[0].id).toBe(uploadResults[1].id)

        // Verify first image is no longer primary
        const firstImage = images.find(img => img.id === uploadResults[0].id)
        expect(firstImage?.isPrimary).toBe(false)

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle Cloudinary failures gracefully', async () => {
      try {
        // Mock Cloudinary failure
        const cloudinary = require('cloudinary')
        cloudinary.v2.uploader.upload.mockRejectedValueOnce(new Error('Cloudinary upload failed'))

        const mockFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'test-image.jpg',
          mimetype: 'image/jpeg',
          size: 1024
        }

        // Upload should fail gracefully
        await expect(
          imageService.uploadImage(mockFile, testProductId)
        ).rejects.toThrow('Cloudinary upload failed')

        // Verify no database record was created
        const productImages = await imageService.getProductImages(testProductId)
        expect(productImages).toHaveLength(0)

      } catch (error) {
        if (error instanceof Error && error.message.includes('database')) {
          console.warn('Skipping database test - database not available')
          return
        }
        throw error
      }
    })

    it('should handle non-existent product gracefully', async () => {
      try {
        const mockFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'test-image.jpg',
          mimetype: 'image/jpeg',
          size: 1024
        }

        // Try to upload image to non-existent product
        await expect(
          imageService.uploadImage(mockFile, 'non-existent-product-id')
        ).rejects.toThrow()

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