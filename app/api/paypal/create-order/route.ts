import { NextRequest, NextResponse } from 'next/server'
import { createDayPassOrder } from '@/lib/paypal'
import { getGHLSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getGHLSession(req)
    
    console.log('Create Order - Session:', session)
    console.log('Create Order - URL:', req.url)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Unauthorized - Please make sure you are accessing from the dashboard with a valid locationId' 
      }, { status: 401 })
    }

    // Check if user already has an active day pass
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { dayPassActive: true, dayPassExpiresAt: true },
    })

    if (user?.dayPassActive && user.dayPassExpiresAt && user.dayPassExpiresAt > new Date()) {
      return NextResponse.json(
        { error: 'You already have an active day pass' },
        { status: 400 }
      )
    }

    // Create PayPal order
    const { orderId, approvalUrl } = await createDayPassOrder(session.userId)

    // Save pending purchase to database
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + parseInt(process.env.DAY_PASS_DURATION_HOURS || '24'))

    await prisma.dayPassPurchase.create({
      data: {
        userId: session.userId,
        paypalOrderId: orderId,
        amount: parseFloat(process.env.DAY_PASS_PRICE || '7'),
        currency: 'USD',
        status: 'pending',
        leadsLimit: parseInt(process.env.DAY_PASS_LEADS_LIMIT || '15'),
        expiresAt,
      },
    })

    return NextResponse.json({ orderId, approvalUrl })
  } catch (error) {
    console.error('Create PayPal Order Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}
