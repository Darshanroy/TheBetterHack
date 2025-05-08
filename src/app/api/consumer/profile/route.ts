import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/consumer/profile - Get consumer profile
export async function GET() {
  try {
    // TODO: Replace with actual user ID from session
    const userId = 'current-user-id'
    
    const profile = await prisma.consumerProfile.findFirst({
      where: { userId }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching consumer profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consumer profile' },
      { status: 500 }
    )
  }
} 