'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import API_ROUTES from '@/lib/apiConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { 
    LayoutDashboard, 
    Users, 
    CheckCircle2, 
    Clock, 
    Globe, 
    ArrowLeft, 
    Map as MapIcon, 
    TrendingUp, 
    ShieldCheck, 
    RefreshCw, 
    Search, 
    ChevronDown,
    Activity,
    AlertCircle,
    Building2,
    Calendar
} from 'lucide-react';
import dynamic from 'next/dynamic';

const GrievanceHeatmap = dynamic(() => import('@/components/GrievanceHeatmap'), { 
    ssr: false,
    loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-3xl border border-slate-200 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest">Initialising Public Heatmap...</div>
});

const UP_DISTRICTS = [
    "All Uttar Pradesh", "Lucknow", "Kanpur Nagar", "Varanasi", "Prayagraj", "Agra", "Meerut", "Ghaziabad", "Gorakhpur", "Noida", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Ayodhya", "Jhansi", "Mathura", "Rampur", "Firozabad", "Lakhimpur Kheri"
];

interface PublicStats {
    total: number;
    resolved: number;
    pending: number;
    avgResolutionTime: string;
    publicSatisfaction: string;
}

interface RecentComplaint {
    _id: string;
    title: string;
    department: string;
    status: string;
    district: string;
    createdAt: string;
}

interface DepartmentLeader {
    department: string;
    resolutionRate: number;
}

export default function PublicAnalytics() {
    const [stats, setStats] = useState<PublicStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<DepartmentLeader[]>([]);
    const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDistrict, setSelectedDistrict] = useState("All Uttar Pradesh");
    const [countdown, setCountdown] = useState(60);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const fetchData = async (district: string) => {
        setIsRefreshing(true);
        try {
            const districtParam = district === "All Uttar Pradesh" ? "" : `?district=${district}`;
            const [statsRes, leaderboardRes, recentRes] = await Promise.all([
                axios.get(`${API_ROUTES.PUBLIC_STATS}${districtParam}`),
                axios.get(API_ROUTES.LEADERBOARD),
                axios.get(API_ROUTES.PUBLIC_RECENT)
            ]);
            setStats(statsRes.data);
            setLeaderboard(leaderboardRes.data.slice(0, 5));
            setRecentComplaints(recentRes.data);
            setCountdown(60);
        } catch (error) {
            console.error('Public data fetch failed', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData(selectedDistrict);
    }, [selectedDistrict]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    fetchData(selectedDistrict);
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [selectedDistrict]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const satisfactionValue = stats ? parseInt(stats.publicSatisfaction) : 0;

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm font-black text-slate-900 uppercase tracking-widest p-2">Bharat JanSetu Analytics</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-blue-100 font-sans">
            {/* Header */}


            <main className="max-w-[1600px] mx-auto px-6 py-10">
                {/* Hero Section with Filter */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-[40px] font-black text-slate-900 tracking-tight leading-none mb-4">Statewide Performance Index</h1>
                        <p className="text-slate-500 text-lg font-medium max-w-2xl">Real-time surveillance of public grievance resolution rates and citizen satisfaction metrics across UP.</p>
                    </div>

                    {/* District Dropdown */}
                    <div className="relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Select Jurisdiction</label>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="bg-white border border-slate-200 px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[240px] shadow-sm hover:border-blue-500 transition-all text-left group"
                        >
                            <MapIcon className="w-5 h-5 text-blue-600" />
                            <span className="flex-1 font-bold text-slate-800">{selectedDistrict}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[60] max-h-[300px] overflow-y-auto p-2"
                                >
                                    {UP_DISTRICTS.map((district) => (
                                        <button 
                                            key={district}
                                            onClick={() => {
                                                setSelectedDistrict(district);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${selectedDistrict === district ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {district}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Column: Stats & Charts (3/4) */}
                    <div className="lg:col-span-3 space-y-8">
                        
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Volume', value: stats?.total, icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'Verified Resolved', value: stats?.resolved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'SLA Pending', value: stats?.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                                { label: 'Avg Resolution', value: stats?.avgResolutionTime, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                            ].map((kpi, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={i} 
                                    className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden group"
                                >
                                    <div className={`${kpi.bg} ${kpi.color} w-10 h-10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <kpi.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-2xl font-black text-slate-900 mb-1">{kpi.value?.toLocaleString() ?? '...'}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             {/* Public Heatmap */}
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                                <div className="p-6 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><MapIcon className="w-5 h-5 text-blue-600" /> Hotspot Surveillance</h3>
                                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">Live GPS Density Map</p>
                                </div>
                                <div className="flex-1 relative z-0">
                                    <GrievanceHeatmap />
                                </div>
                            </div>

                            {/* Efficiency Leaders */}
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 h-[500px] flex flex-col">
                                <div className="mb-8 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600" /> Resolution Leaders</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">By Verified Disposal Rate</p>
                                    </div>
                                    <Activity className="w-6 h-6 text-slate-100" />
                                </div>
                                
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={leaderboard} layout="vertical" margin={{ left: 10, right: 30 }}>
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                dataKey="department" 
                                                type="category" 
                                                width={90} 
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
                                            <Bar dataKey="resolutionRate" radius={[0, 10, 10, 0]} barSize={20}>
                                                {leaderboard.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen Trust Score</h4>
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="h-14 w-14">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[{ value: satisfactionValue }, { value: 100 - satisfactionValue }]}
                                                        innerRadius={18}
                                                        outerRadius={25}
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
                                            <div className="text-3xl font-black text-slate-900 leading-none">{stats?.publicSatisfaction ?? '...'}</div>
                                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight mt-1">Verified Satisfaction</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Feed (1/4) */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col h-[700px] lg:h-auto overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Live Complaint Feed</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Updated Real-time</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {recentComplaints.map((item, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={item._id} 
                                    className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{item.department}</span>
                                        <span className="text-[9px] font-bold text-slate-400">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mb-3 leading-relaxed group-hover:text-blue-600 transition-colors">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="w-3 h-3 text-slate-300" />
                                            <span className="text-[10px] font-bold text-slate-500">{item.district}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">{item.status}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="p-4 bg-slate-900 text-white text-center">
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Citizen PII REDACTED for Privacy</p>
                        </div>
                    </div>
                </div>

                {/* Accountability Footer */}
                <div className="mt-12 bg-slate-900 rounded-[40px] p-10 lg:p-16 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px]"></div>
                    
                    <div className="relative z-10 max-w-3xl mx-auto">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[24px] flex items-center justify-center mx-auto mb-8 border border-white/20">
                            <Globe className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-[32px] lg:text-[48px] font-black mb-6 uppercase tracking-tighter italic leading-tight">Radical Accountability through Data</h2>
                        <p className="text-slate-400 text-lg font-medium mb-10 leading-relaxed">
                            The Bharat JanSetu Public Portal serves as a digital witness to the state&apos;s resolution performance. By exposing real-time metrics, we ensure every grievance from the 240 million citizens of Uttar Pradesh is addressed with absolute transparency.
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { label: 'Districts', val: '75' },
                                { label: 'Update Frequency', val: 'Realtime' },
                                { label: 'Open Source', val: 'YES' },
                                { label: 'Data Integrity', val: 'SHA-256' }
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className="text-xl font-black text-white">{stat.val}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
