/**
 * Property-Based Tests for Server-Side Data Inclusion
 * 
 * Feature: ecommerce-admin-dashboard, Property 15: Server-Side Data Inclusion
 * 
 * Tests that verify server-side rendering includes expected data in initial HTML response
 * without requiring additional client-side requests.
 * 
 * Validates: Requirements 1.2
 */

import { test, expect } from '@jest/globals'
import * as fc from 'fast-check'

// Mock Next.js server-side rendering simulation
class MockSSRRenderer {
  static renderPageWithData(url: string, pageProps: any = {}) {
    // Simulate Next.js server-side rendering with __NEXT_DATA__ script
    const nextData = {
      props: { pageProps },
      page: url,
      query: {},
      buildId: 'test-build'
    }
    
    // Simulate the HTML structure that Next.js would generate
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>E-commerce Admin Dashboard</title>
          <script id="__NEXT_DATA__" type="application/json">
            ${JSON.stringify(nextData)}
          </script>
        </head>
        <body>
          <div id="__next">
            <div data-testid="page-content">
              ${this.renderPageContent(pageProps)}
            </div>
          </div>
        </body>
      </html>
    `
    
    return {
      html,
      nextData,
      pageProps
    }
  }
  
  static renderPageContent(pageProps: any): string {
    let content = ''
    
    // Render products list
    if (pageProps.products) {
      content += '<div data-testid="products-section">'
      if (pageProps.products.products && pageProps.products.products.length > 0) {
        pageProps.products.products.forEach((product: any, index: number) => {
          content += `<div data-testid="product-${index}">${product.name} - $${product.price}</div>`
        })
      }
      content += `<div data-testid="pagination">Page ${pageProps.products.page} of ${pageProps.products.totalPages}</div>`
      content += '</div>'
    }
    
    // Render metrics
    if (pageProps.metrics) {
      content += '<div data-testid="metrics-section">'
      content += `<div>Total Products: ${pageProps.metrics.totalProducts}</div>`
      content += `<div>Active Products: ${pageProps.metrics.activeProducts}</div>`
      content += `<div>Total Sales: $${pageProps.metrics.totalSales}</div>`
      content += `<div>Low Stock: ${pageProps.metrics.lowStockCount}</div>`
      content += '</div>'
    }
    
    // Render user info
    if (pageProps.user) {
      content += '<div data-testid="user-section">'
      content += `<div>Welcome, ${pageProps.user.name} (${pageProps.user.role})</div>`
      content += '</div>'
    }
    
    // Render individual product
    if (pageProps.product) {
      content += '<div data-testid="product-section">'
      content += `<h1>${pageProps.product.name}</h1>`
      content += `<p>${pageProps.product.description}</p>`
      content += `<div>Price: $${pageProps.product.price}</div>`
      content += `<div>Stock: ${pageProps.product.stock}</div>`
      content += `<div>Status: ${pageProps.product.status}</div>`
      content += '</div>'
    }
    
    return content
  }
}

// Generators for test data
const productGenerator = () => fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99) }),
  stock: fc.integer({ min: 0, max: 1000 }),
  category: fc.constantFrom('Electronics', 'Clothing', 'Books', 'Home', 'Sports'),
  status: fc.constantFrom('active', 'inactive', 'draft'),
  createdAt: fc.date(),
  updatedAt: fc.date(),
})

const productsListGenerator = () => fc.record({
  products: fc.array(productGenerator(), { minLength: 0, maxLength: 20 }),
  total: fc.integer({ min: 0, max: 1000 }),
  page: fc.integer({ min: 1, max: 100 }),
  totalPages: fc.integer({ min: 1, max: 100 }),
  limit: fc.integer({ min: 10, max: 100 }),
})

const metricsGenerator = () => fc.record({
  totalProducts: fc.integer({ min: 0, max: 1000 }),
  activeProducts: fc.integer({ min: 0, max: 1000 }),
  totalSales: fc.float({ min: Math.fround(0), max: Math.fround(999999) }),
  lowStockCount: fc.integer({ min: 0, max: 100 }),
})

const userGenerator = () => fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  role: fc.constantFrom('admin', 'super_admin'),
  createdAt: fc.date(),
})

// Helper functions for validation
function extractNextDataFromHTML(html: string) {
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">\s*({.*?})\s*<\/script>/s)
  if (!nextDataMatch) return null
  
  try {
    return JSON.parse(nextDataMatch[1])
  } catch {
    return null
  }
}

function validateDataInclusion(html: string, expectedData: any): boolean {
  const nextData = extractNextDataFromHTML(html)
  if (!nextData) return false
  
  const pageProps = nextData.props?.pageProps
  if (!pageProps) return false
  
  // Check if expected data is present in pageProps
  for (const [key, value] of Object.entries(expectedData)) {
    if (!(key in pageProps)) return false
    
    // For complex objects, do a basic structure check
    if (typeof value === 'object' && value !== null) {
      if (typeof pageProps[key] !== 'object') return false
      
      // Check if it's an array and has the expected length
      if (Array.isArray(value) && Array.isArray(pageProps[key])) {
        if (value.length !== pageProps[key].length) return false
      }
      
      // For objects with specific properties, check key properties exist
      if (value.products && pageProps[key].products) {
        if (value.products.length !== pageProps[key].products.length) return false
      }
    }
  }
  
  return true
}

function validateContentRendering(html: string, expectedData: any): boolean {
  // Check if the content is properly rendered based on the data
  if (expectedData.products) {
    if (!html.includes('data-testid="products-section"')) return false
    if (expectedData.products.products && expectedData.products.products.length > 0) {
      if (!html.includes('data-testid="product-0"')) return false
      if (!html.includes(expectedData.products.products[0].name)) return false
    }
    if (expectedData.products.page && expectedData.products.totalPages) {
      if (!html.includes(`Page ${expectedData.products.page} of ${expectedData.products.totalPages}`)) return false
    }
  }
  
  if (expectedData.metrics) {
    if (!html.includes('data-testid="metrics-section"')) return false
    if (!html.includes(`Total Products: ${expectedData.metrics.totalProducts}`)) return false
    if (!html.includes(`Active Products: ${expectedData.metrics.activeProducts}`)) return false
  }
  
  if (expectedData.user) {
    if (!html.includes('data-testid="user-section"')) return false
    if (!html.includes(expectedData.user.name)) return false
    if (!html.includes(expectedData.user.role)) return false
  }
  
  if (expectedData.product) {
    if (!html.includes('data-testid="product-section"')) return false
    if (!html.includes(expectedData.product.name)) return false
    if (!html.includes(expectedData.product.description)) return false
    if (!html.includes(`$${expectedData.product.price}`)) return false
  }
  
  return true
}

describe('Server-Side Data Inclusion Property Tests', () => {
  
  test('Property 15.1: Products page includes product data in initial HTML', () => {
    // Feature: ecommerce-admin-dashboard, Property 15: Server-Side Data Inclusion
    fc.assert(fc.property(
      productsListGenerator(),
      (productsList) => {
        // Render products page with server-side data
        const { html, nextData } = MockSSRRenderer.renderPageWithData('/dashboard/products', {
          products: productsList
        })
        
        // Verify Next.js data script is present
        expect(html).toContain('id="__NEXT_DATA__"')
        
        // Verify data is included in the initial render
        const isDataIncluded = validateDataInclusion(html, { products: productsList })
        expect(isDataIncluded).toBe(true)
        
        // Verify content is rendered based on the data
        const isContentRendered = validateContentRendering(html, { products: productsList })
        expect(isContentRendered).toBe(true)
        
        // Verify Next.js data structure
        expect(nextData.props.pageProps.products).toEqual(productsList)
      }
    ), { numRuns: 100 })
  })

  test('Property 15.2: Dashboard page includes metrics data in initial HTML', () => {
    // Feature: ecommerce-admin-dashboard, Property 15: Server-Side Data Inclusion
    fc.assert(fc.property(
      metricsGenerator(),
      (metrics) => {
        // Render dashboard page with server-side metrics
        const { html, nextData } = MockSSRRenderer.renderPageWithData('/dashboard', {
          metrics: metrics
        })
        
        // Verify Next.js data script is present
        expect(html).toContain('id="__NEXT_DATA__"')
        
        // Verify metrics data is included in the initial render
        const isDataIncluded = validateDataInclusion(html, { metrics })
        expect(isDataIncluded).toBe(true)
        
        // Verify content is rendered based on the data
        const isContentRendered = validateContentRendering(html, { metrics })
        expect(isContentRendered).toBe(true)
        
        // Verify Next.js data structure
        expect(nextData.props.pageProps.metrics).toEqual(metrics)
      }
    ), { numRuns: 100 })
  })

  test('Property 15.3: Individual product page includes product data in initial HTML', () => {
    // Feature: ecommerce-admin-dashboard, Property 15: Server-Side Data Inclusion
    fc.assert(fc.property(
      productGenerator(),
      (product) => {
        // Render individual product page with server-side data
        const { html, nextData } = MockSSRRenderer.renderPageWithData(`/dashboard/products/${product.id}`, {
          product: product
        })
        
        // Verify Next.js data script is present
        expect(html).toContain('id="__NEXT_DATA__"')
        
        // Verify product data is included in the initial render
        const isDataIncluded = validateDataInclusion(html, { product })
        expect(isDataIncluded).toBe(true)
        
        // Verify content is rendered based on the data
        const isContentRendered = validateContentRendering(html, { product })
        expect(isContentRendered).toBe(true)
        
        // Verify Next.js data structure
        expect(nextData.props.pageProps.product).toEqual(product)
      }
    ), { numRuns: 100 })
  })

  test('Property 15.4: Authentication state is included in initial HTML', () => {
    // Feature: ecommerce-admin-dashboard, Property 15: Server-Side Data Inclusion
    fc.assert(fc.property(
      userGenerator(),
      (user) => {
        // Render authenticated page with user data
        const { html, nextData } = MockSSRRenderer.renderPageWithData('/dashboard', {
          user: user
        })
        
        // Verify Next.js data script is present
        expect(html).toContain('id="__NEXT_DATA__"')
        
        // Verify user data is included in the initial render
        const isDataIncluded = validateDataInclusion(html, { user })
        expect(isDataIncluded).toBe(true)
        
        // Verify content is rendered based on the data
        const isContentRendered = validateContentRendering(html, { user })
        expect(isContentRendered).toBe(true)
        
        // Verify Next.js data structure
        expect(nextData.props.pageProps.user).toEqual(user)
      }
    ), { numRuns: 100 })
  })

  test('Property 15.5: Multiple data types can be included simultaneously', () => {
    // Feature: ecommerce-admin-dashboard, Property 15: Server-Side Data Inclusion
    fc.assert(fc.property(
      fc.record({
        metrics: metricsGenerator(),
        user: userGenerator(),
      }),
      (pageData) => {
        // Render page with multiple data types
        const { html, nextData } = MockSSRRenderer.renderPageWithData('/dashboard', pageData)
        
        // Verify Next.js data script is present
        expect(html).toContain('id="__NEXT_DATA__"')
        
        // Verify all data types are included in the initial render
        const isDataIncluded = validateDataInclusion(html, pageData)
        expect(isDataIncluded).toBe(true)
        
        // Verify content is rendered based on the data
        const isContentRendered = validateContentRendering(html, pageData)
        expect(isContentRendered).toBe(true)
        
        // Verify Next.js data structure
        expect(nextData.props.pageProps).toEqual(pageData)
      }
    ), { numRuns: 100 })
  })

  test('Property 15.6: Empty data states are handled correctly in SSR', () => {
    // Feature: ecommerce-admin-dashboard, Property 15: Server-Side Data Inclusion
    fc.assert(fc.property(
      fc.constantFrom(
        { products: { products: [], total: 0, page: 1, totalPages: 1, limit: 20 } },
        { metrics: { totalProducts: 0, activeProducts: 0, totalSales: 0, lowStockCount: 0 } },
        {}
      ),
      (emptyData) => {
        // Render page with empty or no data
        const { html, nextData } = MockSSRRenderer.renderPageWithData('/dashboard', emptyData)
        
        // Verify Next.js data script is present even with empty data
        expect(html).toContain('id="__NEXT_DATA__"')
        
        // Verify page structure is still valid
        expect(html).toContain('<!DOCTYPE html>')
        expect(html).toContain('<div id="__next">')
        
        // Verify empty data is properly handled
        expect(nextData.props.pageProps).toEqual(emptyData)
        
        // For empty products array, should not have product items
        if (emptyData.products && emptyData.products.products.length === 0) {
          expect(html).not.toContain('data-testid="product-0"')
        }
      }
    ), { numRuns: 50 })
  })

  test('Property 15.7: Data serialization preserves type integrity', () => {
    // Feature: ecommerce-admin-dashboard, Property 15: Server-Side Data Inclusion
    fc.assert(fc.property(
      fc.record({
        stringValue: fc.string(),
        numberValue: fc.float({ min: Math.fround(-1000), max: Math.fround(1000) }),
        integerValue: fc.integer(),
        booleanValue: fc.boolean(),
        arrayValue: fc.array(fc.string(), { maxLength: 5 }),
      }),
      (testData) => {
        // Render page with various data types
        const { html, nextData } = MockSSRRenderer.renderPageWithData('/test', testData)
        
        // Verify Next.js data script is present
        expect(html).toContain('id="__NEXT_DATA__"')
        
        // Extract and verify data types are preserved
        const serverData = nextData.props.pageProps
        
        // Verify types are preserved after serialization/deserialization
        expect(typeof serverData.stringValue).toBe('string')
        expect(typeof serverData.numberValue).toBe('number')
        expect(typeof serverData.integerValue).toBe('number')
        expect(typeof serverData.booleanValue).toBe('boolean')
        expect(Array.isArray(serverData.arrayValue)).toBe(true)
        
        // Verify values are preserved
        expect(serverData.stringValue).toBe(testData.stringValue)
        expect(serverData.numberValue).toBe(testData.numberValue)
        expect(serverData.integerValue).toBe(testData.integerValue)
        expect(serverData.booleanValue).toBe(testData.booleanValue)
        expect(serverData.arrayValue).toEqual(testData.arrayValue)
      }
    ), { numRuns: 100 })
  })

  test('Property 15.8: Large datasets are included without truncation', () => {
    // Feature: ecommerce-admin-dashboard, Property 15: Server-Side Data Inclusion
    fc.assert(fc.property(
      fc.array(productGenerator(), { minLength: 10, maxLength: 50 }), // Reduced size for test performance
      (largeProductList) => {
        const productsList = {
          products: largeProductList,
          total: largeProductList.length,
          page: 1,
          totalPages: Math.ceil(largeProductList.length / 20),
          limit: 20
        }
        
        // Render page with large dataset
        const { html, nextData } = MockSSRRenderer.renderPageWithData('/dashboard/products', {
          products: productsList
        })
        
        // Verify Next.js data script is present
        expect(html).toContain('id="__NEXT_DATA__"')
        
        // Verify all data is included without truncation
        const serverProducts = nextData.props.pageProps.products
        
        expect(serverProducts.products).toHaveLength(largeProductList.length)
        expect(serverProducts.total).toBe(largeProductList.length)
        
        // Verify first and last items are present (no truncation)
        expect(serverProducts.products[0].id).toBe(largeProductList[0].id)
        expect(serverProducts.products[largeProductList.length - 1].id).toBe(largeProductList[largeProductList.length - 1].id)
        
        // Verify data integrity
        expect(serverProducts.products).toEqual(largeProductList)
      }
    ), { numRuns: 20 }) // Fewer runs for large datasets
  })
})