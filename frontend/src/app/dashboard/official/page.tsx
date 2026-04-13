'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Briefcase, Activity, CheckCircle, Clock, AlertTriangle, Search, LogOut, ArrowRight, XCircle, Loader2, Image as ImageIcon, User, ShieldCheck, Mail, Phone, MapPin, Calendar, Building, Lock, Globe, Info } from 'lucide-react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import GrievanceHeatmap from '@/components/GrievanceHeatmap';
import OfficialDirectory from '@/components/OfficialDirectory';
import Leaderboard from '@/components/Leaderboard';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import SkeletonCard from '@/components/SkeletonCard';
import { Users, LayoutDashboard, Database, Map as MapIcon, Trophy } from 'lucide-react';

const MapDisplay = dynamic(() => import('@/components/MapDisplay'), {
    ssr: false,
    loading: () => <div className="h-[250px] w-full bg-slate-100 animate-pulse rounded-xl border border-slate-200"></div>
});

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    const [complaints, setComplaints] = useState([]);
    const [analyticsData, setAnalyticsData] = useState({ statusData: [], categoryData: [], priorityData: [] });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // All | Pending | Escalated | Resolved
    const [activeTab, setActiveTab] = useState('inbox'); // inbox | heatmap | directory | leaderboard
    const [accountSubTab, setAccountSubTab] = useState('general'); // general | authority | system
    const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);

    // Action Modal State
    const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionData, setActionData] = useState({
        status: '',
        remarks: '',
        proofImage: ''
    });
    const [uploadingProof, setUploadingProof] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userDataStr = localStorage.getItem('user');
        if (!token || !userDataStr) {
            router.push('/login');
            return;
        }

        const userData = JSON.parse(userDataStr);
        // Basic RBAC guard on frontend
        if (!['admin', 'official_block', 'official_district', 'official_state', 'official_super'].includes(userData.role)) {
            router.push('/dashboard/citizen');
            return;
        }

        setUser(userData);
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [complaintsRes, analyticsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/complaints/admin', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/complaints/analytics', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setComplaints(complaintsRes.data);
            setAnalyticsData(analyticsRes.data);
        } catch (error: any) {
            console.error('Failed to fetch dashboard data');
            if (error.response?.status === 401) {
                localStorage.clear();
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const submitAction = async () => {
        setActionLoading(true);
        try {
            await axios.put(`http://localhost:5000/api/complaints/${selectedComplaint._id}/status`, actionData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            toast.success('Complaint updated successfully.');
            setSelectedComplaint(null);
            setActionData({ status: '', remarks: '', proofImage: '' });
            fetchComplaints();

        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update complaint status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingProof(true);
        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const { data } = await axios.post('http://localhost:5000/api/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setActionData(prev => ({ ...prev, proofImage: data.url }));
            toast.success('Document uploaded automatically.');
        } catch (error) {
            console.error('Image upload failed', error);
            toast.error('Failed to upload proof image. Please try again.');
        } finally {
            setUploadingProof(false);
        }
    };

    const handleGenerateAI = async () => {
        setGeneratingAI(true);
        try {
            const { data } = await axios.post('http://localhost:8000/api/generate-response', {
                title: selectedComplaint.title,
                description: selectedComplaint.description,
                department: selectedComplaint.department
            });
            setActionData(prev => ({ ...prev, remarks: data.draft }));
            toast.success('AI Draft Generated');
        } catch (error) {
            console.error('AI Generation failed', error);
            toast.error('AI Generation service is currently unavailable.');
        } finally {
            setGeneratingAI(false);
        }
    };

    const filteredComplaints = complaints.filter((c: any) => {
        if (filter === 'All') return true;
        if (filter === 'Pending') return c.status === 'Pending Assignment' || c.status === 'In Progress';
        if (filter === 'Escalated') return c.status.includes('Escalated') || c.status === 'State Re-Review Required';
        if (filter === 'Resolved') return c.status.includes('Resolved') || c.status === 'Closed Permanently';
        return true;
    });

    // KPI Calculations
    const kpiPending = complaints.filter((c: any) => c.status === 'Pending Assignment' || c.status === 'In Progress').length;
    const kpiEscalated = complaints.filter((c: any) => c.status.includes('Escalated')).length;
    const kpiResolved = complaints.filter((c: any) => c.status.includes('Resolved') || c.status === 'Closed Permanently').length;

    if (!user) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-slate-50 flex"
        >
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 font-bold text-xl text-white border-b border-slate-800">
                    Official Portal
                </div>
                <div className="p-6">
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Officer Profile</div>
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-xs text-blue-400 mt-1 uppercase tracking-wider font-bold">Level: {user.role.replace('official_', '').toUpperCase()} Authority</div>
                    <div className="text-xs text-slate-400 mt-1">{user.department || 'State Administration'} Dept.</div>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button onClick={() => setActiveTab('inbox')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inbox' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                        <LayoutDashboard className="w-5 h-5" /> Assigned Inbox
                    </button>
                    {user.role === 'official_super' && (
                        <>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-4 pb-2 px-4 border-t border-slate-800 mt-4">Master Intelligence</div>
                            <button onClick={() => setActiveTab('heatmap')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'heatmap' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                                <MapIcon className="w-5 h-5" /> Geographic Heatmap
                            </button>
                            <button onClick={() => setActiveTab('leaderboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'leaderboard' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                                <Trophy className="w-5 h-5" /> Resolution Rankings
                            </button>
                            <button onClick={() => setActiveTab('directory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'directory' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                                <Users className="w-5 h-5" /> Official Directory
                            </button>
                        </>
                    )}
                    <button onClick={() => setActiveTab('account')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'account' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                        <User className="w-5 h-5" /> My Profile
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
                        <LogOut className="w-5 h-5" /> Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative pb-16 md:pb-0">

                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8">
                    <h1 className="text-xl font-bold text-slate-900">Grievance Command Center</h1>
                    <div className="text-sm text-slate-500 font-medium">Logged in via Enterprise Security</div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">

                        {activeTab === 'account' && (
                            <div className="max-w-6xl mx-auto pb-20">
                                {/* Breadcrumbs */}
                                <nav className="flex mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    <button onClick={() => setActiveTab('inbox')} className="hover:text-blue-600 transition-colors">Command Center</button>
                                    <span className="mx-3 text-slate-700">/</span>
                                    <span className="text-slate-300">Administrative Identity</span>
                                </nav>

                                <div className="flex flex-col lg:flex-row gap-10 text-white">
                                    {/* Sidebar Navigation */}
                                    <aside className="w-full lg:w-72 shrink-0">
                                        <div className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl p-6 sticky top-24">
                                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
                                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                                    <User className="w-6 h-6" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="font-black text-white text-sm truncate">{user.name}</div>
                                                    <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">{user.role.replace('_', ' ')}</div>
                                                </div>
                                            </div>
                                            
                                            <nav className="space-y-1">
                                                {[
                                                    { id: 'general', label: 'Identity & Credentials', icon: User },
                                                    { id: 'authority', label: 'Jurisdictional Scope', icon: ShieldCheck },
                                                    { id: 'system', label: 'System Preferences', icon: Database }
                                                ].map(tab => (
                                                    <button 
                                                        key={tab.id}
                                                        onClick={() => setAccountSubTab(tab.id)}
                                                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${accountSubTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
                                                    >
                                                        <tab.icon className="w-4 h-4" /> {tab.label}
                                                    </button>
                                                ))}
                                            </nav>
                                        </div>
                                    </aside>

                                    {/* Main Content Area */}
                                    <div className="flex-1 space-y-10">
                                        {accountSubTab === 'general' && (
                                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                                {/* Official Header */}
                                                <div className="bg-slate-900 rounded-[40px] border border-slate-800 p-10 relative overflow-hidden mb-10 shadow-xl">
                                                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                                                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-10">
                                                        <div className="w-32 h-32 bg-slate-800 rounded-[32px] p-1 shadow-2xl flex items-center justify-center border border-slate-700">
                                                            <div className="w-full h-full bg-slate-900 rounded-[28px] flex items-center justify-center border border-slate-800">
                                                                <User className="w-12 h-12 text-slate-700" />
                                                            </div>
                                                        </div>
                                                        <div className="text-center sm:text-left flex-1">
                                                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                                                                <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> High Trust Verified</span>
                                                                <span className="bg-slate-800 text-slate-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-700 shadow-lg">EMP_ID_8841</span>
                                                            </div>
                                                            <h1 className="text-4xl font-black text-white tracking-tighter">{user.name}</h1>
                                                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-3 flex items-center justify-center sm:justify-start gap-2 italic">
                                                                <Building className="w-3.5 h-3.5 text-blue-500" /> {user.department || 'State Administration Service'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 hover:border-blue-600/30 transition-all shadow-xl group">
                                                        <h3 className="font-black text-blue-400 mb-6 flex items-center gap-2 uppercase text-[10px] tracking-[0.2em]"><Mail className="w-4 h-4" /> Comms Registry</h3>
                                                        <div className="space-y-8">
                                                            <div>
                                                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Authenticated Mobile</label>
                                                                <div className="text-xl font-black text-white">+91 {user.mobile}</div>
                                                            </div>
                                                            <div className="pt-8 border-t border-slate-800">
                                                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Digital Address</label>
                                                                <div className="text-xl font-black text-white italic">{user.email || 'PENDING_REGISTRATION'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 hover:border-blue-600/30 transition-all shadow-xl">
                                                        <h3 className="font-black text-blue-400 mb-6 flex items-center gap-2 uppercase text-[10px] tracking-[0.2em]"><Clock className="w-4 h-4" /> Duty Audit</h3>
                                                        <div className="space-y-8">
                                                            <div>
                                                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Account Provisioned On</label>
                                                                <div className="text-xl font-black text-white">{new Date(user.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                                            </div>
                                                            <div className="pt-8 border-t border-slate-800 flex items-center justify-between">
                                                                <div>
                                                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">System Status</label>
                                                                    <div className="flex items-center gap-2 text-green-500 font-black text-xs uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Active / Priority</div>
                                                                </div>
                                                                <Lock className="w-5 h-5 text-slate-800" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {accountSubTab === 'authority' && (
                                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                                <div className="bg-slate-900 rounded-[32px] border border-slate-800 p-10 shadow-2xl">
                                                    <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-800">
                                                        <div className="w-16 h-16 bg-blue-600/10 rounded-[22px] flex items-center justify-center text-blue-600 border border-blue-600/20"><Globe className="w-8 h-8" /></div>
                                                        <div>
                                                            <h3 className="text-2xl font-black text-white">Jurisdictional Surveillance</h3>
                                                            <p className="text-slate-500 text-xs mt-1 uppercase font-bold tracking-widest">Authorized Execution Limits — Uttar Pradesh</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                                        <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-colors">
                                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Designation</label>
                                                            <div className="text-sm font-black text-white uppercase">{user.role.replace('official_', '')} Authority</div>
                                                        </div>
                                                        <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">District Scope</label>
                                                            <div className="text-sm font-black text-white uppercase">{user.district || 'State-Wide Command'}</div>
                                                        </div>
                                                        <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Block Domain</label>
                                                            <div className="text-sm font-black text-white uppercase">{user.block || 'Regional Oversight'}</div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-10 p-8 bg-blue-600/5 border border-blue-600/20 rounded-3xl flex items-center gap-6">
                                                        <Info className="w-6 h-6 text-blue-500 shrink-0" />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Your authority is scoped to the above jurisdictions. Any resolution actions outside these domains require delegation from a state-level supervisor.</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'heatmap' && <GrievanceHeatmap />}
                        {activeTab === 'leaderboard' && <Leaderboard />}
                        {activeTab === 'directory' && <OfficialDirectory />}

                        {activeTab === 'inbox' && (
                            <>
                                {/* DATA ANALYTICS CHARTS */}
                                {!loading && complaints.length > 0 && (
                                    <AnalyticsDashboard
                                        statusData={analyticsData.statusData}
                                        categoryData={analyticsData.categoryData}
                                        priorityData={analyticsData.priorityData}
                                    />
                                )}
                            </>
                        )}

                        {activeTab === 'inbox' && (
                            <>
                                {/* KPI DASHBOARD */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-500 font-medium tracking-wide">Total Assigned</div>
                                            <div className="text-2xl font-bold text-slate-900">{complaints.length}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-500 font-medium tracking-wide">Pending Action</div>
                                            <div className="text-2xl font-bold text-slate-900">{kpiPending}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-500 font-medium tracking-wide">Escalated Tickets</div>
                                            <div className="text-2xl font-bold text-slate-900">{kpiEscalated}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-500 font-medium tracking-wide">Resolved</div>
                                            <div className="text-2xl font-bold text-slate-900">{kpiResolved}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* TAB FILTERS */}
                                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                    {['All', 'Pending', 'Escalated', 'Resolved'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${filter === f ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            {f} Tickets
                                        </button>
                                    ))}
                                </div>

                                {/* COMPLAINTS LIST TABLE */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-xs">
                                                <tr>
                                                    <th className="p-4 pl-6">ID & Priority</th>
                                                    <th className="p-4">Complaint Title</th>
                                                    <th className="p-4">Location</th>
                                                    <th className="p-4">Status</th>
                                                    <th className="p-4">Deadline</th>
                                                    <th className="p-4 pr-6 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={6} className="p-4">
                                                            <div className="grid gap-4">
                                                                <SkeletonCard />
                                                                <SkeletonCard />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : filteredComplaints.length === 0 ? (
                                                    <tr><td colSpan={6} className="text-center py-10 text-slate-500">No tickets found in this category.</td></tr>
                                                ) : (
                                                    filteredComplaints.map((c: any) => (
                                                        <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-4 pl-6">
                                                                <div className="font-mono text-slate-500 text-xs mb-1">#{c._id.substring(c._id.length - 6).toUpperCase()}</div>
                                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${c.priority === 'High' ? 'bg-red-100 text-red-700' : c.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                    {c.priority} Due
                                                                </span>
                                                            </td>
                                                            <td className="p-4 font-medium text-slate-900 max-w-xs truncate">
                                                                {c.title}
                                                                {c.escalationHistory && c.escalationHistory.length > 0 && (
                                                                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-red-600 font-bold bg-red-50 w-fit px-2 py-0.5 rounded border border-red-100">
                                                                        <AlertTriangle className="w-3 h-3" />
                                                                        ESCALATED FROM {c.escalationHistory[c.escalationHistory.length - 1].fromLevel.toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="text-slate-900">{c.village}</div>
                                                                <div className="text-xs text-slate-500">{c.block}, {c.district}</div>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === 'Resolved' || c.status === 'Closed Permanently' ? 'bg-green-100 text-green-700' :
                                                                    c.status.includes('Escalated') || c.status === 'State Re-Review Required' ? 'bg-red-100 text-red-700' :
                                                                        c.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                                            'bg-orange-100 text-orange-700'
                                                                    }`}>
                                                                    {c.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                {c.slaDueDate ? (
                                                                    <div className={`font-mono text-xs font-bold ${new Date(c.slaDueDate) < new Date() && c.status !== 'Resolved' ? 'text-red-600 bg-red-50 px-2 py-1 rounded inline-block' : 'text-slate-600'}`}>
                                                                        {new Date(c.slaDueDate).toLocaleDateString()} {new Date(c.slaDueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        {new Date(c.slaDueDate) < new Date() && c.status !== 'Resolved' && ' (OVERDUE)'}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 text-xs">N/A</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 pr-6 text-right">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedComplaint(c);
                                                                        setActionData({ status: c.status, remarks: '', proofImage: '' });
                                                                    }}
                                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                                                                >
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>

                {/* ACTION MODAL */}
                {selectedComplaint && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedComplaint(null)}></div>

                        {/* Modal Panel */}
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto w-animate-in slide-in-from-bottom-4 zoom-in-95">

                            <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    Update Ticket Status
                                    <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded">#{selectedComplaint._id.substring(selectedComplaint._id.length - 6).toUpperCase()}</span>
                                </h2>
                                <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-700 transition">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6">

                                {selectedComplaint.citizenATR && selectedComplaint.citizenATR.satisfied === false && (
                                    <div className="bg-red-50 p-4 border border-red-200 rounded-xl mb-6 shadow-sm">
                                        <h4 className="text-sm font-bold text-red-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                            <AlertTriangle className="w-4 h-4" /> Citizen Rejected Previous Action
                                        </h4>
                                        <p className="text-sm text-red-900 leading-relaxed mb-3">The citizen was not satisfied with the previous resolution, triggering an automatic SLA escalation to your level.</p>
                                        <div className="bg-white p-3 rounded-lg border border-red-100 italic text-sm text-slate-700 font-medium whitespace-pre-wrap">
                                            "{selectedComplaint.citizenATR.comments || 'No written comments provided.'}"
                                        </div>
                                    </div>
                                )}

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                                    <h3 className="font-bold text-slate-900 mb-1">{selectedComplaint.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{selectedComplaint.description}</p>

                                    {selectedComplaint.issueImage && (
                                        <div className="mb-4">
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Attached Evidence</h4>
                                            <div 
                                                onClick={() => setViewImageUrl(`http://localhost:5000${selectedComplaint.issueImage}`)}
                                                className="group relative h-40 w-full overflow-hidden rounded-xl border border-slate-200 cursor-zoom-in"
                                            >
                                                <img 
                                                    src={`http://localhost:5000${selectedComplaint.issueImage}`} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                    alt="Issue Evidence" 
                                                />
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                                                    <Search className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 drop-shadow-lg" />
                                                </div>
                                                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest">Citizen Report</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-slate-200">
                                        <div><span className="text-slate-500">Citizen:</span> <strong>{selectedComplaint.citizen?.name || 'Loading...'}</strong></div>
                                        <div><span className="text-slate-500">Mobile:</span> {selectedComplaint.citizen?.mobile || 'Hidden'}</div>
                                        <div><span className="text-slate-500">Address:</span> {selectedComplaint.addressLine}, {selectedComplaint.village}, {selectedComplaint.block}, {selectedComplaint.district}</div>
                                        {selectedComplaint.latitude && <div><span className="text-slate-500">GPS Coords:</span> <a href={`https://maps.google.com/?q=${selectedComplaint.latitude},${selectedComplaint.longitude}`} target="_blank" className="text-blue-600 underline">[{selectedComplaint.latitude}, {selectedComplaint.longitude}]</a></div>}
                                    </div>

                                    {selectedComplaint.latitude && selectedComplaint.longitude && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Live Incident Location</h4>
                                            <MapDisplay latitude={selectedComplaint.latitude} longitude={selectedComplaint.longitude} height="250px" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Change Status</label>
                                        <select
                                            value={actionData.status}
                                            onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
                                            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm outline-none bg-slate-50"
                                        >
                                            <option value={selectedComplaint.status} disabled>Current: {selectedComplaint.status}</option>
                                            {selectedComplaint.status === 'Pending Assignment' && <option value="In Progress">Accept & Mark In Progress</option>}
                                            {selectedComplaint.status !== 'Resolved' && selectedComplaint.status !== 'Closed Permanently' && <option value="Resolved">Mark as Resolved</option>}
                                        </select>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-slate-700">Official Remarks</label>
                                            <button
                                                onClick={handleGenerateAI}
                                                disabled={generatingAI}
                                                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-200"
                                            >
                                                {generatingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>✨</span>}
                                                {generatingAI ? 'Generating...' : 'Auto-Draft Response'}
                                            </button>
                                        </div>
                                        <textarea
                                            required
                                            rows={4}
                                            value={actionData.remarks}
                                            onChange={(e) => setActionData({ ...actionData, remarks: e.target.value })}
                                            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm outline-none bg-slate-50"
                                            placeholder="Detail the actions taken to address this grievance..."
                                        ></textarea>
                                    </div>                                    {actionData.status === 'Resolved' && (
                                        <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-2xl shadow-sm">
                                            <label className="block text-sm font-black text-yellow-800 mb-2 uppercase tracking-widest flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" /> Resolution Evidence
                                            </label>
                                            <p className="text-[11px] text-yellow-700 mb-4 font-medium leading-relaxed leading-snug">To close the feedback loop, provide high-fidelity visual proof of the completed work. The citizen will verify this evidence before final closure.</p>

                                            <div className="flex items-center gap-4">
                                                <button 
                                                    type="button" 
                                                    onClick={() => document.getElementById('proof-upload')?.click()}
                                                    disabled={uploadingProof}
                                                    className="flex items-center gap-3 bg-white hover:bg-yellow-100 text-yellow-900 px-5 py-3 rounded-xl border border-yellow-300 font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_4px_10px_-4px_rgba(234,179,8,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                                >
                                                    {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                                    {uploadingProof ? 'Transmitting...' : 'Upload Visual Proof'}
                                                </button>
                                                <input
                                                    id="proof-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={handleProofUpload}
                                                    disabled={uploadingProof}
                                                />

                                                {actionData.proofImage && (
                                                    <div className="relative h-14 w-14 rounded-xl overflow-hidden border-2 border-green-500 shadow-lg group">
                                                        <img src={`http://localhost:5000${actionData.proofImage}`} alt="Proof" className="object-cover w-full h-full scale-110 group-hover:scale-125 transition-transform duration-500" />
                                                        <div className="absolute inset-0 bg-green-500/20"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    </div>
                                </div>

                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0">
                                <button
                                    onClick={() => setSelectedComplaint(null)}
                                    className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={actionLoading}
                                    onClick={submitAction}
                                    className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                                >
                                    {actionLoading ? 'Updating...' : 'Save & Update Workflow'}
                                </button>
                            </div>

                        </div>
                    </div>
                )}

                {/* Mobile Bottom Navigation - Official */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex justify-around items-center h-16 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-blue-600 font-bold">
                        <Briefcase className="w-5 h-5" />
                        <span className="text-[10px]">Inbox</span>
                    </button>
                    <button onClick={handleLogout} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-red-500 font-bold transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="text-[10px]">Logout</span>
                    </button>
                </div>
            </main>
            {/* LIGHTBOX OVERLAY */}
            {viewImageUrl && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4 md:p-10 cursor-zoom-out"
                    onClick={() => setViewImageUrl(null)}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative max-w-5xl w-full h-full flex items-center justify-center p-4"
                    >
                        <img 
                            src={viewImageUrl} 
                            className="max-w-full max-h-full object-contain rounded-[24px] shadow-2xl border border-white/10" 
                            alt="Full Screen Evidence" 
                        />
                        <button 
                            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors bg-white/10 p-4 rounded-full backdrop-blur-md"
                            onClick={() => setViewImageUrl(null)}
                        >
                            <XCircle className="w-8 h-8" />
                        </button>
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-lg px-8 py-4 rounded-full border border-white/10 flex items-center gap-4 text-white/80">
                            <ImageIcon className="w-5 h-5 text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Site Evidence Viewport</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
