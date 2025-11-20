import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { notes } = await request.json()

    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: { 
        notes,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, lead: updatedLead })
  } catch (error) {
    console.error('Update note error:', error)
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    )
  }
}
