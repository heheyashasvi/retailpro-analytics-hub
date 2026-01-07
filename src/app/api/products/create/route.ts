import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/services/product'
import { ImageService } from '@/services/image'
import { requireAuth } from '@/lib/auth-middleware'
import { 
  withApiMiddleware, 
  createSuccessResponse, 
  ApiError,
  productValidationSchemas 
} from '@/lib/api-middleware'
import { validateImageFile, sanitizeFilename } from '@/lib/input-sanitizer'
import { z } from 'zod'

// Schema for multipart form data
const createProductFormSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(2000), // Make required
  price: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0).max(999999.99)),
  costPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  stock: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(0).max(999999)),
  lowStockThreshold: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(0)),
  category: z.string().min(1).max(100),
  status: z.enum(['active', 'inactive', 'draft']),
  specifications: z.string().transform(val => val ? JSON.parse(val) : {}).optional(),
  tags: z.string().transform(val => val ? JSON.parse(val) : []).optional(),
  primaryImageIndex: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(0)).default('0'),
})

async function handleCreateProduct(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('multipart/form-data')) {
      throw new ApiError('INVALID_CONTENT_TYPE', 'Content-Type must be multipart/form-data', 400)
    }
    
    const formData = await request.formData()
    
    // Extract and validate form data
    const formFields: Record<string, any> = {}
    const images: File[] = []
    const altTexts: string[] = []
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_')) {
        const file = value as File
        
        // Validate image file
        const imageValidation = validateImageFile(file)
        if (!imageValidation.isValid) {
          throw new ApiError(
            'INVALID_IMAGE',
            `Invalid image file: ${file.name}`,
            400,
            { errors: imageValidation.errors }
          )
        }
        
        images.push(file)
      } else if (key.startsWith('altText_')) {
        altTexts.push(value as string)
      } else {
        formFields[key] = value
      }
    }
    
    // Validate form fields
    const validationResult = createProductFormSchema.safeParse(formFields)
    if (!validationResult.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Invalid form data',
        400,
        { errors: validationResult.error.errors }
      )
    }
    
    const productData = validationResult.data
    
    // Validate that we have at least one image
    if (images.length === 0) {
      throw new ApiError('NO_IMAGES', 'At least one image is required', 400)
    }
    
    // Validate primary image index
    if (productData.primaryImageIndex >= images.length) {
      throw new ApiError('INVALID_PRIMARY_INDEX', 'Primary image index is out of range', 400)
    }
    
    // Upload images with error handling
    const imageService = new ImageService()
    const uploadedImages = []
    const uploadErrors: string[] = []
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      const altText = altTexts[i] || ''
      
      try {
        // Sanitize filename
        const sanitizedFilename = sanitizeFilename(image.name)
        
        const uploadResult = await imageService.uploadImage(image, {
          filename: sanitizedFilename,
          size: image.size,
          mimeType: image.type
        })
        
        uploadedImages.push({
          url: uploadResult.url,
          altText,
          isPrimary: i === productData.primaryImageIndex
        })
      } catch (error) {
        console.error('Image upload failed:', error)
        uploadErrors.push(`Failed to upload ${image.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // If any image uploads failed, return error
    if (uploadErrors.length > 0) {
      throw new ApiError(
        'IMAGE_UPLOAD_FAILED',
        'Some images failed to upload',
        500,
        { errors: uploadErrors }
      )
    }
    
    // Create product with uploaded images
    const productService = new ProductService()
    const product = await productService.createProduct({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      costPrice: productData.costPrice,
      stock: productData.stock,
      lowStockThreshold: productData.lowStockThreshold,
      category: productData.category,
      status: productData.status,
      specifications: productData.specifications,
      tags: productData.tags,
      images: uploadedImages
    })

    return createSuccessResponse(product, 201)

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    if (error instanceof Error) {
      throw new ApiError('PRODUCT_CREATION_FAILED', error.message, 400)
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Failed to create product', 500)
  }
}

export const POST = withApiMiddleware(handleCreateProduct, {
  rateLimit: 'upload',
  requireAuth: true,
})