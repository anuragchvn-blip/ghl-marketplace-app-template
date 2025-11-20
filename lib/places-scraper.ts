import { BusinessLead } from './scraper'

export class GooglePlacesScraper {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_PLACES_API_KEY || ''
  }

  async scrapeBusinesses(
    searchQuery: string,
    location: string,
    maxResults: number = 15
  ): Promise<BusinessLead[]> {
    if (!this.apiKey) {
      throw new Error(
        'Google Places API key is required. Get one free at https://console.cloud.google.com/apis/credentials'
      )
    }

    try {
      console.log(`[Places API] Searching for: ${searchQuery} in ${location}`)

      // Step 1: Text Search to find places
      const searchResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          `${searchQuery} in ${location}`
        )}&key=${this.apiKey}`
      )

      if (!searchResponse.ok) {
        throw new Error(`Places API error: ${searchResponse.statusText}`)
      }

      const searchData = await searchResponse.json()

      if (searchData.status === 'REQUEST_DENIED') {
        throw new Error(
          `Places API request denied: ${searchData.error_message}. Check your API key and enable Places API.`
        )
      }

      if (searchData.status !== 'OK') {
        throw new Error(`Places API status: ${searchData.status}`)
      }

      const results = searchData.results.slice(0, maxResults)
      console.log(`[Places API] Found ${results.length} results`)

      // Step 2: Get detailed info for each place
      const leads: BusinessLead[] = []

      for (const result of results) {
        try {
          // Get place details for phone and website
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.place_id}&fields=formatted_phone_number,website&key=${this.apiKey}`
          )

          const detailsData = await detailsResponse.json()
          const details = detailsData.result || {}

          // Parse address components
          const addressParts = result.formatted_address
            .split(',')
            .map((s: string) => s.trim())

          const lead: BusinessLead = {
            businessName: result.name,
            category: result.types?.[0]?.replace(/_/g, ' ') || searchQuery,
            address: addressParts[0] || '',
            city: addressParts[1] || location.split(',')[0].trim(),
            state: addressParts[2]?.split(' ')[0] || location.split(',')[1]?.trim() || '',
            zipCode: addressParts[2]?.split(' ')[1] || '',
            phone: details.formatted_phone_number,
            website: details.website,
            rating: result.rating,
            reviewCount: result.user_ratings_total,
            latitude: result.geometry?.location.lat,
            longitude: result.geometry?.location.lng,
          }

          leads.push(lead)

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (err) {
          console.error(`Error fetching details for ${result.name}:`, err)
        }
      }

      console.log(`[Places API] Successfully extracted ${leads.length} leads`)
      return leads
    } catch (error) {
      console.error('[Places API] Error:', error)
      throw error
    }
  }
}
