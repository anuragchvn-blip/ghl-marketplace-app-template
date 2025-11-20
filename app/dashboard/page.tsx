'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Send, Target, Calendar, Menu, X, Home, Settings, LogOut, Zap, Clock } from 'lucide-react'
import Link from 'next/link'

interface Lead {
  id: string
  businessName: string
  address: string | null
  phone: string | null
  website: string | null
  rating: number | null
  reviewCount: number | null
  category: string | null
  aiScore: number
  aiReasoning: string | null
  notes: string | null
  updatedAt: string
}

interface DayPassStatus {
  dayPassActive: boolean
  dayPassExpiresAt: string | null
  dayPassLeadsUsed: number
  dayPassLeadsLimit: number
  totalDayPassesPurchased: number
  expired?: boolean
}

const features = [
  {
    icon: '🔍',
    title: 'Deep Space Scraping',
    description: 'Extract real business data directly from Google Maps with advanced scraping technology.',
  },
  {
    icon: '🤖',
    title: 'AI Quality Scoring',
    description: 'Each lead is scored 0-100 by Groq AI based on engagement potential and business quality.',
  },
  {
    icon: '🚀',
    title: 'GHL Integration',
    description: 'Push leads directly to GoHighLevel CRM with one click for immediate follow-up.',
  },
]

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [minRating, setMinRating] = useState(0)
  const [pushingLead, setPushingLead] = useState<string | null>(null)
  const [showFeatures, setShowFeatures] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [dayPassStatus, setDayPassStatus] = useState<DayPassStatus | null>(null)
  const [purchasingPass, setPurchasingPass] = useState(false)
  
  // Get locationId from URL params
  const locationId = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('locationId') || 'test-location-123'
    : 'test-location-123'

  useEffect(() => {
    fetchLeads()
    fetchDayPassStatus()
    
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    if (paymentStatus === 'success') {
      alert('✅ Day Pass activated! You now have access to 15 high-converting leads.')
      fetchDayPassStatus()
      window.history.replaceState({}, '', '/dashboard')
    } else if (paymentStatus === 'cancelled') {
      alert('❌ Payment cancelled.')
      window.history.replaceState({}, '', '/dashboard')
    } else if (paymentStatus === 'error') {
      alert('⚠️ Payment error. Please try again.')
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch(`/api/leads?locationId=${locationId}`)
      const data = await response.json()
      if (data.leads) {
        setLeads(data.leads.sort((a: Lead, b: Lead) => b.aiScore - a.aiScore))
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    }
  }

  const fetchDayPassStatus = async () => {
    try {
      const response = await fetch(`/api/user/day-pass?locationId=${locationId}`)
      const data = await response.json()
      setDayPassStatus(data)
    } catch (error) {
      console.error('Failed to fetch day pass status:', error)
    }
  }

  const handleBuyDayPass = async () => {
    setPurchasingPass(true)
    try {
      const response = await fetch(`/api/paypal/create-order?locationId=${locationId}`, {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.error) {
        alert(data.error)
        setPurchasingPass(false)
        return
      }

      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Failed to start payment. Please try again.')
      setPurchasingPass(false)
    }
  }

  const getTimeRemaining = () => {
    if (!dayPassStatus?.dayPassExpiresAt) return null
    const now = new Date().getTime()
    const expires = new Date(dayPassStatus.dayPassExpiresAt).getTime()
    const diff = expires - now
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dayPassStatus?.dayPassActive) {
      alert('⚠️ Please purchase a Day Pass to scrape leads.')
      return
    }
    
    if (dayPassStatus.dayPassLeadsUsed >= dayPassStatus.dayPassLeadsLimit) {
      alert('⚠️ You have reached your daily limit. Purchase a new Day Pass to continue.')
      return
    }
    
    setLoading(true)
    setLeads([])

    try {
      const response = await fetch(`/api/leads/scrape?locationId=${locationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery: query, location, maxResults, minRating }),
      })

      if (!response.ok) throw new Error('Scraping failed')
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const message = JSON.parse(line)
            if (message.type === 'lead') {
              setLeads(prev => {
                const newLeads = [...prev, message.data]
                return newLeads.sort((a, b) => b.aiScore - a.aiScore)
              })
            } else if (message.type === 'meta') {
              console.log('Scraping meta:', message)
            }
          } catch (e) {
            console.error('Error parsing JSON line:', e)
          }
        }
      }
    } catch (error) {
      console.error('Scraping error:', error)
      alert('Failed to scrape leads')
    } finally {
      setLoading(false)
    }
  }

  const handlePushToGHL = async (leadId: string) => {
    setPushingLead(leadId)
    try {
      const response = await fetch(`/api/leads/push?locationId=${locationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('✅ Lead pushed to GHL successfully!')
        fetchLeads()
      } else {
        alert(data.error || 'Failed to push lead')
      }
    } catch (error) {
      console.error('Push error:', error)
      alert('Failed to push lead to GHL')
    } finally {
      setPushingLead(null)
    }
  }

  const handleScheduleMeeting = async (lead: Lead) => {
    const summary = prompt('Meeting title:', `Discovery Call - ${lead.businessName}`)
    if (!summary) return

    const datetime = prompt('Date and time (YYYY-MM-DD HH:MM):', 
      new Date(Date.now() + 86400000).toISOString().slice(0, 16).replace('T', ' '))
    if (!datetime) return

    try {
      const response = await fetch(`/api/google/schedule?locationId=${locationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          summary,
          datetime,
          attendeeEmail: prompt('Attendee email (optional):') || undefined,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        if (data.authUrl) {
          window.location.href = data.authUrl
        } else if (data.meetLink) {
          alert(`Meeting scheduled! Google Meet link: ${data.meetLink}`)
        } else {
          alert(data.error || 'Failed to schedule meeting')
        }
      } else {
        alert(data.error || 'Failed to schedule meeting')
      }
    } catch (error) {
      console.error('Schedule error:', error)
      alert('Failed to schedule meeting')
    }
  }

  const connectGoogleCalendar = () => {
    window.location.href = '/api/google/auth'
  }

  const handleSaveNote = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/note?locationId=${locationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteText }),
      })

      if (response.ok) {
        setLeads(prev => prev.map(l => 
          l.id === leadId ? { ...l, notes: noteText } : l
        ))
        setEditingNote(null)
        setNoteText('')
      }
    } catch (error) {
      console.error('Save note error:', error)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden border-b border-white/10 bg-void/50 backdrop-blur-xl sticky top-0 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg text-stardust font-medium">Outreach OS</span>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <motion.aside 
        initial={{ width: 240 }}
        animate={{ 
          width: isSidebarOpen ? 240 : 80,
          x: isSidebarOpen ? 0 : -240
        }}
        className={`${isSidebarOpen ? 'fixed md:relative' : 'hidden md:flex'} inset-0 md:inset-auto border-r border-white/10 bg-void/50 backdrop-blur-xl z-40 md:z-50 flex-col md:sticky top-0 h-screen`}
      >
        <div className="hidden md:flex p-6 items-center justify-between">
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-serif text-xl text-stardust font-medium"
            >
              Outreach OS
            </motion.span>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary-light rounded-lg border border-primary/20">
            <Home size={20} />
            {isSidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link href={`/settings?locationId=${locationId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-stardust/60 hover:text-stardust rounded-lg transition-colors">
            <Settings size={20} />
            {isSidebarOpen && <span>Settings</span>}
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => window.location.href = '/api/auth/logout'}
            className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Disconnect</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-auto">
        <div className="border-b border-white/10 bg-void/30 backdrop-blur-xl sticky top-0 md:top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-stardust mb-1 sm:mb-2">Lead Discovery</h1>
              <p className="text-stardust/60 text-xs sm:text-sm">Find and score high-quality leads with AI</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {dayPassStatus?.dayPassActive ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 px-3 sm:px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-xs sm:text-sm text-green-400">
                      {dayPassStatus.dayPassLeadsUsed}/{dayPassStatus.dayPassLeadsLimit} leads
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-xs sm:text-sm text-green-400">{getTimeRemaining()}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleBuyDayPass}
                  disabled={purchasingPass}
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm w-full sm:w-auto"
                >
                  {purchasingPass ? 'Processing...' : 'Buy Day Pass - $7'}
                </button>
              )}
              
              <button
                onClick={connectGoogleCalendar}
                className="hidden sm:flex px-4 py-2 bg-primary/10 border border-primary/20 text-primary-light rounded-lg hover:bg-primary/20 transition-colors items-center gap-2 text-sm"
              >
                <Calendar size={16} />
                <span>Sync Calendar</span>
              </button>
              
              <div className="text-center sm:text-right">
                <div className="text-xl sm:text-2xl font-serif font-semibold text-stardust">{leads.length}</div>
                <div className="text-xs text-stardust/60">Total Leads</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          {showFeatures && leads.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="p-6 rounded-xl border border-white/10 bg-void/50 backdrop-blur-sm hover:border-primary/30 transition-colors"
                  >
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="font-serif text-xl font-semibold text-stardust mb-2">{feature.title}</h3>
                    <p className="text-stardust/60 text-sm">{feature.description}</p>
                  </motion.div>
                ))}
              </div>

              {!dayPassStatus?.dayPassActive && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="p-8 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 backdrop-blur-sm"
                >
                  <h3 className="font-serif text-2xl font-semibold text-stardust mb-4">White Label Partnership</h3>
                  <p className="text-stardust/80 mb-6">
                    Looking for a white-label solution? Contact us for enterprise pricing and custom branding options.
                  </p>
                  <a 
                    href="mailto:anuragchvn1@gmail.com"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    <Send size={18} />
                    Contact for White Label
                  </a>
                </motion.div>
              )}
            </motion.div>
          )}

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="mb-8 sm:mb-12 p-4 sm:p-6 lg:p-8 rounded-xl border border-white/10 bg-void/50 backdrop-blur-sm"
          >
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-stardust mb-4 sm:mb-6">Scrape New Leads</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div>
                <label className="block text-xs sm:text-sm text-stardust/80 mb-2">Business Type</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., restaurants, plumbers"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-void border border-white/10 rounded-lg text-stardust placeholder:text-stardust/40 focus:outline-none focus:border-primary/50 transition-colors text-sm sm:text-base"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm text-stardust/80 mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Miami, FL"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-void border border-white/10 rounded-lg text-stardust placeholder:text-stardust/40 focus:outline-none focus:border-primary/50 transition-colors text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm text-stardust/80 mb-2">Max Results</label>
                <input
                  type="number"
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  min="1"
                  max="50"
                  aria-label="Maximum number of results"
                  className="w-full px-4 py-3 bg-void border border-white/10 rounded-lg text-stardust focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm text-stardust/80 mb-2">Minimum Rating</label>
                <input
                  type="number"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  min="0"
                  max="5"
                  step="0.1"
                  aria-label="Minimum business rating"
                  className="w-full px-4 py-3 bg-void border border-white/10 rounded-lg text-stardust focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Target size={20} />
                  Start Scraping
                </>
              )}
            </button>
          </motion.form>

          {leads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl font-semibold text-stardust">Your Leads</h2>
                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  className="text-sm text-primary-light hover:text-primary transition-colors"
                >
                  {showFeatures ? 'Hide' : 'Show'} Features
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Business</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Contact</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Rating</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">AI Score</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Notes</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-stardust">{lead.businessName}</div>
                            <div className="text-sm text-stardust/60">{lead.address}</div>
                            {lead.category && (
                              <div className="text-xs text-stardust/40 mt-1">{lead.category}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {lead.phone && <div className="text-stardust">{lead.phone}</div>}
                            {lead.website && (
                              <a 
                                href={lead.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary-light hover:text-primary transition-colors"
                              >
                                Website
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {lead.rating && (
                            <div className="flex items-center gap-2">
                              <span className="text-stardust">⭐ {lead.rating.toFixed(1)}</span>
                              {lead.reviewCount && (
                                <span className="text-xs text-stardust/60">({lead.reviewCount})</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              lead.aiScore >= 80 ? 'bg-green-500/20 text-green-400' :
                              lead.aiScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {lead.aiScore}
                            </div>
                            {lead.aiReasoning && (
                              <button
                                onClick={() => alert(lead.aiReasoning)}
                                className="text-stardust/60 hover:text-stardust transition-colors"
                                title="View AI reasoning"
                              >
                                <Sparkles size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {editingNote === lead.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="px-3 py-1 bg-void border border-white/10 rounded text-sm text-stardust focus:outline-none focus:border-primary/50"
                                placeholder="Add note..."
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveNote(lead.id)}
                                className="px-3 py-1 bg-primary/20 text-primary-light rounded text-sm hover:bg-primary/30 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNote(null)
                                  setNoteText('')
                                }}
                                className="px-3 py-1 bg-white/5 text-stardust/60 rounded text-sm hover:bg-white/10 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingNote(lead.id)
                                setNoteText(lead.notes || '')
                              }}
                              className="text-sm text-stardust/60 hover:text-stardust transition-colors"
                            >
                              {lead.notes || 'Add note...'}
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleScheduleMeeting(lead)}
                              className="px-3 py-1.5 bg-secondary/20 text-secondary-light rounded text-sm hover:bg-secondary/30 transition-colors flex items-center gap-1"
                            >
                              <Calendar size={14} />
                              Schedule
                            </button>
                            <button
                              onClick={() => handlePushToGHL(lead.id)}
                              disabled={pushingLead === lead.id}
                              className="px-3 py-1.5 bg-primary/20 text-primary-light rounded text-sm hover:bg-primary/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <Send size={14} />
                              {pushingLead === lead.id ? 'Pushing...' : 'Push to GHL'}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
