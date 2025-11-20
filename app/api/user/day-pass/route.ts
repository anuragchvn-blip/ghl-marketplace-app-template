import { NextRequest, NextResponse } from 'next/server'
import { getGHLSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getGHLSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        dayPassActive: true,
        dayPassExpiresAt: true,
        dayPassLeadsUsed: true,
        dayPassLeadsLimit: true,
        totalDayPassesPurchased: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if day pass has expired
    if (user.dayPassActive && user.dayPassExpiresAt && user.dayPassExpiresAt < new Date()) {
      await prisma.user.update({
        where: { id: session.userId },
        data: {
          dayPassActive: false,
          dayPassLeadsUsed: 0,
        },
      })

      return NextResponse.json({
        ...user,
        dayPassActive: false,
        expired: true,
      })
    }

    return NextResponse.json(user)
  } catch (error: unknown) {
    console.error('Get Day Pass Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get day pass status' },
      { status: 500 }
    )
  }
}
