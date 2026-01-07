'use client'

import { useState, useCallback } from 'react'
import { useFormContext } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Star, Image as ImageIcon } from 'lucide-react'
import { ProductFormData } from '../multi-step-form'

interface ImagePreview {
  file: File
  preview: string
  altText: string
}

export function ProductImagesStep() {
  const { setValue, watch, formState: { errors } } = useFormContext<ProductFormData>()
  
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  
  const images = watch('step3.images') || []
  const primaryImageIndex = watch('step3.primaryImageIndex') || 0
  const altTexts = watch('step3.altTexts') || []

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      altText: ''
    }))

    const updatedPreviews = [...imagePreviews, ...newImages]
    setImagePreviews(updatedPreviews)
    
    // Update form data
    setValue('step3.images', updatedPreviews.map(img => img.file))
    setValue('step3.altTexts', updatedPreviews.map(img => img.altText))
  }, [imagePreviews, setValue])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeImage = (index: number) => {
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index)
    setImagePreviews(updatedPreviews)
    
    // Update form data
    setValue('step3.images', updatedPreviews.map(img => img.file))
    setValue('step3.altTexts', updatedPreviews.map(img => img.altText))
    
    // Adjust primary image index if necessary
    if (index === primaryImageIndex && updatedPreviews.length > 0) {
      setValue('step3.primaryImageIndex', 0)
    } else if (index < primaryImageIndex) {
      setValue('step3.primaryImageIndex', primaryImageIndex - 1)
    }
  }

  const setPrimaryImage = (index: number) => {
    setValue('step3.primaryImageIndex', index)
  }

  const updateAltText = (index: number, altText: string) => {
    const updatedPreviews = [...imagePreviews]
    updatedPreviews[index].altText = altText
    setImagePreviews(updatedPreviews)
    setValue('step3.altTexts', updatedPreviews.map(img => img.altText))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null) return
    
    const updatedPreviews = [...imagePreviews]
    const draggedItem = updatedPreviews[draggedIndex]
    
    // Remove dragged item and insert at new position
    updatedPreviews.splice(draggedIndex, 1)
    updatedPreviews.splice(dropIndex, 0, draggedItem)
    
    setImagePreviews(updatedPreviews)
    setValue('step3.images', updatedPreviews.map(img => img.file))
    setValue('step3.altTexts', updatedPreviews.map(img => img.altText))
    
    // Update primary image index
    if (draggedIndex === primaryImageIndex) {
      setValue('step3.primaryImageIndex', dropIndex)
    } else if (draggedIndex < primaryImageIndex && dropIndex >= primaryImageIndex) {
      setValue('step3.primaryImageIndex', primaryImageIndex - 1)
    } else if (draggedIndex > primaryImageIndex && dropIndex <= primaryImageIndex) {
      setValue('step3.primaryImageIndex', primaryImageIndex + 1)
    }
    
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-6">
      {/* Image Upload Area */}
      <div className="space-y-2">
        <Label>Product Images *</Label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : errors.step3?.images
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-blue-600">Drop the images here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop images here, or click to select files
              </p>
              <p className="text-sm text-gray-500">
                Supports: JPEG, PNG, WebP (max 10MB each)
              </p>
            </div>
          )}
        </div>
        {errors.step3?.images && (
          <p className="text-sm text-red-600">{errors.step3.images.message}</p>
        )}
      </div>

      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Uploaded Images ({imagePreviews.length})</Label>
            <p className="text-sm text-gray-600">
              Drag to reorder • Click star to set as primary
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imagePreviews.map((imagePreview, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`relative border rounded-lg p-4 space-y-3 cursor-move transition-shadow ${
                  index === primaryImageIndex
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Primary Image Badge */}
                {index === primaryImageIndex && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Primary
                  </Badge>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Image Preview */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image Info */}
                <div className="space-y-2">
                  <p className="text-sm font-medium truncate">
                    {imagePreview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(imagePreview.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {/* Alt Text Input */}
                  <Input
                    placeholder="Alt text for accessibility..."
                    value={imagePreview.altText}
                    onChange={(e) => updateAltText(index, e.target.value)}
                    className="text-sm"
                  />
                  
                  {/* Set Primary Button */}
                  {index !== primaryImageIndex && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPrimaryImage(index)}
                      className="w-full"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Set as Primary
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Step 3: Product Images</h3>
        <p className="text-sm text-blue-700 mb-2">
          Upload high-quality images of your product. The first image will be set as the primary 
          image by default, but you can change this by clicking the star icon.
        </p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• At least one image is required</li>
          <li>• Supported formats: JPEG, PNG, WebP</li>
          <li>• Maximum file size: 10MB per image</li>
          <li>• Add alt text for better accessibility</li>
          <li>• Drag images to reorder them</li>
        </ul>
      </div>
    </div>
  )
}