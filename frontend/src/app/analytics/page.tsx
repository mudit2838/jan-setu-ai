'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { LayoutDashboard, Users, CheckCircle2, Clock, Globe, ArrowLeft, Map as MapIcon, TrendingUp, ShieldCheck } from 'lucide-react';
import dynamic from 'next/dynamic';

const GrievanceHeatmap = dynamic(() => import('@/components/GrievanceHeatmap'), { 
    ssr: false,
    loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-3xl border border-slate-200 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest">Initialising Public Heatmap...</div>
});

export default function PublicAnalytics() {
    const [stats, setStats] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, leaderboardRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/master/public/stats'),
                    axios.get('http://localhost:5000/api/master/public/leaderboard')
                ]);
                setStats(statsRes.data);
                setLeaderboard(leaderboardRes.data.slice(0, 5));
            } catch (error) {
                console.error('Public data fetch failed', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm font-black text-slate-900 uppercase tracking-widest p-2">Bharat JanSetu Analytics</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-blue-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                        <div className="flex items-center gap-2 text-xl font-black bg-gradient-to-r from-orange-600 via-green-600 to-blue-600 bg-clip-text text-transparent">
                            Bharat JanSetu <span className="text-slate-900 ml-1 uppercase text-xs tracking-tighter bg-slate-100 px-2 py-1 rounded inline-block">Public Portal</span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
                        <div className="flex items-center gap-2 text-green-600"><div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div> Live Monitoring</div>
                        <Link href="/login" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs hover:bg-slate-800 transition">Official Login</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Hero Title */}
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Digital Transparency Dashboard</h1>
                    <p className="text-slate-500 text-lg mt-2 max-w-3xl">Real-time surveillance of grievance resolution performance across all 75 districts of Uttar Pradesh.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Grievances', value: stats?.total, icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Verified Resolutions', value: stats?.resolved, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Pending Processing', value: stats?.pending, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Citizen Satisfaction', value: stats?.publicSatisfaction, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                    ].map((kpi, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i} 
                            className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className={`${kpi.bg} ${kpi.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <kpi.icon className="w-6 h-6" />
                            </div>
                            <div className="text-3xl font-black text-slate-900 mb-1">{kpi.value.toLocaleString()}</div>
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{kpi.label}</div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Public Heatmap */}
                    <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><MapIcon className="w-5 h-5 text-blue-600" /> Geographic Intensity Surveillance</h3>
                                <p className="text-sm text-slate-500 mt-1">Real-time identification of grievance hotspots based on GPS-tagged reports.</p>
                            </div>
                        </div>
                        <div className="flex-1 relative z-0">
                            <GrievanceHeatmap />
                        </div>
                    </div>

                    {/* Departmental Efficiency */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 h-[600px] flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600" /> Resolution Leaders</h3>
                            <p className="text-sm text-slate-500 mt-1">Performance ranking of departments based on verified resolution rates.</p>
                        </div>
                        
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={leaderboard} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="department" 
                                        type="category" 
                                        width={100} 
                                        fontSize={10} 
                                        fontWeight="900" 
                                        textAnchor="end"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="resolutionRate" radius={[0, 10, 10, 0]} barSize={25}>
                                        {leaderboard.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">State Satisfaction Index</h4>
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[{ value: 85 }, { value: 15 }]}
                                                innerRadius={20}
                                                outerRadius={30}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#10b981" />
                                                <Cell fill="#f1f5f9" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-slate-900">85%</div>
                                    <div className="text-[10px] font-bold text-green-600 uppercase">Public Trust Score</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Transparency Notice */}
                <div className="bg-slate-900 rounded-[32px] p-10 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]"></div>
                    <div className="relative z-10">
                        <Globe className="w-12 h-12 text-blue-400 mx-auto mb-6" />
                        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter italic">Committed to Radical Transparency</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto font-medium">
                            The Bharat JanSetu Public Portal is updated every 15 minutes. This live data feed ensures every citizen of Uttar Pradesh can hold the state machinery accountable for prompt resolution of public grievances.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
