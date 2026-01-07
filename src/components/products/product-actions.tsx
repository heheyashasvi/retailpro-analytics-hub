'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Trash2, Copy, Archive, ArchiveRestore } from 'lucide-react'
import { toast } from 'sonner'

interface ProductActionsProps {
  productId: string
  productName?: string
  productStatus?: 'active' | 'inactive' | 'draft'
}

export function ProductActions({ productId, productName, productStatus }: ProductActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to delete product')
      }

      toast.success('Product deleted successfully')
      router.push('/dashboard/products')
      router.refresh()
    } catch (error) {
      console.error('Delete product error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete product')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleStatusChange = async (newStatus: 'active' | 'inactive') => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to update product status')
      }

      toast.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
      router.refresh()
    } catch (error) {
      console.error('Update product status error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update product status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDuplicate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/products/${productId}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to duplicate product')
      }

      const result = await response.json()
      toast.success('Product duplicated successfully')
      router.push(`/dashboard/products/${result.product.id}`)
      router.refresh()
    } catch (error) {
      console.error('Duplicate product error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate product')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDuplicate} disabled={isUpdating}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Product
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {productStatus === 'active' ? (
            <DropdownMenuItem 
              onClick={() => handleStatusChange('inactive')} 
              disabled={isUpdating}
            >
              <Archive className="mr-2 h-4 w-4" />
              Deactivate Product
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              onClick={() => handleStatusChange('active')} 
              disabled={isUpdating}
            >
              <ArchiveRestore className="mr-2 h-4 w-4" />
              Activate Product
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
            disabled={isUpdating}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Product
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              {productName && ` "${productName}"`} and all associated data including images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}