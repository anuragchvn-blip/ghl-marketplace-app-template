import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json({ error: 'No SSO key provided' }, { status: 400 })
    }

    const ssoKey = process.env.GHL_APP_SSO_KEY!
    const decrypted = CryptoJS.AES.decrypt(key, ssoKey).toString(CryptoJS.enc.Utf8)
    
    if (!decrypted) {
      return NextResponse.json({ error: 'Invalid SSO key' }, { status: 401 })
    }

    const data = JSON.parse(decrypted)
    const { companyId, locationId } = data

    // Find sub-account
    const subAccount = await prisma.subAccount.findFirst({
      where: {
        OR: [
          { ghlLocationId: locationId },
          { ghlCompanyId: companyId },
        ],
      },
      include: {
        agency: true,
      },
    })

    if (!subAccount) {
      return NextResponse.json({ error: 'Sub-account not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      subAccount: {
        id: subAccount.id,
        agencyId: subAccount.agencyId,
        locationId: subAccount.ghlLocationId,
        companyId: subAccount.ghlCompanyId,
      },
    })
  } catch (error) {
    console.error('SSO Decrypt Error:', error)
    return NextResponse.json({ error: 'Decryption failed' }, { status: 500 })
  }
}
