import { NextRequest } from 'next/server'
import { prisma } from './prisma'

export interface GHLSession {
  userId: string
  resourceId: string
  userType: 'Company' | 'Location'
  companyId?: string
  locationId?: string
}

export async function getGHLSession(request: NextRequest): Promise<GHLSession | null> {
  try {
    // Try to get session from header (for SSO iframe)
    const ssoKey = request.headers.get('x-ghl-sso-key')
    
    if (ssoKey) {
      // Decrypt SSO key and get user from database
      // This will be populated when user accesses via iframe
      const decryptedData = await decryptSSOKey(ssoKey)
      
      if (decryptedData?.locationId || decryptedData?.companyId) {
        const resourceId = (decryptedData.locationId || decryptedData.companyId) as string
        
        const user = await prisma.user.findUnique({
          where: { resourceId },
        })
        
        if (user) {
          return {
            userId: user.id,
            resourceId: user.resourceId,
            userType: user.userType as 'Company' | 'Location',
            companyId: user.companyId || undefined,
            locationId: user.locationId || undefined,
          }
        }
      }
    }
    
    // Try to get session from cookie/token (for standalone access)
    const authToken = request.cookies.get('ghl-auth-token')?.value
    
    if (authToken) {
      // Validate token and get user
      const user = await prisma.user.findFirst({
        where: { accessToken: authToken },
      })
      
      if (user) {
        return {
          userId: user.id,
          resourceId: user.resourceId,
          userType: user.userType as 'Company' | 'Location',
          companyId: user.companyId || undefined,
          locationId: user.locationId || undefined,
        }
      }
    }
    
    // Fallback: get from query param (development only)
    const url = new URL(request.url)
    const locationId = url.searchParams.get('locationId')
    const companyId = url.searchParams.get('companyId')
    
    console.log('Auth - URL:', url.toString())
    console.log('Auth - locationId:', locationId)
    console.log('Auth - companyId:', companyId)
    
    if (locationId || companyId) {
      const resourceId = locationId || companyId
      
      console.log('Auth - Looking for user with resourceId:', resourceId)
      
      const user = await prisma.user.findUnique({
        where: { resourceId: resourceId! },
      })
      
      console.log('Auth - Found user:', user ? user.id : 'null')
      
      if (user) {
        return {
          userId: user.id,
          resourceId: user.resourceId,
          userType: user.userType as 'Company' | 'Location',
          companyId: user.companyId || undefined,
          locationId: user.locationId || undefined,
        }
      }
    }
    
    console.log('Auth - No session found')
    return null
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

async function decryptSSOKey(key: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('SSO decrypt error:', error)
  }
  
  return null
}
