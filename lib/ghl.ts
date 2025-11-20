import axios from 'axios'
import { prisma } from './prisma'

export class GHLService {
  private baseUrl = process.env.GHL_API_DOMAIN!
  private clientId = process.env.GHL_APP_CLIENT_ID!
  private clientSecret = process.env.GHL_APP_CLIENT_SECRET!

  async exchangeCodeForToken(code: string) {
    const response = await axios.post(
      `${this.baseUrl}/oauth/token`,
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    )

    return response.data
  }

  async refreshAccessToken(refreshToken: string) {
    const response = await axios.post(
      `${this.baseUrl}/oauth/token`,
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    )

    return response.data
  }

  async getAxiosInstance(subAccountId: string) {
    const subAccount = await prisma.subAccount.findUnique({
      where: { id: subAccountId },
    })

    if (!subAccount?.ghlAccessToken) {
      throw new Error('No access token found')
    }

    // Check if token expired
    if (subAccount.tokenExpiresAt && new Date() >= subAccount.tokenExpiresAt) {
      const newTokens = await this.refreshAccessToken(subAccount.ghlRefreshToken!)
      
      await prisma.subAccount.update({
        where: { id: subAccountId },
        data: {
          ghlAccessToken: newTokens.access_token,
          ghlRefreshToken: newTokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
        },
      })

      return axios.create({
        baseURL: this.baseUrl,
        headers: {
          Authorization: `Bearer ${newTokens.access_token}`,
          Version: '2021-07-28',
        },
      })
    }

    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${subAccount.ghlAccessToken}`,
        Version: '2021-07-28',
      },
    })
  }

  async pushContactToGHL(subAccountId: string, lead: {
    ownerName?: string;
    email?: string;
    phone?: string;
    businessName?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    aiScore?: number;
  }) {
    const api = await this.getAxiosInstance(subAccountId)

    const response = await api.post('/contacts/', {
      firstName: lead.ownerName?.split(' ')[0] || '',
      lastName: lead.ownerName?.split(' ').slice(1).join(' ') || '',
      email: lead.email,
      phone: lead.phone,
      companyName: lead.businessName,
      website: lead.website,
      address1: lead.address,
      city: lead.city,
      state: lead.state,
      postalCode: lead.zipCode,
      customField: {
        aiScore: lead.aiScore?.toString() || '',
        leadSource: 'Outreach OS',
      },
    })

    return response.data
  }
}
