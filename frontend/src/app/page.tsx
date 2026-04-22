'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { motion, Variants } from 'framer-motion';
import API_ROUTES from '@/lib/apiConfig';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

export default function Home() {
  const [liveStats, setLiveStats] = useState({
    total: '10k+',
    avgResolution: '48 Hrs',
    satisfaction: '85%',
    districts: '75'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(API_ROUTES.PUBLIC_STATS);
        setLiveStats({
          total: data.total.toLocaleString() + '+',
          avgResolution: data.avgResolutionTime,
          satisfaction: data.publicSatisfaction,
          districts: '75'
        });
      } catch (error) {
        console.error("Failed to fetch landing stats", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-orange-200">


      {/* HERO SECTION */}
      <div className="pt-20 pb-16 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-slate-100 to-slate-50 relative overflow-hidden">

        {/* Abstract Background Blobs - Animated via Framer Motion */}
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], rotate: [0, 90, 180, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 -left-10 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-30"
        />
        <motion.div
          animate={{ x: [0, -30, 40, 0], y: [0, 50, -20, 0], rotate: [0, -90, -180, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 -right-10 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"
        />
        <motion.div
          animate={{ x: [0, 50, -50, 0], y: [0, 30, -40, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 left-1/3 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-25"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative max-w-4xl mx-auto flex flex-col items-center z-10"
        >
          <motion.span variants={fadeUp} className="bg-white/80 backdrop-blur-md text-orange-800 text-sm font-bold px-5 py-2 rounded-full mb-8 inline-flex items-center gap-2 border border-orange-200 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
            National AI-Powered Resolution Platform
          </motion.span>

          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]">
            Governance, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 drop-shadow-sm">Simplified.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="max-w-2xl text-lg sm:text-2xl text-slate-600 mb-12 leading-relaxed font-medium">
            Consolidating multiple complaint channels into a single, unified platform.
            Smart AI categorization ensures your grievance instantly reaches the right official.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5 w-full justify-center">
            <Link href="/register" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:-translate-y-1 transition-all w-full sm:w-auto text-center border border-slate-700 flex items-center justify-center gap-2">
              Register a Complaint <span>&rarr;</span>
            </Link>
            <Link href="/login" className="bg-white/80 backdrop-blur-md hover:bg-white text-slate-800 px-8 py-4 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all w-full sm:w-auto border border-slate-200 text-center">
              Track Existing Status
            </Link>
          </motion.div>

          {/* Quick Stats Banner - Glassmorphism */}
          <motion.div variants={staggerContainer} className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {[
              { label: 'Total Grievances', value: liveStats.total },
              { label: 'Avg Resolution', value: liveStats.avgResolution },
              { label: 'Public Satisfaction', value: liveStats.satisfaction },
              { label: 'Districts Live', value: liveStats.districts }
            ].map((stat, idx) => (
              <motion.div key={idx} variants={fadeUp} className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all group cursor-default">
                <div className="text-4xl font-black text-slate-900 bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">{stat.value}</div>
                <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* OFFICIAL GOVERNMENT FOOTER */}
      <footer className="bg-[#1f2937] text-slate-300 py-12 px-4 sm:px-6 lg:px-8 border-t-[4px] border-orange-500 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
          {/* Brand Col */}
          <div className="flex flex-col gap-3">
            <div className="text-2xl font-black text-white tracking-wide">
              <span className="text-orange-500">Bharat</span> JanSetu
            </div>
            <p className="text-slate-400 font-medium leading-relaxed">
              An AI-driven initiative by the National Governance Bridge to empower citizens with rapid, transparent, and accountable grievance redressal.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-bold uppercase tracking-wider mb-2">Important Links</h3>
            <Link href="/" className="hover:text-orange-400 transition-colors" aria-label="Home">Home</Link>
            <Link href="/about" className="hover:text-orange-400 transition-colors" aria-label="About the Initiative">About Initiative</Link>
            <Link href="/analytics" className="hover:text-orange-400 transition-colors" aria-label="Public Dashboard">Public Dashboard</Link>
          </div>

          {/* Policies */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-bold uppercase tracking-wider mb-2">Policies</h3>
            <Link href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-orange-400 transition-colors">Terms of Use</Link>
            <Link href="/copyright" className="hover:text-orange-400 transition-colors">Copyright Policy</Link>
            <Link href="/accessibility" className="hover:text-orange-400 transition-colors">Accessibility Statement</Link>
          </div>

          {/* National Portals */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-bold uppercase tracking-wider mb-2">National Portals</h3>
            <a href="https://www.india.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors flex items-center gap-1">
              National Portal of India <span>↗</span>
            </a>
            <a href="https://www.mygov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors flex items-center gap-1">
              MyGov Platform <span>↗</span>
            </a>
            <a href="https://www.digitalindia.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors flex items-center gap-1">
              Digital India Campaign <span>↗</span>
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-700 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <p>
            Site designed, developed and hosted by <strong className="text-slate-300">National Informatics Centre (NIC)</strong>.
          </p>
          <p>
            © {new Date().getFullYear()} Government of India. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
