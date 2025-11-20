import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { agencyName = 'Default Agency' } = await request.json()

    // Create or get agency
    let agency = await prisma.agency.findFirst()
    
    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          name: agencyName,
        },
      })
    }

    // Create sub-account
    const subAccount = await prisma.subAccount.create({
      data: {
        agencyId: agency.id,
        ghlLocationId: `test-location-${Date.now()}`,
        ghlCompanyId: `test-company-${Date.now()}`,
        ghlAccessToken: 'test-token',
        ghlRefreshToken: 'test-refresh-token',
      },
    })

    return NextResponse.json({
      success: true,
      agency,
      subAccount,
    })
  } catch (error) {
    console.error('Setup Error:', error)
    return NextResponse.json(
      { error: 'Failed to setup account' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const agencies = await prisma.agency.findMany({
      include: {
        subAccounts: true,
      },
    })

    return NextResponse.json({
      success: true,
      agencies,
    })
  } catch (error) {
    console.error('Get Agencies Error:', error)
    return NextResponse.json(
      { error: 'Failed to get agencies' },
      { status: 500 }
    )
  }
}
