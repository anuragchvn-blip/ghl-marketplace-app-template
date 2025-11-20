import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GHLService } from '@/lib/ghl'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  try {
    const ghlService = new GHLService()
    const tokens = await ghlService.exchangeCodeForToken(code)

    // Determine if company or location
    const locationId = tokens.locationId
    const companyId = tokens.companyId

    // Find or create agency
    let agency = await prisma.agency.findFirst()
    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          name: 'Default Agency',
          ghlCompanyId: companyId,
        },
      })
    }

    // Create or update sub-account
    await prisma.subAccount.upsert({
      where: { ghlLocationId: locationId || companyId },
      create: {
        agencyId: agency.id,
        ghlLocationId: locationId || companyId,
        ghlCompanyId: companyId,
        ghlAccessToken: tokens.access_token,
        ghlRefreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      update: {
        ghlAccessToken: tokens.access_token,
        ghlRefreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    })

    // Also create/update User for dashboard access
    const resourceId = locationId || companyId
    await prisma.user.upsert({
      where: { resourceId },
      create: {
        resourceId,
        userType: locationId ? 'location' : 'company',
        locationId,
        companyId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type || 'Bearer',
        expiresIn: tokens.expires_in,
        scope: tokens.scope || '',
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type || 'Bearer',
        expiresIn: tokens.expires_in,
        scope: tokens.scope || '',
      },
    })

    return NextResponse.redirect(new URL(`/dashboard?locationId=${resourceId}`, request.url))
  } catch (error) {
    console.error('GHL Auth Error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
