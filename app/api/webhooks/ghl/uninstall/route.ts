import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // GHL sends uninstall webhook with these fields
    const { type, locationId, companyId } = body
    
    if (type !== 'Uninstall') {
      return NextResponse.json({ message: 'Not an uninstall event' }, { status: 200 })
    }

    const resourceId = locationId || companyId

    if (!resourceId) {
      console.error('No resourceId in uninstall webhook')
      return NextResponse.json({ error: 'Missing resourceId' }, { status: 400 })
    }

    // Delete user and all related data (cascades to contacts, events, etc.)
    const deletedUser = await prisma.user.delete({
      where: { resourceId },
    })

    console.log(`User uninstalled: ${resourceId}`, deletedUser)

    return NextResponse.json({ 
      success: true, 
      message: 'User data deleted successfully',
      resourceId 
    })
  } catch (error: any) {
    // If user not found, that's okay (already deleted)
    if (error.code === 'P2025') {
      console.log('User already deleted or not found')
      return NextResponse.json({ success: true, message: 'User not found' })
    }

    console.error('Uninstall webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process uninstall' },
      { status: 500 }
    )
  }
}
