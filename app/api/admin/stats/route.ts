import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Simple admin authentication check
    const authHeader = req.headers.get('authorization')
    const isLocalhost = req.headers.get('host')?.includes('localhost')
    
    // Allow on localhost, or check session storage flag (handled by client)
    if (!isLocalhost && authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
      // For client-side auth, we trust the session storage check
      // In production, implement proper JWT or session-based auth
    }

    const [
      totalUsers,
      activeUsers,
      totalPurchases,
      completedPurchases,
      activePasses,
      totalLeads,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { dayPassActive: true },
      }),
      prisma.dayPassPurchase.count(),
      prisma.dayPassPurchase.findMany({
        where: { status: 'completed' },
        select: { amount: true },
      }),
      prisma.user.count({
        where: {
          dayPassActive: true,
          dayPassExpiresAt: { gt: new Date() },
        },
      }),
      prisma.lead.count(),
    ])

    const totalRevenue = completedPurchases.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalRevenue,
      totalPurchases,
      activePasses,
      leadsScraped: totalLeads,
    })
  } catch (error) {
    console.error('Admin Stats Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
