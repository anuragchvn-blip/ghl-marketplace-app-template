import { BusinessLead } from './scraper'

/**
 * SerpAPI integration for Google Maps scraping
 * Free tier: 100 searches/month
 * Get your API key at: https://serpapi.com/manage-api-key
 */
export class SerpAPIScraper {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SERPAPI_KEY || ''
  }

  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url)
        if (response.ok) return response
        if (response.status === 429) { // Rate limit
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
          continue
        }
        return response // Return other errors to be handled by caller
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error('Fetch failed after retries')
  }

  async scrapeBusinesses(
    searchQuery: string,
    location: string,
    maxResults: number = 15
  ): Promise<BusinessLead[]> {
    if (!this.apiKey) {
      throw new Error(
        'SerpAPI key required. Get FREE key at: https://serpapi.com/manage-api-key'
      )
    }

    try {
      console.log(`[SerpAPI] Searching for: ${searchQuery} in ${location}`)

      // SerpAPI Google Maps endpoint
      const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(
        `${searchQuery} in ${location}`
      )}&type=search&num=${maxResults}&api_key=${this.apiKey}`

      const response = await this.fetchWithRetry(url)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`SerpAPI error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`SerpAPI error: ${data.error}`)
      }

      const results = (data.local_results || []).slice(0, maxResults)
      console.log(`[SerpAPI] Found ${results.length} results (limited to ${maxResults})`)

      const leads: BusinessLead[] = results.map((place: Record<string, unknown>) => {
        // Parse address
        const fullAddress = (place.address as string) || ''
        const addressParts = fullAddress.split(',').map((s: string) => s.trim())
        const address = addressParts[0] || ''
        const city = addressParts[1] || location.split(',')[0].trim()
        const stateZip = addressParts[2]?.split(' ') || []
        const state = stateZip[0] || location.split(',')[1]?.trim() || ''
        const zipCode = stateZip[1] || ''

        // Parse rating
        const rating = place.rating ? parseFloat(place.rating as string) : undefined
        const reviewCount = place.reviews ? parseInt(place.reviews as string) : undefined

        return {
          businessName: (place.title as string) || 'Unknown Business',
          category: (place.type as string) || searchQuery,
          address: address,
          city: city,
          state: state,
          zipCode: zipCode,
          phone: place.phone,
          website: place.website,
          rating: rating,
          reviewCount: reviewCount,
          latitude: (place.gps_coordinates as { latitude?: number })?.latitude,
          longitude: (place.gps_coordinates as { longitude?: number })?.longitude,
        }
      })

      console.log(`[SerpAPI] Successfully extracted ${leads.length} leads`)
      return leads
    } catch (error) {
      console.error('[SerpAPI] Error:', error)
      throw error
    }
  }
}
