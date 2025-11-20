'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Sparkles, Send, Target, Calendar, Menu, X, Home, Settings, LogOut } from 'lucide-react'
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

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      const data = await response.json()
      if (data.leads) {
        setLeads(data.leads.sort((a: Lead, b: Lead) => b.aiScore - a.aiScore))
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLeads([]) // Clear previous leads

    try {
      const response = await fetch('/api/leads/scrape', {
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
        buffer = lines.pop() || '' // Keep the last incomplete line in buffer

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
      const response = await fetch('/api/leads/push-to-ghl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      })

      if (response.ok) {
        alert('Lead pushed to GHL successfully!')
      } else {
        alert('Failed to push lead to GHL')
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
      const response = await fetch('/api/google/schedule', {
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
      const response = await fetch(`/api/leads/${leadId}/note`, {
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

  // Auto-refresh leads every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={{ width: 240 }}
        animate={{ width: isSidebarOpen ? 240 : 80 }}
        className="border-r border-white/10 bg-void/50 backdrop-blur-xl z-50 flex flex-col sticky top-0 h-screen"
      >
        <div className="p-6 flex items-center justify-between">
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
          <Link href="/settings" className="w-full flex items-center gap-3 px-4 py-3 text-foreground hover:text-stardust hover:bg-white/5 rounded-lg transition-colors">
            <Settings size={20} />
            {isSidebarOpen && <span>Settings</span>}
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => window.location.href = '/api/auth/logout'}
            className="w-full flex items-center gap-3 px-4 py-3 text-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Disconnect</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {/* Header */}
        <header className="border-b border-white/10 bg-void/50 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-serif text-stardust">Mission Control</h1>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={connectGoogleCalendar}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-primary/50 text-sm font-medium transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-primary-light" />
                <span>Sync Calendar</span>
              </motion.button>
              <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-xs text-primary-light font-medium uppercase tracking-wider">Leads Found</span>
                <span className="ml-2 text-lg font-bold text-stardust">{leads.length}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* Features section */}
          {showFeatures && leads.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-serif text-stardust mb-4">System Capabilities</h2>
                <p className="text-foreground max-w-2xl mx-auto text-lg font-light">
                  Deploy autonomous agents to scout, analyze, and engage with high-value targets across the digital expanse.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="bg-surface border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group"
                  >
                    <div className="mb-4 w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-serif text-stardust mb-2">{feature.title}</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Scraping form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-white/5 rounded-xl p-8 mb-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="mb-8 relative z-10">
              <h2 className="text-2xl font-serif text-stardust mb-2">Initiate Scan</h2>
              <p className="text-foreground text-sm">Configure scan parameters for target acquisition.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-foreground uppercase tracking-wider mb-2">
                    Target Sector
                  </label>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., Dental Clinics"
                      className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 text-stardust placeholder-white/20 transition-colors"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground uppercase tracking-wider mb-2">
                    Target Coordinates
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Austin, TX"
                      className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 text-stardust placeholder-white/20 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-foreground uppercase tracking-wider mb-2">
                    Max Targets
                  </label>
                  <input
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value) || 20)}
                    min="1"
                    max="100"
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 text-stardust transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground uppercase tracking-wider mb-2">
                    Min Rating Threshold
                  </label>
                  <input
                    type="number"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 text-stardust transition-colors"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-glow"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Scanning Sector...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Execute Scan</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Leads table */}
          {leads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-white/5 rounded-xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif text-stardust mb-1">Acquired Targets</h2>
                  <p className="text-xs text-foreground uppercase tracking-wider">Sorted by AI Probability Score</p>
                </div>
                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  className="text-xs text-primary-light hover:text-primary transition-colors uppercase tracking-wider font-medium"
                >
                  {showFeatures ? 'Hide' : 'Show'} Intel
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="text-left py-4 px-6 text-xs font-medium text-foreground uppercase tracking-wider">Entity</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-foreground uppercase tracking-wider">Coordinates</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-foreground uppercase tracking-wider">Comms</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-foreground uppercase tracking-wider">Rating</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-foreground uppercase tracking-wider">AI Score</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-foreground uppercase tracking-wider">Notes</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leads.map((lead, index) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-stardust">{lead.businessName}</p>
                            <p className="text-xs text-foreground/70 mt-1">{lead.category || 'Unknown Sector'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-foreground/80">{lead.address || 'N/A'}</td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {lead.phone && (
                              <p className="text-sm text-foreground/80">{lead.phone}</p>
                            )}
                            {lead.website && (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary-light hover:text-primary hover:underline block"
                              >
                                Uplink →
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {lead.rating ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-yellow-500 text-sm">★</span>
                              <span className="text-stardust font-medium">{lead.rating}</span>
                              {lead.reviewCount && (
                                <span className="text-foreground/50 text-xs">({lead.reviewCount})</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-foreground/30 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border ${
                              lead.aiScore >= 80
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : lead.aiScore >= 60
                                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                              {lead.aiScore}
                            </div>
                            <div className="flex-1 h-1 bg-white/10 rounded-full w-16 overflow-hidden">
                              <div
                                style={{ width: `${lead.aiScore}%` }}
                                className={`h-full ${
                                  lead.aiScore >= 80
                                    ? 'bg-emerald-500'
                                    : lead.aiScore >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 max-w-[200px]">
                          {editingNote === lead.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add note..."
                                className="flex-1 bg-cosmic-darker/50 border border-cosmic-lighter/30 rounded px-2 py-1 text-sm text-stardust focus:outline-none focus:border-primary/50"
                              />
                              <button
                                onClick={() => handleSaveNote(lead.id)}
                                className="text-primary hover:text-primary/80 text-xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNote(null)
                                  setNoteText('')
                                }}
                                className="text-stardust/50 hover:text-stardust/80 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm text-foreground/80">{lead.notes || 'No notes'}</span>
                              <button
                                onClick={() => {
                                  setEditingNote(lead.id)
                                  setNoteText(lead.notes || '')
                                }}
                                className="text-primary/70 hover:text-primary text-xs"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleScheduleMeeting(lead)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-stardust transition-colors"
                              title="Schedule Meeting"
                            >
                              <Calendar size={16} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePushToGHL(lead.id)}
                              disabled={pushingLead === lead.id}
                              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary-light transition-colors disabled:opacity-50"
                              title="Push to GHL"
                            >
                              <Send size={16} />
                            </motion.button>
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
