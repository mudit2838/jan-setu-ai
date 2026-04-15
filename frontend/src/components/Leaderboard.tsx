'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, TrendingUp, TrendingDown, Target, Loader2, Award, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import API_ROUTES from '@/lib/apiConfig';

interface DepartmentStat {
    department: string;
    total: number;
    resolutionRate: number;
}

export default function Leaderboard() {
    const [stats, setStats] = useState<DepartmentStat[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(API_ROUTES.LEADERBOARD, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data);
        } catch (error) {
            console.error('Leaderboard data fetch failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center animate-pulse">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">Calculating State Performance Index...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Performance Rankings</h2>
                    </div>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {stats.map((dept, index: number) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={dept.department} 
                                className={`flex items-center justify-between p-5 rounded-2xl border transition-all hover:scale-[1.01] ${index === 0 ? 'bg-blue-600 text-white border-transparent shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)]' : 'bg-white border-slate-100 hover:border-blue-200'}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className={`font-black text-base ${index === 0 ? 'text-white' : 'text-slate-900'}`}>{dept.department}</div>
                                        <div className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${index === 0 ? 'text-white/70' : 'text-slate-400'}`}>
                                            {dept.total} Grievances Processed
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={`text-2xl font-black ${index === 0 ? 'text-white' : 'text-blue-600'}`}>{dept.resolutionRate.toFixed(1)}%</div>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest ${index === 0 ? 'text-white/70' : 'text-slate-400'}`}>Efficiency Score</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                        <Award className="w-32 h-32" />
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl w-fit mb-6">
                        <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 tracking-tight">Department Resolution Index</h3>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium mb-6">Active performance analysis across thousands of grievances using real-time government resolution data.</p>
                    
                    <div className="space-y-4 pt-6 border-t border-slate-800">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Avg Response Time</span>
                            <span className="text-white font-black">2.4 Days</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Critical SLA Met</span>
                            <span className="text-green-400 font-black">94.2%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Infrastructure Alert</h3>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium mb-4">Grievance volume has increased by **14%** in the **Electricity** department over the last 48 hours.</p>
                    <button className="w-full bg-slate-900 text-white text-xs py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-lg">Verify Incident Zones</button>
                </div>
            </div>
        </div>
    );
}
