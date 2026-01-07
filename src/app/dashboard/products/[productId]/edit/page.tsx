import { notFound } from 'next/navigation'
import { productService } from '@/services/product'
import { ProductEditForm } from '@/components/products/product-edit-form'

interface ProductEditPageProps {
  params: {
    productId: string
  }
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const product = await productService.getProduct(params.productId)

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground">
          Update product information and settings
        </p>
      </div>

      <ProductEditForm product={product} />
    </div>
  )
}