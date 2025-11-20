import { NextRequest, NextResponse } from 'next/server'
import { capturePayment } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token') // PayPal order ID

    if (!token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=error`)
    }

    // Capture the payment
    const captureData = await capturePayment(token)

    if (captureData.status !== 'COMPLETED') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=failed`)
    }

    // Find the purchase record
    const purchase = await prisma.dayPassPurchase.findUnique({
      where: { paypalOrderId: token },
      include: { user: true },
    })

    if (!purchase) {
      console.error('Purchase not found for order:', token)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=error`)
    }

    // Update purchase status
    await prisma.dayPassPurchase.update({
      where: { id: purchase.id },
      data: {
        status: 'completed',
        paypalPayerId: captureData.payerId,
        activatedAt: new Date(),
      },
    })

    // Activate day pass for user
    await prisma.user.update({
      where: { id: purchase.userId },
      data: {
        dayPassActive: true,
        dayPassExpiresAt: purchase.expiresAt,
        dayPassLeadsUsed: 0,
        dayPassLeadsLimit: purchase.leadsLimit,
        totalDayPassesPurchased: { increment: 1 },
      },
    })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`)
  } catch (error: unknown) {
    console.error('Capture Payment Error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=error`)
  }
}
