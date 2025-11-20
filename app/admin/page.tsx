'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, TrendingUp, Clock, MapPin, Zap, LogOut } from 'lucide-react'
import Link from 'next/link'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  totalPurchases: number
  activePasses: number
  leadsScraped: number
}

interface User {
  id: string
  resourceId: string
  userType: string
  locationId: string | null
  companyId: string | null
  dayPassActive: boolean
  dayPassExpiresAt: string | null
  dayPassLeadsUsed: number
  dayPassLeadsLimit: number
  totalDayPassesPurchased: number
  createdAt: string
  _count: {
    leads: number
    dayPassPurchases: number
  }
}

interface Purchase {
  id: string
  amount: number
  currency: string
  status: string
  createdAt: string
  activatedAt: string | null
  user: {
    resourceId: string
    userType: string
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Check if already authenticated
    const isAuth = sessionStorage.getItem('admin-auth') === 'true'
    if (isAuth) {
      setAuthenticated(true)
      fetchAdminData()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple password check (in production, use proper authentication)
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin123') {
      sessionStorage.setItem('admin-auth', 'true')
      setAuthenticated(true)
      fetchAdminData()
    } else {
      alert('Invalid password')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin-auth')
    setAuthenticated(false)
    setStats(null)
    setUsers([])
    setPurchases([])
  }

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, purchasesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/purchases'),
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
      if (purchasesRes.ok) setPurchases(await purchasesRes.json())
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full p-8 rounded-xl border border-white/10 bg-void/50 backdrop-blur-xl"
        >
          <h1 className="font-serif text-3xl font-semibold text-stardust mb-6 text-center">
            Admin Access
          </h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm text-stardust/80 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 bg-void border border-white/10 rounded-lg text-stardust placeholder:text-stardust/40 focus:outline-none focus:border-primary/50 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Login
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-white/10 bg-void/30 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-stardust mb-2">Admin Dashboard</h1>
            <p className="text-stardust/60 text-sm">System overview and user management</p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="px-4 py-2 bg-white/5 text-stardust/80 rounded-lg hover:bg-white/10 transition-colors"
            >
              User View
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl border border-white/10 bg-void/50 backdrop-blur-sm"
            >
              <Users className="w-8 h-8 text-primary mb-3" />
              <div className="text-3xl font-serif font-semibold text-stardust mb-1">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-stardust/60">Total Users</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl border border-white/10 bg-void/50 backdrop-blur-sm"
            >
              <Zap className="w-8 h-8 text-green-400 mb-3" />
              <div className="text-3xl font-serif font-semibold text-stardust mb-1">
                {stats.activeUsers}
              </div>
              <div className="text-sm text-stardust/60">Active Users</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl border border-white/10 bg-void/50 backdrop-blur-sm"
            >
              <DollarSign className="w-8 h-8 text-yellow-400 mb-3" />
              <div className="text-3xl font-serif font-semibold text-stardust mb-1">
                ${stats.totalRevenue}
              </div>
              <div className="text-sm text-stardust/60">Total Revenue</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-xl border border-white/10 bg-void/50 backdrop-blur-sm"
            >
              <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
              <div className="text-3xl font-serif font-semibold text-stardust mb-1">
                {stats.totalPurchases}
              </div>
              <div className="text-sm text-stardust/60">Total Purchases</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-xl border border-white/10 bg-void/50 backdrop-blur-sm"
            >
              <Clock className="w-8 h-8 text-purple-400 mb-3" />
              <div className="text-3xl font-serif font-semibold text-stardust mb-1">
                {stats.activePasses}
              </div>
              <div className="text-sm text-stardust/60">Active Passes</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-xl border border-white/10 bg-void/50 backdrop-blur-sm"
            >
              <MapPin className="w-8 h-8 text-red-400 mb-3" />
              <div className="text-3xl font-serif font-semibold text-stardust mb-1">
                {stats.leadsScraped}
              </div>
              <div className="text-sm text-stardust/60">Leads Scraped</div>
            </motion.div>
          </div>
        )}

        {/* Recent Purchases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-8 rounded-xl border border-white/10 bg-void/50 backdrop-blur-sm"
        >
          <h2 className="font-serif text-2xl font-semibold text-stardust mb-6">Recent Purchases</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">User</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Activated</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase, i) => (
                  <motion.tr
                    key={purchase.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-stardust">{purchase.user.resourceId}</div>
                      <div className="text-xs text-stardust/60">{purchase.user.userType}</div>
                    </td>
                    <td className="px-6 py-4 text-stardust">
                      ${purchase.amount} {purchase.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        purchase.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        purchase.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stardust/80 text-sm">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-stardust/80 text-sm">
                      {purchase.activatedAt ? new Date(purchase.activatedAt).toLocaleDateString() : '-'}
                    </td>
                  </motion.tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-stardust/60">
                      No purchases yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* All Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-8 rounded-xl border border-white/10 bg-void/50 backdrop-blur-sm"
        >
          <h2 className="font-serif text-2xl font-semibold text-stardust mb-6">All Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Resource ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Day Pass</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Leads Used</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Total Leads</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Purchases</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stardust/80">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-stardust font-medium">{user.resourceId}</div>
                      <div className="text-xs text-stardust/60">
                        {user.locationId || user.companyId}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stardust/80">{user.userType}</td>
                    <td className="px-6 py-4">
                      {user.dayPassActive ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-green-400 text-sm">Active</span>
                          {user.dayPassExpiresAt && (
                            <span className="text-xs text-stardust/60">
                              (expires {new Date(user.dayPassExpiresAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-stardust/40 rounded-full" />
                          <span className="text-stardust/60 text-sm">Inactive</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-stardust">
                      {user.dayPassLeadsUsed}/{user.dayPassLeadsLimit}
                    </td>
                    <td className="px-6 py-4 text-stardust">{user._count.leads}</td>
                    <td className="px-6 py-4 text-stardust">{user.totalDayPassesPurchased}</td>
                    <td className="px-6 py-4 text-stardust/80 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-stardust/60">
                      No users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
