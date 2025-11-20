import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGHLSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated GHL user
    const session = await getGHLSession(request)
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const minScore = searchParams.get('minScore')

    const leads = await prisma.lead.findMany({
      where: {
        ...(session?.userId && { userId: session.userId }), // Filter by authenticated user
        ...(status && { status }),
        ...(minScore && { aiScore: { gte: parseInt(minScore) } }),
      },
      orderBy: [{ aiScore: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      select: {
        id: true,
        businessName: true,
        address: true,
        phone: true,
        website: true,
        rating: true,
        reviewCount: true,
        category: true,
        aiScore: true,
        aiReasoning: true,
        notes: true,
        updatedAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, leads })
  } catch (error) {
    console.error('Get Leads Error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}
