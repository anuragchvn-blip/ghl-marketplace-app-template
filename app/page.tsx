'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Orbital Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white/5 rounded-full opacity-10" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-cosmic opacity-40" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block py-1 px-3 rounded-full border border-white/10 bg-white/5 text-xs font-medium tracking-wider uppercase mb-8 text-primary-light">
            System Online
          </span>
          
          <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tight leading-tight mb-8 text-stardust hover:font-semibold transition-all duration-700 cursor-default">
            The Operating System <br />
            <span className="italic text-white/80">for Lead Generation</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Harness the power of AI to discover, score, and engage with local businesses. 
            A cosmic leap forward in outreach automation.
          </p>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link 
              href="/dashboard" 
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 rounded-full text-primary-light transition-all duration-300 backdrop-blur-sm"
            >
              <span className="font-medium tracking-wide">Initialize Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 rounded-full ring-1 ring-white/20 group-hover:ring-white/40 transition-all" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer/Status */}
      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-xs text-white/20 font-mono uppercase tracking-widest">
          Outreach OS v2.0 • Deep Space Network
        </p>
      </div>
    </main>
  )
}
