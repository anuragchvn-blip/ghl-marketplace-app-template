import { BusinessLead } from './scraper'

/**
 * Mock scraper for testing - generates realistic sample data
 * Use this while setting up proper scraping infrastructure
 */
export class MockScraper {
  async scrapeBusinesses(
    searchQuery: string,
    location: string,
    maxResults: number = 15
  ): Promise<BusinessLead[]> {
    console.log(`[Mock Scraper] Generating ${maxResults} sample leads for: ${searchQuery} in ${location}`)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    const [city, state] = location.split(',').map(s => s.trim())
    const leads: BusinessLead[] = []

    // Generate realistic sample data
    for (let i = 0; i < maxResults; i++) {
      const hasWebsite = Math.random() > 0.3
      const hasPhone = Math.random() > 0.2
      const rating = 3.5 + Math.random() * 1.5 // 3.5 to 5.0
      const reviewCount = Math.floor(Math.random() * 500) + 10

      leads.push({
        businessName: `${this.getBusinessName(searchQuery)} ${this.getBusinessSuffix()}`,
        category: searchQuery,
        address: `${Math.floor(Math.random() * 9999) + 100} ${this.getStreetName()} ${this.getStreetType()}`,
        city: city || 'Miami',
        state: state || 'FL',
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        phone: hasPhone ? this.generatePhone() : undefined,
        website: hasWebsite ? `https://www.${this.getBusinessName(searchQuery).toLowerCase().replace(/\s+/g, '')}.com` : undefined,
        rating: parseFloat(rating.toFixed(1)),
        reviewCount: reviewCount,
        latitude: 25.7617 + (Math.random() - 0.5) * 0.5,
        longitude: -80.1918 + (Math.random() - 0.5) * 0.5,
      })
    }

    console.log(`[Mock Scraper] Generated ${leads.length} sample leads`)
    return leads
  }

  private getBusinessName(category: string): string {
    const prefixes = ['Pro', 'Expert', 'Quality', 'Premium', 'Elite', 'Local', 'Best', 'Top', 'City', 'Metro']
    const suffixes = ['Services', 'Solutions', 'Pros', 'Experts', 'Group', 'Company', 'Team', 'Masters']
    
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${category} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`
  }

  private getBusinessSuffix(): string {
    const suffixes = ['LLC', 'Inc', 'Co', '& Sons', 'Brothers', 'Associates', '']
    return suffixes[Math.floor(Math.random() * suffixes.length)]
  }

  private getStreetName(): string {
    const names = ['Main', 'Oak', 'Maple', 'Washington', 'Park', 'Cedar', 'Elm', 'Pine', 'Lake', 'Hill', 'Sunset', 'Ocean']
    return names[Math.floor(Math.random() * names.length)]
  }

  private getStreetType(): string {
    const types = ['St', 'Ave', 'Blvd', 'Rd', 'Dr', 'Ln', 'Way', 'Ct']
    return types[Math.floor(Math.random() * types.length)]
  }

  private generatePhone(): string {
    const areaCode = Math.floor(Math.random() * 900) + 100
    const prefix = Math.floor(Math.random() * 900) + 100
    const suffix = Math.floor(Math.random() * 9000) + 1000
    return `(${areaCode}) ${prefix}-${suffix}`
  }
}
