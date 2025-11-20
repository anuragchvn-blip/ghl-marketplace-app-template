import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const purchases = await prisma.dayPassPurchase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            resourceId: true,
            userType: true,
          },
        },
      },
    })

    return NextResponse.json(purchases)
  } catch (error) {
    console.error('Admin Purchases Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}
