/**
 * Basic setup test to verify the project configuration
 */

describe('Project Setup', () => {
  it('should have proper TypeScript configuration', () => {
    // Test that TypeScript types are working
    const testString: string = 'Hello, World!'
    const testNumber: number = 42
    
    expect(typeof testString).toBe('string')
    expect(typeof testNumber).toBe('number')
  })

  it('should have Jest configured correctly', () => {
    expect(true).toBe(true)
  })

  it('should be able to import utility functions', async () => {
    const { cn, formatCurrency } = await import('@/lib/utils')
    
    expect(typeof cn).toBe('function')
    expect(typeof formatCurrency).toBe('function')
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('should be able to import types', async () => {
    const types = await import('@/types')
    
    expect(types).toBeDefined()
  })
})