import { v2 as cloudinary } from 'cloudinary'
import { ImageMetadata, UploadResult, OptimizedImages } from '@/types'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export class ImageService {
  private readonly ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
  private readonly UPLOAD_FOLDER = 'ecommerce-products'

  // Upload image with validation and optimization
  async uploadImage(file: File, metadata: ImageMetadata): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file, metadata)

      // Convert File to buffer for upload
      const buffer = await this.fileToBuffer(file)

      // Upload to Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: this.UPLOAD_FOLDER,
            resource_type: 'image',
            format: 'auto', // Auto-optimize format
            quality: 'auto:good', // Auto-optimize quality
            fetch_format: 'auto', // Auto-select best format for browser
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' }, // Limit max size
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ],
            eager: [
              { width: 300, height: 300, crop: 'fill', gravity: 'center' }, // Thumbnail
              { width: 600, height: 600, crop: 'limit' }, // Medium size
            ],
            eager_async: false, // Generate transformations immediately
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(buffer)
      })

      // Generate optimized versions URLs
      const optimizedImages = this.generateOptimizedVersions(uploadResult.public_id)

      const result: UploadResult = {
        imageId: uploadResult.public_id,
        url: uploadResult.secure_url,
        thumbnailUrl: optimizedImages.thumbnail,
        metadata: {
          filename: metadata.filename,
          size: uploadResult.bytes,
          mimeType: `image/${uploadResult.format}`,
        }
      }

      return result
    } catch (error) {
      console.error('Image upload error:', error)
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Delete image from Cloudinary
  async deleteImage(imageId: string): Promise<void> {
    try {
      if (!imageId) {
        throw new Error('Image ID is required')
      }

      const result = await cloudinary.uploader.destroy(imageId)
      
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Failed to delete image: ${result.result}`)
      }
    } catch (error) {
      console.error('Image deletion error:', error)
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Generate optimized versions of an image
  generateOptimizedVersions(imageId: string): OptimizedImages {
    const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`
    
    return {
      thumbnail: `${baseUrl}/w_300,h_300,c_fill,g_center/${imageId}`,
      medium: `${baseUrl}/w_600,h_600,c_limit/${imageId}`,
      large: `${baseUrl}/w_1200,h_1200,c_limit/${imageId}`,
    }
  }

  // Get secure URL for an image
  async getSecureUrl(imageId: string): Promise<string> {
    try {
      if (!imageId) {
        throw new Error('Image ID is required')
      }

      // Generate secure URL with current timestamp
      const secureUrl = cloudinary.url(imageId, {
        secure: true,
        sign_url: true,
        type: 'upload',
      })

      return secureUrl
    } catch (error) {
      console.error('Get secure URL error:', error)
      throw new Error(`Failed to get secure URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Validate uploaded file
  private validateFile(file: File, metadata: ImageMetadata): void {
    // Check file size - use metadata.size if provided, otherwise use file.size
    // But if metadata.size is explicitly 0, that should be treated as invalid
    const fileSize = metadata.size !== undefined ? metadata.size : file.size
    if (fileSize > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    if (fileSize === 0) {
      throw new Error('File is empty')
    }

    // Validate filename first before trying to get extension
    if (!metadata.filename || metadata.filename.trim().length === 0) {
      throw new Error('Filename is required')
    }

    if (metadata.filename.length > 255) {
      throw new Error('Filename is too long (maximum 255 characters)')
    }

    // Check for potentially dangerous filenames
    if (this.isDangerousFilename(metadata.filename)) {
      throw new Error('Filename contains invalid characters')
    }

    // Check file extension (after filename validation)
    const fileExtension = this.getFileExtension(metadata.filename)
    if (!this.ALLOWED_FORMATS.includes(fileExtension.toLowerCase())) {
      throw new Error(`File format not supported. Allowed formats: ${this.ALLOWED_FORMATS.join(', ')}`)
    }

    // Check MIME type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }
  }

  // Convert File to Buffer
  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  // Get file extension from filename
  private getFileExtension(filename: string): string {
    // Ensure filename is valid before processing
    const trimmedFilename = filename.trim()
    if (!trimmedFilename) {
      throw new Error('Filename is required')
    }

    const lastDotIndex = trimmedFilename.lastIndexOf('.')
    if (lastDotIndex === -1 || lastDotIndex === 0 || lastDotIndex === trimmedFilename.length - 1) {
      throw new Error('File must have a valid extension')
    }

    const extension = trimmedFilename.substring(lastDotIndex + 1)
    if (!extension || extension.trim().length === 0) {
      throw new Error('File must have a valid extension')
    }

    return extension
  }

  // Check if filename is potentially dangerous
  private isDangerousFilename(filename: string): boolean {
    // Check for empty or whitespace-only filenames
    if (!filename || filename.trim().length === 0) {
      return true
    }

    // Check for filenames that are just dots and extension (like " .jpg", ".jpg", etc.)
    const trimmed = filename.trim()
    const dotIndex = trimmed.lastIndexOf('.')
    if (dotIndex !== -1) {
      const nameWithoutExtension = trimmed.substring(0, dotIndex).trim()
      // If the name part is empty or just whitespace
      if (nameWithoutExtension.length === 0) {
        return true
      }
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return true
    }

    // Check for null bytes
    if (filename.includes('\0')) {
      return true
    }

    // Check for control characters
    if (/[\x00-\x1f\x7f-\x9f]/.test(filename)) {
      return true
    }

    return false
  }

  // Get image information from Cloudinary
  async getImageInfo(imageId: string): Promise<{
    width: number
    height: number
    format: string
    size: number
    createdAt: Date
  }> {
    try {
      if (!imageId) {
        throw new Error('Image ID is required')
      }

      const result = await cloudinary.api.resource(imageId)
      
      return {
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        createdAt: new Date(result.created_at),
      }
    } catch (error) {
      console.error('Get image info error:', error)
      throw new Error(`Failed to get image info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Batch delete images
  async deleteImages(imageIds: string[]): Promise<{ deleted: string[], failed: string[] }> {
    const deleted: string[] = []
    const failed: string[] = []

    for (const imageId of imageIds) {
      try {
        await this.deleteImage(imageId)
        deleted.push(imageId)
      } catch (error) {
        console.error(`Failed to delete image ${imageId}:`, error)
        failed.push(imageId)
      }
    }

    return { deleted, failed }
  }

  // Generate upload signature for client-side uploads (if needed)
  generateUploadSignature(params: Record<string, any>): {
    signature: string
    timestamp: number
    apiKey: string
    cloudName: string
  } {
    const timestamp = Math.round(Date.now() / 1000)
    const paramsWithTimestamp = { ...params, timestamp }
    
    const signature = cloudinary.utils.api_sign_request(
      paramsWithTimestamp,
      process.env.CLOUDINARY_API_SECRET!
    )

    return {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    }
  }

  // Validate image dimensions
  validateImageDimensions(width: number, height: number): void {
    const MIN_DIMENSION = 100
    const MAX_DIMENSION = 4000

    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      throw new Error(`Image dimensions too small. Minimum: ${MIN_DIMENSION}x${MIN_DIMENSION}px`)
    }

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      throw new Error(`Image dimensions too large. Maximum: ${MAX_DIMENSION}x${MAX_DIMENSION}px`)
    }
  }

  // Get upload stats
  async getUploadStats(): Promise<{
    totalImages: number
    totalSize: number
    storageUsed: string
  }> {
    try {
      const result = await cloudinary.api.usage()
      
      return {
        totalImages: result.resources || 0,
        totalSize: result.storage?.usage || 0,
        storageUsed: this.formatBytes(result.storage?.usage || 0),
      }
    } catch (error) {
      console.error('Get upload stats error:', error)
      throw new Error(`Failed to get upload stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Format bytes to human readable string
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export const imageService = new ImageService()