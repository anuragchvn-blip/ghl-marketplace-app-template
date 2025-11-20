'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, User, Key, Palette, Bell, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [locationId, setLocationId] = useState('')
  const [settings, setSettings] = useState({
    apiKey: '',
    webhookUrl: '',
    autoSync: true,
    emailNotifications: true,
    pushNotifications: false,
    theme: 'dark',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get('locationId') || 'test-location-123'
    setLocationId(id)
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem(`settings-${id}`)
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem(`settings-${locationId}`, JSON.stringify(settings))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Link 
              href={`/dashboard?locationId=${locationId}`}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Account Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Account Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-white/70 mb-2">
                  Location ID
                </label>
                <input
                  type="text"
                  value={locationId}
                  disabled
                  aria-label="Location ID"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* API Configuration */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">API Configuration</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="Enter your API key"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  placeholder="https://your-domain.com/webhook"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Preferences</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <div>
                  <div className="text-white font-medium">Auto Sync</div>
                  <div className="text-sm text-white/60">Automatically sync leads with GHL</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSync}
                  onChange={(e) => setSettings({ ...settings, autoSync: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <div>
                  <div className="text-white font-medium">Email Notifications</div>
                  <div className="text-sm text-white/60">Receive email updates about new leads</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <div>
                  <div className="text-white font-medium">Push Notifications</div>
                  <div className="text-sm text-white/60">Get browser notifications for updates</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                />
              </label>
            </div>
          </div>

          {/* Theme */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Appearance</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="theme-select" className="block text-xs sm:text-sm font-medium text-white/70 mb-2">
                  Theme
                </label>
                <select
                  id="theme-select"
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  aria-label="Theme selection"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-sm sm:text-base"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg sm:rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </motion.button>

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-green-400 font-medium"
            >
              ✓ Settings saved successfully
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
