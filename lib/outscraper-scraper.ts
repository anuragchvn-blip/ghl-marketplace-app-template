import { BusinessLead } from './scraper'

/**
 * Outscraper API integration for Google Maps scraping
 * Free tier: 2,500 results/month (no credit card required!)
 * Get your API key at: https://app.outscraper.com/api-docs
 */
export class OutscraperScraper {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OUTSCRAPER_API_KEY || ''
  }

  async scrapeBusinesses(
    searchQuery: string,
    location: string,
    maxResults: number = 15
  ): Promise<BusinessLead[]> {
    if (!this.apiKey) {
      throw new Error(
        'Outscraper API key required. Get FREE key (no credit card) at: https://app.outscraper.com/api-docs'
      )
    }

    try {
      console.log(`[Outscraper] Searching for: ${searchQuery} in ${location}`)

      // Outscraper API endpoint
      const url = `https://api.app.outscraper.com/maps/search-v3?query=${encodeURIComponent(
        `${searchQuery} in ${location}`
      )}&limit=${maxResults}&language=en&region=us`

      const response = await fetch(url, {
        headers: {
          'X-API-KEY': this.apiKey,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Outscraper API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response from Outscraper API')
      }

      const results = data.data[0] || []
      console.log(`[Outscraper] Found ${results.length} results`)

      const leads: BusinessLead[] = results.map((place: Record<string, unknown>) => {
        // Parse address
        const addressParts = ((place.full_address as string) || '').split(',').map((s: string) => s.trim())
        const address = addressParts[0] || ''
        const city = addressParts[1] || location.split(',')[0].trim()
        const stateZip = addressParts[2]?.split(' ') || []
        const state = stateZip[0] || location.split(',')[1]?.trim() || ''
        const zipCode = stateZip[1] || ''

        return {
          businessName: place.name || 'Unknown Business',
          category: place.category || searchQuery,
          address: address,
          city: city,
          state: state,
          zipCode: zipCode,
          phone: place.phone as string,
          website: place.site as string,
          rating: place.rating ? parseFloat(place.rating as string) : undefined,
          reviewCount: place.reviews ? parseInt(place.reviews as string) : undefined,
          latitude: place.latitude as number,
          longitude: place.longitude as number,
        }
      })

      console.log(`[Outscraper] Successfully extracted ${leads.length} leads`)
      return leads
    } catch (error) {
      console.error('[Outscraper] Error:', error)
      throw error
    }
  }
}
