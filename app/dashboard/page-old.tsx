'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Sparkles, Send, Target, Zap, TrendingUp, Calendar } from 'lucide-react'
import { BackgroundGradient } from '@/components/ui/background-gradient'
import { HoverEffect } from '@/components/ui/card-hover-effect'

interface Lead {
  id: string
  businessName: string
  category: string
  address: string
  city: string
  state: string
  phone?: string
  website?: string
  rating?: number
  aiScore: number
  aiReasoning: string
  status: string
  pushedToGhl: boolean
  createdAt: string
}

const features = [
  {
    title: 'AI-Powered Scoring',
    description: 'Our Groq AI analyzes each lead and scores them 0-100. Only quality leads (75+) make it to your dashboard.',
    icon: <Sparkles className="w-6 h-6 text-accent" />,
  },
  {
    title: 'Google Maps Scraping',
    description: 'Extract business data from Google Maps including contact info, ratings, and location details.',
    icon: <MapPin className="w-6 h-6 text-secondary" />,
  },
  {
    title: 'One-Click GHL Push',
    description: 'Send quality leads directly to your GHL account as contacts with a single click.',
    icon: <Send className="w-6 h-6 text-primary" />,
  },
]

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [searchQuery, setSearchQuery] = useState('plumber')
  const [location, setLocation] = useState('Miami, FL')
  const [maxResults, setMaxResults] = useState(15)
  const [showFeatures] = useState(true)

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads?minScore=75')
      const data = await res.json()
      if (data.success) {
        setLeads(data.leads)
      }
    } catch (error) {
      console.error('Load leads error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScrape = async () => {
    setScraping(true)
    try {
      const res = await fetch('/api/leads/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery,
          location,
          maxResults,
        }),
      })

      const data = await res.json()
      if (data.success) {
        const methodMap: Record<string, { emoji: string; name: string }> = {
          serpapi: { emoji: '🎯', name: 'SerpAPI (Real Google Maps Data!)' },
          outscraper: { emoji: '🚀', name: 'Outscraper API' },
          google_places: { emoji: '✅', name: 'Google Places API' },
          puppeteer: { emoji: '🤖', name: 'Puppeteer' },
          mock: { emoji: '🎭', name: 'Mock Data (Testing)' }
        }
        const method = methodMap[data.scrapingMethod] || { emoji: '❓', name: 'Unknown' }
        alert(`${method.emoji} Scraped using: ${method.name}\n\nFound ${data.qualityLeads} quality leads out of ${data.totalScraped} scraped!`)
        loadLeads()
      } else {
        alert(data.error || 'Scraping failed')
      }
    } catch (error) {
      console.error('Scrape error:', error)
      alert('Scraping failed')
    } finally {
      setScraping(false)
    }
  }

  const handlePushToGHL = async (leadId: string) => {
    try {
      const res = await fetch('/api/leads/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      })

      const data = await res.json()
      if (data.success) {
        alert('Lead pushed to GHL successfully!')
        loadLeads()
      } else {
        alert(data.error || 'Push failed')
      }
    } catch (error) {
      console.error('Push error:', error)
      alert('Push to GHL failed')
    }
  }

  const handleScheduleMeeting = async (leadId: string, businessName: string) => {
    const meetingDate = prompt('Enter meeting date (YYYY-MM-DD):')
    if (!meetingDate) return

    const meetingTime = prompt('Enter meeting time (HH:MM in 24-hour format):')
    if (!meetingTime) return

    try {
      const res = await fetch('/api/google/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          meetingTitle: `Meeting with ${businessName}`,
          meetingDate,
          meetingTime,
          duration: 30,
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert(`Meeting scheduled!\n\nGoogle Meet Link: ${data.event.meetLink}\n\nCalendar: ${data.event.htmlLink}`)
        loadLeads()
      } else {
        if (res.status === 401) {
          if (confirm('Google Calendar not connected. Connect now?')) {
            window.location.href = '/api/google/auth'
          }
        } else {
          alert(data.error || 'Failed to schedule meeting')
        }
      }
    } catch (error) {
      console.error('Schedule error:', error)
      alert('Failed to schedule meeting')
    }
  }

  const connectGoogleCalendar = () => {
    window.location.href = '/api/google/auth'
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-teal-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent" />
      </div>

      {/* Clean header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 border-b border-gray-200 bg-white/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <motion.h1
                className="text-2xl font-semibold text-gray-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Outreach OS
              </motion.h1>
              <p className="text-sm text-gray-500">AI-Powered Lead Generation</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={connectGoogleCalendar}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                Connect Calendar
              </motion.button>
              <div className="px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                <span className="text-xs text-gray-600 font-medium">Quality Leads</span>
                <p className="text-2xl font-bold text-indigo-600">{leads.length}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {showFeatures && leads.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">How It Works</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Outreach OS uses cutting-edge AI to find, score, and deliver only the highest quality leads for your business.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-ai-glow transition-shadow">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Find Quality Leads</h2>
                <p className="text-gray-600 text-sm mt-1">Powered by Google Maps & AI scoring</p>
              </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search Query
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., plumber, dentist"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Miami, FL"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Max Results
                  </label>
                  <input
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value))}
                    min="5"
                    max="50"
                    title="Maximum number of results"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleScrape}
                disabled={scraping || !searchQuery || !location}
                className="w-full bg-gradient-to-r from-primary via-purple-500 to-secondary text-white px-6 py-4 rounded-xl font-semibold hover:shadow-2xl hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {scraping ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    Scraping & Scoring with AI...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Scrape Quality Leads
                  </>
                )}
              </motion.button>
            </div>
          </BackgroundGradient>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <BackgroundGradient className="rounded-[22px] p-1">
            <div className="bg-black rounded-[20px] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Quality Leads (Score 75+)
                </h2>
                <p className="text-sm text-gray-400 mt-1">{leads.length} leads found</p>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >
                    <Sparkles className="w-8 h-8 text-primary" />
                  </motion.div>
                  <p className="text-gray-400 mt-4">Loading leads...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-block p-4 rounded-full bg-white/5 mb-4">
                    <Target className="w-12 h-12 text-gray-600" />
                  </div>
                  <p className="text-gray-400 text-lg">
                    No leads yet. Start scraping to find quality businesses!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Business
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          AI Score
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {leads.map((lead, idx) => (
                        <motion.tr
                          key={lead.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">{lead.businessName}</div>
                            {lead.rating && (
                              <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                <span className="text-yellow-400">⭐</span>
                                {lead.rating.toFixed(1)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {lead.category}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {lead.city}, {lead.state}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {lead.phone && (
                              <div className="text-gray-200">{lead.phone}</div>
                            )}
                            {lead.website && (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-blue-400 hover:underline"
                              >
                                Website →
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: idx * 0.05 + 0.2 }}
                              className="flex items-center"
                            >
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-bold ${
                                  lead.aiScore >= 90
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                    : lead.aiScore >= 75
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                    : 'bg-gray-700 text-gray-300'
                                }`}
                              >
                                {lead.aiScore}
                              </span>
                            </motion.div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                lead.pushedToGhl
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              }`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {!lead.pushedToGhl && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handlePushToGHL(lead.id)}
                                  className="text-primary hover:text-blue-400 font-medium text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all"
                                >
                                  <Send className="w-4 h-4" />
                                  Push to GHL
                                </motion.button>
                              )}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleScheduleMeeting(lead.id, lead.businessName)}
                                className="text-green-400 hover:text-green-300 font-medium text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 transition-all"
                                title="Schedule Google Meet"
                              >
                                📅 Meet
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </BackgroundGradient>
        </motion.div>
      </div>
    </div>
  )
}
