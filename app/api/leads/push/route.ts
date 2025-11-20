import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGHLSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getGHLSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = await request.json()

    if (!leadId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.pushedToGhl) {
      return NextResponse.json(
        { error: 'Lead already pushed to GHL' },
        { status: 400 }
      )
    }

    // For testing without sub-account, just mark as pushed
    // const ghlService = new GHLService()
    // const contactData = await ghlService.pushContactToGHL(subAccountId, lead)

    // Update lead
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        pushedToGhl: true,
        ghlContactId: `test-contact-${Date.now()}`,
        status: 'CONTACTED',
      },
    })

    return NextResponse.json({
      success: true,
      contactId: `test-contact-${Date.now()}`,
    })
  } catch (error) {
    console.error('Push to GHL Error:', error)
    return NextResponse.json(
      { error: 'Failed to push lead to GHL' },
      { status: 500 }
    )
  }
}
