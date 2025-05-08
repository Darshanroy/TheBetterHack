import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/cart - Get all cart items for the current user
export async function GET() {
  try {
    // TODO: Replace with actual user ID from session
    const userId = 'current-user-id'
    
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: true
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching cart items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart items' },
      { status: 500 }
    )
  }
}

// POST /api/cart - Add or update cart item
export async function POST(request: Request) {
  try {
    const { productId, quantity } = await request.json()
    // TODO: Replace with actual user ID from session
    const userId = 'current-user-id'

    const item = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId
        }
      },
      update: {
        quantity
      },
      create: {
        userId,
        productId,
        quantity
      },
      include: {
        product: true
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart - Remove item from cart
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    // TODO: Replace with actual user ID from session
    const userId = 'current-user-id'

    await prisma.cartItem.delete({
      where: {
        id,
        userId // Ensure user can only delete their own items
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
} 