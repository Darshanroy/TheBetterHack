import { prisma } from '@/lib/prisma'

/**
 * Represents a product with details such as name, description, and price.
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  unit?: string;
  farmerId: string;
  createdAt: Date;
  updatedAt: Date;
  farmer?: {
    id: string;
    name: string;
  }
}

/**
 * Asynchronously retrieves a list of products.
 *
 * @returns A promise that resolves to an array of Product objects.
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      include: {
        farmer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return products as Product[]
  } catch (error) {
    console.error('Error fetching products:', error)
    throw new Error('Failed to fetch products')
  }
}

/**
 * Asynchronously submits product data to the backend.
 *
 * @param productData The data of the product to be submitted. Price should be in INR.
 * @returns A promise that resolves when the product data is successfully submitted.
 */
export async function submitProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'farmer'>): Promise<void> {
  try {
    await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        imageUrl: productData.imageUrl,
        unit: productData.unit,
        farmerId: productData.farmerId
      }
    })
  } catch (error) {
    console.error('Error submitting product:', error)
    throw new Error('Failed to submit product')
  }
}

    