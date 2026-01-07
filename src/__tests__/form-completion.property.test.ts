// Feature: ecommerce-admin-dashboard, Property 5: Multi-Step Form Completion
import * as fc from 'fast-check'
import { productFormSchema, ProductFormData } from '@/components/products/multi-step-form'

describe('Multi-Step Form Completion Properties', () => {
  // Property 5: Multi-Step Form Completion
  test('complete valid form data passes full form validation', () => {
    fc.assert(fc.property(
      // Generate complete valid form data
      fc.record({
        step1: fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          category: fc.constantFrom('Electronics', 'Clothing', 'Books'),
          status: fc.constantFrom('active', 'inactive', 'draft')
        }),
        step2: fc.record({
          description: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
          specifications: fc.record({}),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim().length > 0), { maxLength: 3 })
        }),
        step3: fc.record({
          images: fc.array(
            fc.constant(new File(['test'], 'test.jpg', { type: 'image/jpeg' })),
            { minLength: 1, maxLength: 2 }
          ),
          primaryImageIndex: fc.constant(0),
          altTexts: fc.array(fc.string({ maxLength: 50 }), { minLength: 1, maxLength: 2 })
        }),
        step4: fc.record({
          price: fc.integer({ min: 1, max: 10000 }).map(n => n / 100), // 0.01 to 100.00
          costPrice: fc.integer({ min: 0, max: 5000 }).map(n => n / 100), // 0.00 to 50.00
          stock: fc.integer({ min: 0, max: 100 }),
          lowStockThreshold: fc.integer({ min: 0, max: 20 })
        })
      }),
      (formData) => {
        // Ensure data consistency
        const imageCount = formData.step3.images.length
        
        // Ensure altTexts array matches images array length
        while (formData.step3.altTexts.length < imageCount) {
          formData.step3.altTexts.push('')
        }
        formData.step3.altTexts = formData.step3.altTexts.slice(0, imageCount)

        // Test that complete form data passes validation
        const result = productFormSchema.safeParse(formData)
        expect(result.success).toBe(true)
        
        if (result.success) {
          // Verify all data is preserved correctly
          expect(result.data.step1.name).toBe(formData.step1.name)
          expect(result.data.step2.description).toBe(formData.step2.description)
          expect(result.data.step3.images).toHaveLength(formData.step3.images.length)
          expect(result.data.step4.price).toBe(formData.step4.price)
          expect(result.data.step4.stock).toBe(formData.step4.stock)
          
          // Verify primary image is correctly set
          expect(result.data.step3.primaryImageIndex).toBe(0)
        }
      }
    ), { numRuns: 20 })
  })

  test('form completion maintains data integrity across all steps', () => {
    fc.assert(fc.property(
      fc.record({
        step1: fc.record({
          name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          category: fc.constantFrom('Electronics', 'Books'),
          status: fc.constantFrom('active', 'inactive')
        }),
        step2: fc.record({
          description: fc.string({ minLength: 10, maxLength: 50 }).filter(s => s.trim().length >= 10),
          specifications: fc.record({}),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0), { maxLength: 2 })
        }),
        step3: fc.record({
          images: fc.array(
            fc.constant(new File(['test'], 'test.jpg', { type: 'image/jpeg' })),
            { minLength: 1, maxLength: 1 }
          ),
          primaryImageIndex: fc.constant(0),
          altTexts: fc.array(fc.string({ maxLength: 20 }), { minLength: 1, maxLength: 1 })
        }),
        step4: fc.record({
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(50), noNaN: true }),
          costPrice: fc.float({ min: Math.fround(0), max: Math.fround(25), noNaN: true }),
          stock: fc.integer({ min: 1, max: 20 }),
          lowStockThreshold: fc.integer({ min: 1, max: 5 })
        })
      }),
      (formData) => {
        // Test individual step validation
        const step1Result = productFormSchema.shape.step1.safeParse(formData.step1)
        const step2Result = productFormSchema.shape.step2.safeParse(formData.step2)
        const step3Result = productFormSchema.shape.step3.safeParse(formData.step3)
        const step4Result = productFormSchema.shape.step4.safeParse(formData.step4)
        
        expect(step1Result.success).toBe(true)
        expect(step2Result.success).toBe(true)
        expect(step3Result.success).toBe(true)
        expect(step4Result.success).toBe(true)
        
        // Test full form validation
        const fullResult = productFormSchema.safeParse(formData)
        expect(fullResult.success).toBe(true)
        
        if (fullResult.success) {
          // Verify data types are preserved
          expect(typeof fullResult.data.step1.name).toBe('string')
          expect(typeof fullResult.data.step2.description).toBe('string')
          expect(typeof fullResult.data.step4.price).toBe('number')
          expect(typeof fullResult.data.step4.stock).toBe('number')
          expect(Array.isArray(fullResult.data.step2.tags)).toBe(true)
          expect(Array.isArray(fullResult.data.step3.images)).toBe(true)
          
          // Verify numeric values are within expected ranges
          expect(fullResult.data.step4.price).toBeGreaterThan(0)
          expect(fullResult.data.step4.stock).toBeGreaterThanOrEqual(0)
        }
      }
    ), { numRuns: 15 })
  })

  test('form completion handles edge cases in data structure', () => {
    fc.assert(fc.property(
      fc.record({
        step1: fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          category: fc.constantFrom('Electronics', 'Clothing'),
          status: fc.constantFrom('active', 'draft')
        }),
        step2: fc.record({
          description: fc.string({ minLength: 10, maxLength: 30 }).filter(s => s.trim().length >= 10),
          specifications: fc.record({}),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 8 }).filter(s => s.trim().length > 0), { maxLength: 1 })
        }),
        step3: fc.record({
          images: fc.array(
            fc.constant(new File(['test'], 'test.jpg', { type: 'image/jpeg' })),
            { minLength: 1, maxLength: 1 }
          ),
          primaryImageIndex: fc.constant(0),
          altTexts: fc.array(fc.string({ maxLength: 15 }), { minLength: 1, maxLength: 1 })
        }),
        step4: fc.record({
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(20), noNaN: true }),
          costPrice: fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }),
          stock: fc.integer({ min: 0, max: 10 }),
          lowStockThreshold: fc.integer({ min: 0, max: 3 })
        })
      }),
      (formData) => {
        // Test that form handles edge cases properly
        const result = productFormSchema.safeParse(formData)
        expect(result.success).toBe(true)
        
        if (result.success) {
          // Test edge case: empty specifications
          expect(typeof result.data.step2.specifications).toBe('object')
          
          // Test edge case: single image
          expect(result.data.step3.images).toHaveLength(1)
          expect(result.data.step3.primaryImageIndex).toBe(0)
          
          // Test edge case: minimum values
          expect(result.data.step4.price).toBeGreaterThan(0)
          expect(result.data.step4.stock).toBeGreaterThanOrEqual(0)
          expect(result.data.step4.lowStockThreshold).toBeGreaterThanOrEqual(0)
        }
      }
    ), { numRuns: 10 })
  })
})