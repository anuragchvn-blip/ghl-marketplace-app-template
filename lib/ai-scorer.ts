import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface LeadScoringResult {
  score: number
  reasoning: string
  keyFactors: string[]
}

export class AIScorer {
  async scoreLeadQuality(lead: {
    businessName: string
    category: string
    address: string
    city: string
    state: string
    phone?: string
    website?: string
    rating?: number
    reviewCount?: number
  }): Promise<LeadScoringResult> {
    const prompt = `Score this business lead (0-100) based on quality and completeness.
Details: ${JSON.stringify({
  name: lead.businessName,
  cat: lead.category,
  loc: `${lead.city}, ${lead.state}`,
  phone: lead.phone,
  web: lead.website,
  rating: lead.rating,
  reviews: lead.reviewCount
})}

Criteria:
- >90: Excellent (High rating, website, phone, established)
- >75: Good (Contactable, decent rating)
- <50: Poor (Missing info)

JSON Response: { "score": number, "reasoning": "string", "keyFactors": string[] }`

    try {
      const completion = await this.retryOperation(async () => {
        return await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.1, // Lower temperature for more consistent JSON
          max_tokens: 200, // Reduced tokens
          response_format: { type: 'json_object' },
        })
      })

      const content = completion.choices[0]?.message?.content || '{}'
      const result = JSON.parse(content)

      return {
        score: result.score || 0,
        reasoning: result.reasoning || 'Unable to score lead',
        keyFactors: result.keyFactors || [],
      }
    } catch (error) {
      console.error('Groq AI Error:', error)
      return this.fallbackScoring(lead)
    }
  }

  private async retryOperation<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation()
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error('Operation failed after retries')
  }

  private fallbackScoring(lead: {
    businessName: string
    phone?: string
    website?: string
    rating?: number
    reviewCount?: number
  }): LeadScoringResult {
    let score = 50 // Base score

    // Has website
    if (lead.website) score += 15

    // Has phone
    if (lead.phone) score += 10

    // Rating-based scoring
    if (lead.rating) {
      if (lead.rating >= 4.5) score += 15
      else if (lead.rating >= 4.0) score += 10
      else if (lead.rating >= 3.5) score += 5
      else score -= 10
    }

    // Review count (indicates business age/popularity)
    if (lead.reviewCount) {
      if (lead.reviewCount >= 100) score += 10
      else if (lead.reviewCount >= 50) score += 5
    }

    score = Math.max(0, Math.min(100, score))

    return {
      score,
      reasoning: 'Fallback scoring based on available data points',
      keyFactors: [
        lead.website ? 'Has website' : 'No website',
        lead.phone ? 'Phone available' : 'No phone',
        lead.rating ? `Rating: ${lead.rating}` : 'No rating',
      ],
    }
  }
}
