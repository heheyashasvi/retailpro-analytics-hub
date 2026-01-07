// Feature: ecommerce-admin-dashboard, Property 4: Form Validation Prevents Invalid Progression
import * as fc from 'fast-check'
import { productFormSchema, ProductFormData } from '@/components/products/multi-step-form'
import { z } from 'zod'

describe('Multi-Step Form Validation Properties', () => {
  // Property 4: Form Validation Prevents Invalid Progression
  test('form validation prevents invalid progression to next step', () => {
    fc.assert(fc.property(
      // Generate simple invalid cases
      fc.oneof(
        // Invalid step1
        fc.record({
          step1: fc.record({
            name: fc.constant(''), // Empty name
            category: fc.constantFrom('Electronics', 'Clothing'),
            status: fc.constantFrom('active', 'draft')
          })
        }),
        // Invalid step2  
        fc.record({
          step2: fc.record({
            description: fc.constant('short'), // Too short description
            specifications: fc.record({}),
            tags: fc.array(fc.string())
          })
        }),
        // Invalid step3
        fc.record({
          step3: fc.record({
            images: fc.constant([]), // No images
            primaryImageIndex: fc.constant(0),
            altTexts: fc.constant([])
          })
        }),
        // Invalid step4
        fc.record({
          step4: fc.record({
            price: fc.constant(0), // Zero price
            costPrice: fc.constant(0),
            stock: fc.constant(0),
            lowStockThreshold: fc.constant(0)
          })
        })
      ),
      (invalidData) => {
        // Test validation for the provided step
        if ('step1' in invalidData) {
          const result = productFormSchema.shape.step1.safeParse(invalidData.step1)
          expect(result.success).toBe(false)
        }
        if ('step2' in invalidData) {
          const result = productFormSchema.shape.step2.safeParse(invalidData.step2)
          expect(result.success).toBe(false)
        }
        if ('step3' in invalidData) {
          const result = productFormSchema.shape.step3.safeParse(invalidData.step3)
          expect(result.success).toBe(false)
        }
        if ('step4' in invalidData) {
          const result = productFormSchema.shape.step4.safeParse(invalidData.step4)
          expect(result.success).toBe(false)
        }
      }
    ), { numRuns: 20 })
  })

  test('valid form data passes validation for each step', () => {
    fc.assert(fc.property(
      // Generate simple valid form data
      fc.record({
        step1: fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          category: fc.constantFrom('Electronics', 'Clothing', 'Books'),
          status: fc.constantFrom('active', 'inactive', 'draft')
        }),
        step2: fc.record({
          description: fc.string({ minLength: 10, maxLength: 100 }),
          specifications: fc.record({}),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 })
        }),
        step3: fc.record({
          images: fc.array(fc.constant(new File([''], 'test.jpg', { type: 'image/jpeg' })), { minLength: 1, maxLength: 2 }),
          primaryImageIndex: fc.constant(0),
          altTexts: fc.array(fc.string({ maxLength: 50 }), { minLength: 1, maxLength: 2 })
        }),
        step4: fc.record({
          price: fc.float({ min: Math.fround(1), max: Math.fround(100) }),
          costPrice: fc.float({ min: Math.fround(0), max: Math.fround(50) }),
          stock: fc.integer({ min: 0, max: 100 }),
          lowStockThreshold: fc.integer({ min: 0, max: 20 })
        })
      }),
      (validData) => {
        // Ensure arrays have matching lengths for step3
        const imageCount = validData.step3.images.length
        validData.step3.altTexts = validData.step3.altTexts.slice(0, imageCount)
        while (validData.step3.altTexts.length < imageCount) {
          validData.step3.altTexts.push('')
        }

        // Test full form validation
        const result = productFormSchema.safeParse(validData)
        expect(result.success).toBe(true)
      }
    ), { numRuns: 10 })
  })

  test('step progression validation maintains data integrity', () => {
    fc.assert(fc.property(
      fc.record({
        step1: fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          category: fc.constantFrom('Electronics', 'Clothing'),
          status: fc.constantFrom('active', 'draft')
        }),
        step2: fc.record({
          description: fc.string({ minLength: 10, maxLength: 100 }),
          specifications: fc.record({}),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 15 }), { maxLength: 2 })
        })
      }),
      (partialData) => {
        // Test that partial valid data can be validated step by step
        const step1Result = productFormSchema.shape.step1.safeParse(partialData.step1)
        const step2Result = productFormSchema.shape.step2.safeParse(partialData.step2)
        
        expect(step1Result.success).toBe(true)
        expect(step2Result.success).toBe(true)
        
        // Data should remain unchanged after validation
        if (step1Result.success) {
          expect(step1Result.data).toEqual(partialData.step1)
        }
        if (step2Result.success) {
          expect(step2Result.data).toEqual(partialData.step2)
        }
      }
    ), { numRuns: 10 })
  })
})

// Helper function to check if data contains intentionally invalid values
function hasInvalidData(data: any): boolean {
  if (data === null || data === undefined) return true
  
  if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) return true
      if (key === 'name' && (value === '' || (typeof value === 'string' && value.length > 255))) return true
      if (key === 'category' && value === '') return true
      if (key === 'description' && (value === '' || (typeof value === 'string' && value.length < 10))) return true
      if (key === 'images' && Array.isArray(value) && value.length === 0) return true
      if (key === 'price' && (typeof value === 'number' && value <= 0)) return true
      if (key === 'stock' && (typeof value === 'number' && value < 0)) return true
      if (key === 'costPrice' && (typeof value === 'number' && value < 0)) return true
      if (key === 'lowStockThreshold' && (typeof value === 'number' && value < 0)) return true
      if (key === 'primaryImageIndex' && (typeof value === 'number' && value < 0)) return true
      if (key === 'status' && !['active', 'inactive', 'draft'].includes(value as string)) return true
    }
  }
  
  return false
}