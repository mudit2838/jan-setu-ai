'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter as useNextRouter } from 'next/navigation';
import { 
    LayoutDashboard, 
    FileText, 
    Map, 
    Users, 
    User as UserIcon, 
    BarChart3, 
    LogOut, 
    Plus, 
    Download, 
    Search,
    AlertCircle,
    Bell,
    MapPin,
    Clock,
    Info,
    History as HistoryIcon,
    Navigation,
    XCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for Map to avoid SSR issues with Leaflet
const JanSetuMap = dynamic(() => import('@/components/dashboard/JanSetuMap'), { 
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-slate-50 animate-pulse rounded-xl" />
});
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import MetricCard from '@/components/dashboard/MetricCard';
import DeptLoadChart from '@/components/dashboard/DeptLoadChart';
import WeeklyChart from '@/components/dashboard/WeeklyChart';
import { ComplaintMapData } from '@/components/dashboard/JanSetuMap';
import API_ROUTES from '@/lib/apiConfig';

interface UserData {
    name: string;
    role: string;
    district?: string;
}

interface AnalyticsData {
    metrics: {
        total: number;
        pending: number;
        dailyDelta: number;
        citizenSatisfaction: number;
    };
}

interface DistrictStat {
    name: string;
    total: number;
    resolved: number;
    pending: number;
    successRate: number;
}

interface Citizen {
    _id: string;
    name: string;
    mobile: string;
    village: string;
    block: string;
}

interface Official {
    _id: string;
    name: string;
    role: string;
    department: string;
    district: string;
    block?: string;
}

interface Escalation {
    toLevel: string;
    escalatedAt: string;
    reason: string;
}

interface Notification {
    id: string;
    type: 'new' | 'update' | 'escalation';
    title: string;
    message: string;
    time: Date;
    isRead: boolean;
    complaintId: string;
}

export default function EnhancedOfficialDashboard() {
    const router = useNextRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');

    // Data State
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [recentComplaints, setRecentComplaints] = useState<ComplaintMapData[]>([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [deptLoad, setDeptLoad] = useState([]);
    
    // UI Logic State
    const [selectedComplaint, setSelectedComplaint] = useState<ComplaintMapData | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [fullComplaints, setFullComplaints] = useState<ComplaintMapData[]>([]);
    const [citizens, setCitizens] = useState<Citizen[]>([]);
    const [officials, setOfficials] = useState<Official[]>([]);
    const [districtStats, setDistrictStats] = useState<DistrictStat[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [actionForm, setActionForm] = useState({
        status: '',
        remarks: '',
        proofImage: '',
        aiDraft: ''
    });
    const [aiLoading, setAiLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [lastSync, setLastSync] = useState(new Date());
    const [modalTab, setModalTab] = useState('detail'); // 'detail' or 'history'
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);

    // Helper to get full image URL
    const getFullImageUrl = (url?: string) => {
        if (!url) return '';
        return API_ROUTES.UPLOADS(url);
    };
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userDataStr = localStorage.getItem('user');
        
        if (!token || !userDataStr) {
            router.push('/login');
            return;
        }

        const userData = JSON.parse(userDataStr);
        setUser(userData);
        fetchAllData(token);

        // --- Real-time SSE Connection ---
        const eventSource = new EventSource(`${API_ROUTES.EVENT_STREAM}?token=${token}`);

        eventSource.addEventListener('NEW_COMPLAINT', (e) => {
            const data = JSON.parse(e.data);
            const isRelevant = !userData.district || data.district === userData.district;
            if (isRelevant) {
                const newNotif: Notification = {
                    id: Date.now().toString(),
                    type: 'new',
                    title: 'New Grievance Registered',
                    message: data.title,
                    time: new Date(),
                    isRead: false,
                    complaintId: data._id
                };
                setNotifications(prev => [newNotif, ...prev].slice(0, 20));

                toast(`🆕 New Grievance: ${data.title}`, { 
                    icon: '📋',
                    duration: 6000,
                    position: 'top-right',
                    style: { 
                        borderRadius: '16px', 
                        background: '#1e293b', 
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: '600'
                    }
                });
                fetchAllData(token);
            }
        });

        eventSource.addEventListener('STATUS_UPDATE', (e) => {
            const data = JSON.parse(e.data);
            const isRelevant = !userData.district || data.district === userData.district;
            if (isRelevant) {
                const newNotif: Notification = {
                    id: Date.now().toString(),
                    type: 'update',
                    title: 'Grievance Status Updated',
                    message: `Ticket #${data.shortId} is now ${data.status}`,
                    time: new Date(),
                    isRead: false,
                    complaintId: data.complaintId || data._id
                };
                setNotifications(prev => [newNotif, ...prev].slice(0, 20));

                toast(`🔄 Ticket #${data.shortId} updated: ${data.status}`, { 
                    icon: '✅',
                    position: 'top-right'
                });
                fetchAllData(token);
            }
        });

        eventSource.addEventListener('ESCALATION', (e) => {
            const data = JSON.parse(e.data);
            const isRelevant = !userData.district || data.district === userData.district;
            if (isRelevant) {
                const newNotif: Notification = {
                    id: Date.now().toString(),
                    type: 'escalation',
                    title: 'CRITICAL: SLA Breach Escalation',
                    message: `Ticket #${data.shortId} moved to ${data.newLevel}`,
                    time: new Date(),
                    isRead: false,
                    complaintId: data.complaintId || data._id
                };
                setNotifications(prev => [newNotif, ...prev].slice(0, 20));

                toast.error(`⚠️ Ticket #${data.shortId} ESCALATED to ${data.newLevel}!`, { 
                    duration: 8000,
                    position: 'top-right'
                });
                fetchAllData(token);
            }
        });

        return () => {
            eventSource.close();
        };
    }, []);

    const fetchAllData = async (token: string) => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };

            const [
                analyticsRes,
                recentRes,
                weeklyRes,
                deptRes,
                escRes,
                fullRes
            ] = await Promise.all([
                axios.get(API_ROUTES.ANALYTICS, { headers }),
                axios.get(`${API_ROUTES.RECENT}?limit=3`, { headers }),
                axios.get(API_ROUTES.WEEKLY, { headers }),
                axios.get(API_ROUTES.DEPT_LOAD, { headers }),
                axios.get(API_ROUTES.ESCALATIONS, { headers }),
                axios.get(API_ROUTES.ADMIN_LIST, { headers })
            ]);

            setAnalytics(analyticsRes.data);
            setRecentComplaints(recentRes.data);
            setWeeklyData(weeklyRes.data);
            setDeptLoad(deptRes.data);
            setFullComplaints(fullRes.data);

            // Conditional Admin/List Fetches
            const [citRes, offRes, distRes] = await Promise.all([
                axios.get(API_ROUTES.CITIZENS, { headers }),
                axios.get(API_ROUTES.OFFICIALS, { headers }),
                axios.get(`${API_ROUTES.HEATMAP}/stats`, { headers })
            ]);
            setCitizens(citRes.data);
            setOfficials(offRes.data);
            setDistrictStats(distRes.data);

            setLastSync(new Date());
        } catch (error: unknown) {
            console.error('Dashboard data fetch failed', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
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

    const handleOpenAction = (complaint: ComplaintMapData) => {
        setSelectedComplaint(complaint);
        setModalTab('detail');
        setActionForm({
            status: complaint.status,
            remarks: '',
            proofImage: '',
            aiDraft: ''
        });
        setIsActionModalOpen(true);
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Title", "Department", "Priority", "Status", "District", "Block"];
        const rows = fullComplaints.map((c) => [
            c._id, 
            c.title, 
            c.department, 
            c.priority, 
            c.status, 
            c.district as string, 
            c.block as string
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `JanSetu_Grievances_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        toast.success('Grievance Report Exported');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(API_ROUTES.UPLOAD, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            setActionForm({ ...actionForm, proofImage: data.url });
            toast.success('Resolution proof uploaded!');
        } catch (error) {
            toast.error('Image upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!selectedComplaint) return;
        setAiLoading(true);
        try {
            // Call local AI service
            const { data } = await axios.post(API_ROUTES.GENERATE_RESPONSE, {
                department: selectedComplaint.department,
                priority: selectedComplaint.priority,
                issue: selectedComplaint.description
            });
            setActionForm({ ...actionForm, aiDraft: data.draft });
            toast.success('AI Draft Generated');
        } catch (error) {
            // Fallback for demo
            const fallbackDraft = `Regarding Complaint #${selectedComplaint._id.slice(-6)}: We have coordinated with the ${selectedComplaint.department} team to address this issue. Our technicians are scheduled for field verification. Please rest assured that regular updates will follow.`;
            setActionForm({ ...actionForm, aiDraft: fallbackDraft });
            toast.success('Draft Generated (Fallback)');
        } finally {
            setAiLoading(false);
        }
    };

    const handleActionSubmit = async () => {
        if (!selectedComplaint) return;
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            await axios.put(`${API_ROUTES.COMPLAINTS}/${selectedComplaint._id}/status`, {
                status: actionForm.status,
                remarks: actionForm.remarks + (actionForm.aiDraft ? `\n\nAI Draft: ${actionForm.aiDraft}` : ''),
                proofImage: actionForm.proofImage
            }, { headers });

            toast.success('Complaint status updated!');
            setIsActionModalOpen(false);
            fetchAllData(token || ''); // Refresh
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to update status');
            } else {
                toast.error('Failed to update status');
            }
        }
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleClearNotifications = () => {
        setNotifications([]);
        setIsNotificationOpen(false);
    };

    const handleNotificationClick = (notif: Notification) => {
        // Find the complaint in our data
        const complaint = fullComplaints.find(c => c._id === notif.complaintId) || 
                          recentComplaints.find(c => c._id === notif.complaintId);
        
        if (complaint) {
            handleOpenAction(complaint);
        }
        
        // Mark as read
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        setIsNotificationOpen(false);
    };

    const filteredComplaints = fullComplaints.filter((c) => 
        (filterStatus === 'All' || c.status === filterStatus) &&
        (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
         c._id.includes(searchQuery) ||
         (typeof c.department === 'string' && c.department.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    if (!user) return null;

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, badge: 0 },
        { name: 'Complaints', icon: FileText, badge: analytics?.metrics?.pending || 0 },
        { name: 'Districts', icon: Map, badge: 0 },
        { name: 'Officers', icon: Users, badge: 0 },
        { name: 'Citizens', icon: UserIcon, badge: 0 },
        { name: 'Reports', icon: BarChart3, badge: 0 },
    ];

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#E1F5EE] selection:text-[#0F6E56]">
            
            {/* LEFT SIDEBAR (220px) */}
            <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-white border-r-[0.5px] border-slate-200 flex flex-col z-30">
                <div className="p-6 mb-4">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2.5 cursor-pointer"
                    >
                        <div className="w-8 h-8 bg-[#1D9E75] rounded-lg border-[0.5px] border-emerald-600 flex items-center justify-center text-white font-bold tracking-tighter shadow-lg shadow-emerald-500/20">
                            JS
                        </div>
                        <span className="font-bold tracking-tight text-slate-900 text-lg">Bharat JanSetu AI</span>
                    </motion.div>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setActiveTab(item.name)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                                activeTab === item.name 
                                ? 'bg-[#E1F5EE] text-[#0F6E56]' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-4 h-4 ${activeTab === item.name ? 'text-[#1D9E75]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                <span className={`text-[13px] font-medium tracking-tight ${activeTab === item.name ? 'font-semibold' : ''}`}>
                                    {item.name}
                                </span>
                            </div>
                            {item.badge > 0 && (
                                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md border-[0.5px] border-emerald-100 shadow-sm font-bold text-[#1D9E75]">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Sidebar Footer: Officer Info */}
                <div className="p-4 border-t-[0.5px] border-slate-200">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 border-[0.5px] border-slate-100">
                        <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center border-[0.5px] border-slate-300">
                            <UserIcon className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[12px] font-semibold text-slate-900 truncate">{user.name}</p>
                            <p className="text-[10px] font-medium text-slate-500 truncate capitalize">
                                District Officer · {user.district || 'State'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full mt-3 flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="ml-[220px] flex-1 flex flex-col min-h-screen relative">
                
                {/* TOP BAR */}
                <header className="sticky top-0 h-16 bg-white/80 backdrop-blur-md border-b-[0.5px] border-slate-200 flex items-center justify-between px-8 z-20">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <h2 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <LayoutDashboard className="w-4 h-4 text-[#1D9E75]" /> Official Command Center
                            </h2>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                {user.district || 'State Level'} / <span className="text-[#1D9E75] font-bold">{activeTab}</span>
                            </p>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-100 mx-2" />
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border-[0.5px] border-emerald-100 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse"></div>
                            <span className="text-[10px] font-bold text-[#0F6E56] uppercase tracking-wider italic">
                                Live: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={`p-2 rounded-full transition-all relative ${isNotificationOpen ? 'bg-emerald-50 text-[#1D9E75]' : 'text-slate-400 hover:text-slate-900'}`}
                            >
                                <Bell className="w-5 h-5" />
                                {notifications.some(n => !n.isRead) && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#D85A30] border-2 border-white rounded-full animate-pulse"></span>
                                )}
                            </button>

                            <AnimatePresence>
                                {isNotificationOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border-[0.5px] border-slate-200 overflow-hidden z-50 origin-top-right"
                                    >
                                        <div className="p-4 border-b-[0.5px] border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Notifications</h4>
                                            <div className="flex gap-2">
                                                <button onClick={handleMarkAllRead} className="text-[9px] font-bold text-[#1D9E75] hover:underline uppercase">Mark Read</button>
                                                <button onClick={handleClearNotifications} className="text-[9px] font-bold text-slate-400 hover:text-red-500 uppercase">Clear</button>
                                            </div>
                                        </div>

                                        <div className="max-h-[350px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-10 text-center">
                                                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                                    <p className="text-[11px] text-slate-400 font-medium">No alerts in the current stream</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y-[0.5px] divide-slate-100">
                                                    {notifications.map((n) => (
                                                        <div 
                                                            key={n.id} 
                                                            onClick={() => handleNotificationClick(n)}
                                                            className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${!n.isRead ? 'bg-emerald-50/20' : ''}`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                                n.type === 'escalation' ? 'bg-red-50 text-red-600' :
                                                                n.type === 'update' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                                            }`}>
                                                                {n.type === 'escalation' ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <h5 className="text-[12px] font-bold text-slate-900 truncate">{n.title}</h5>
                                                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                                                                <p className="text-[9px] text-slate-400 font-medium mt-1">{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button 
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-[12px] font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export District Data
                        </button>
                    </div>
                </header>

                {/* CONTENT GRID */}
                <div className="p-8 pb-20 space-y-8 animate-in fade-in duration-500">
                    
                    {(() => {
                        switch (activeTab) {
                            case 'Dashboard':
                                return (
                                    <>
                                        {/* GIS & METRIC ROW */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="lg:col-span-2">
                                                <h3 className="text-sm font-semibold text-slate-900 tracking-tight uppercase mb-4 flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-[#1D9E75]" /> Territory GIS Command
                                                </h3>
                                                <JanSetuMap 
                                                    complaints={filteredComplaints} 
                                                    onMarkerClick={handleOpenAction} 
                                                />
                                            </div>
                                            <div className="space-y-6">
                                                <MetricCard 
                                                    title="Total Complaints" 
                                                    value={analytics?.metrics?.total || 0} 
                                                    delta={{ value: 12, isGood: true, label: "from last week" }}
                                                    loading={loading}
                                                    color="#378ADD"
                                                />
                                                <MetricCard 
                                                    title="Pending" 
                                                    value={analytics?.metrics?.pending || 0} 
                                                    delta={{ 
                                                        value: Math.abs(analytics?.metrics?.dailyDelta || 0), 
                                                        isGood: (analytics?.metrics?.dailyDelta || 0) <= 0, 
                                                        label: (analytics?.metrics?.dailyDelta || 0) > 0 ? "increasing today" : "decreasing today" 
                                                    }}
                                                    loading={loading}
                                                    color="#BA7517"
                                                />
                                                <MetricCard 
                                                    title="Citizen Satisfaction" 
                                                    value={`${analytics?.metrics?.citizenSatisfaction || 0}%`} 
                                                    delta={{ value: 5, isGood: true, label: "improving trend" }}
                                                    loading={loading}
                                                    color="#D85A30"
                                                />
                                            </div>
                                        </div>

                                        {/* TWO-COLUMN SECTION */}
                                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                            <div className="lg:col-span-3 bg-white border-[0.5px] border-slate-200 rounded-[12px] p-6 shadow-sm">
                                                <h3 className="text-sm font-semibold text-slate-900 tracking-tight uppercase mb-8">Department Resource Load</h3>
                                                <DeptLoadChart data={deptLoad} loading={loading} />
                                            </div>
                                            <div className="lg:col-span-2 bg-white border-[0.5px] border-slate-200 rounded-[12px] p-6 shadow-sm">
                                                <h3 className="text-sm font-semibold text-slate-900 tracking-tight uppercase mb-6">Real-time Stream</h3>
                                                <div className="space-y-4">
                                                    {recentComplaints.map((c) => (
                                                        <div key={c._id} onClick={() => handleOpenAction(c)} className="p-4 bg-slate-50/50 border-[0.5px] border-slate-100 rounded-xl hover:border-slate-300 transition-all cursor-pointer group">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="text-[13px] font-medium text-slate-900 truncate">{c.title}</h4>
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${c.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                    {c.priority}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-3 text-slate-400">
                                                                <span className="text-[11px]">{c.block || 'Local'}</span>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border-[0.5px] bg-blue-50 text-[#378ADD]">{c.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            case 'Complaints':
                                return (
                                    <div className="bg-white border-[0.5px] border-slate-200 rounded-[12px] overflow-hidden shadow-sm">
                                        <div className="p-6 bg-slate-50/50 flex items-center justify-between gap-4 border-b-[0.5px] border-slate-100">
                                            <div className="relative flex-1 max-w-md">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input type="text" placeholder="Filter grievances..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border-[0.5px] border-slate-200 rounded-lg text-sm bg-white" />
                                            </div>
                                            <div className="flex gap-2">
                                                {['All', 'Pending', 'Resolved'].map(s => (
                                                    <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-1.5 rounded-md text-[11px] font-bold border-[0.5px] ${filterStatus === s ? 'bg-[#1D9E75] text-white' : 'bg-white text-slate-500'}`}>{s}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b-[0.5px] border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase">ID</th>
                                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase">Subject</th>
                                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase">Dept</th>
                                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase">Status</th>
                                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase">Level</th>
                                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase">Evidence</th>
                                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y-[0.5px] divide-slate-100">
                                                    {filteredComplaints.map((c) => (
                                                        <tr key={c._id} className={`hover:bg-slate-50 transition-colors ${c.isActionable ? 'bg-emerald-50/20' : ''}`}>
                                                            <td className="px-6 py-4 text-[12px] font-bold">
                                                                <div className="flex items-center gap-2">
                                                                    {c.isActionable && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                                    #{c._id.slice(-6).toUpperCase()}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-[13px] font-medium">{c.title}</td>
                                                            <td className="px-6 py-4 text-[12px]">{c.department}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border-[0.5px] bg-[#E1F5EE] text-[#0F6E56]">{c.status}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border-[0.5px] ${
                                                                    c.assignedToLevel === 'State' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                                    c.assignedToLevel === 'District' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                                }`}>
                                                                    {c.assignedToLevel}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {c.issueImage ? (
                                                                    <div 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setViewImageUrl(getFullImageUrl(c.issueImage!));
                                                                        }}
                                                                        className="flex items-center gap-2 cursor-pointer group/img"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 group-hover/img:border-[#1D9E75] transition-all">
                                                                            <img src={getFullImageUrl(c.issueImage!)} alt="Evidence" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-tight group-hover/img:underline">View Image</span>
                                                                            <span className="text-[8px] text-slate-400 font-medium">Click to expand</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-slate-300 uppercase italic">No Media</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button 
                                                                    onClick={() => handleOpenAction(c)} 
                                                                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                                                                        c.isActionable 
                                                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                                    }`}
                                                                >
                                                                    {c.isActionable ? 'Review & Action' : 'Monitor Details'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            case 'Districts':
                                return (
                                    <div className="bg-white border-[0.5px] border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase">Jurisdictional Pressure Index</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                                            {districtStats.map((stat) => (
                                                <div key={stat.name} className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-[#1D9E75] transition-all group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h4 className="text-[15px] font-bold text-slate-900">{stat.name}</h4>
                                                        <span className="text-[10px] font-bold text-[#1D9E75] bg-[#E1F5EE] px-2 py-1 rounded-lg">{stat.successRate}% Resolved</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="text-slate-400 font-bold uppercase">Total Traffic</span>
                                                            <span className="text-slate-900 font-bold">{stat.total}</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-[#1D9E75]" style={{ width: `${stat.successRate}%` }}></div>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="text-emerald-600 font-bold">Resolved: {stat.resolved}</span>
                                                            <span className="text-amber-600 font-bold">Pending: {stat.pending}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            case 'Officers':
                                return (
                                    <div className="bg-white border-[0.5px] border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="p-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase">Official Command Directory</h3>
                                            <button className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-xs font-bold">
                                                <Plus className="w-4 h-4" /> Add Official
                                            </button>
                                        </div>
                                        <div className="p-0 overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-8 py-5">Officer Name</th>
                                                        <th className="px-8 py-5">Designation / Role</th>
                                                        <th className="px-8 py-5">Department</th>
                                                        <th className="px-8 py-5">Jurisdiction</th>
                                                        <th className="px-8 py-5 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {officials.map((off) => (
                                                        <tr key={off._id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-8 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                                                                        {off.name[0]}
                                                                    </div>
                                                                    <span className="text-sm font-bold text-slate-900">{off.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-4">
                                                                <span className="text-[11px] font-bold text-[#1D9E75] bg-[#E1F5EE] px-2 py-1 rounded-full uppercase italic">
                                                                    {off.role.split('_')[1]} Official
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-4 text-[12px] font-medium text-slate-600">{off.department}</td>
                                                            <td className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase">{off.district} {off.block ? `/ ${off.block}` : ''}</td>
                                                            <td className="px-8 py-4 text-right">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            case 'Citizens':
                                return (
                                    <div className="bg-white border-[0.5px] border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase">Resident Engagement Ledger</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                                            {citizens.map((cit) => (
                                                <div key={cit._id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 text-lg font-bold text-[#1D9E75]">
                                                        {cit.name[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900">{cit.name}</h4>
                                                        <p className="text-[11px] text-slate-500 font-medium">{cit.mobile}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{cit.village}, {cit.block}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                             case 'Reports':
                                return (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-white border-[0.5px] border-slate-200 rounded-xl p-8 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase mb-8">Resolution Compliance Audit</h3>
                                            <WeeklyChart data={weeklyData} loading={loading} />
                                        </div>
                                        <div className="bg-white border-[0.5px] border-slate-200 rounded-xl p-8 shadow-sm flex flex-col justify-center items-center text-center">
                                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-[#1D9E75] mb-6">
                                                <BarChart3 className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">Generate Performance Audit</h3>
                                            <p className="text-sm text-slate-500 max-w-sm mb-8">Download a comprehensive PDF audit of department performance, citizen feedback trends, and SLA compliance data for your jurisdiction.</p>
                                            <button onClick={handleExportCSV} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xl active:scale-95 transition-all">
                                                <Download className="w-5 h-5" /> Export Data Assets (.CSV)
                                            </button>
                                        </div>
                                    </div>
                                );
                            default:
                                return <div className="py-20 text-center text-slate-400 italic">This module is being synchronized with the agency stream...</div>;
                        }
                    })()}

                </div>

                {/* --- ACTION MODAL --- */}
                <AnimatePresence>
                    {isActionModalOpen && selectedComplaint && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                onClick={() => setIsActionModalOpen(false)}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border-[0.5px] border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                {/* Modal Header */}
                                <div className="p-6 border-b-[0.5px] border-slate-100 bg-[#E1F5EE]/30 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="bg-[#1D9E75] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                Grievance Detail
                                            </span>
                                            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">#{selectedComplaint._id.slice(-6).toUpperCase()}</h3>
                                        </div>
                                        <p className="text-[12px] text-slate-500 font-medium">Assigned to {selectedComplaint.department} department</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsActionModalOpen(false)}
                                        className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900"
                                    >
                                        <Plus className="w-5 h-5 rotate-45" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2">
                                    {/* Left: Complaint Details */}
                                    <div className="p-8 border-r-[0.5px] border-slate-100 space-y-6">
                                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit mb-6">
                                            <button 
                                                onClick={() => setModalTab('detail')}
                                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${modalTab === 'detail' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <Info className="w-3.5 h-3.5" /> Incident Details
                                            </button>
                                            <button 
                                                onClick={() => setModalTab('history')}
                                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${modalTab === 'history' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <HistoryIcon className="w-3.5 h-3.5" /> Audit Trail
                                            </button>
                                        </div>

                                        {modalTab === 'detail' ? (
                                            <>
                                                {(() => {
                                                    const roleLevelMap: Record<string, string> = {
                                                        'official_block': 'Local',
                                                        'official_district': 'District',
                                                        'official_state': 'State'
                                                    };
                                                    
                                                    // Force actionable if role matches assigned level (Frontend fallback)
                                                    if (!selectedComplaint.isActionable && 
                                                        (user.role === 'admin' || user.role === 'official_super' || roleLevelMap[user.role] === selectedComplaint.assignedToLevel)) {
                                                        selectedComplaint.isActionable = true;
                                                    }

                                                    if (!selectedComplaint.isActionable) {
                                                        return (
                                                            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 items-start animate-in fade-in slide-in-from-top-4 duration-500">
                                                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <h4 className="text-[12px] font-bold text-amber-900 leading-tight">Monitoring Mode Only</h4>
                                                                    <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                                                                        This grievance is currently under **{selectedComplaint.assignedToLevel} Jurisdiction**. 
                                                                        As a {user?.role.split('_')[1]} official, you can monitor the details, but direct action is reserved for officers at that level unless it is escalated to you.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}

                                                <div>
                                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Citizen Context</h4>
                                                    <div className="bg-slate-50 rounded-xl p-4 border-[0.5px] border-slate-100 items-center flex gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-white border-[0.5px] border-slate-200 flex items-center justify-center text-slate-400 font-bold uppercase overflow-hidden">
                                                            {selectedComplaint.citizen?.name?.[0] || 'C'}
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-bold text-slate-900">{selectedComplaint.citizen?.name || 'Anonymous'}</p>
                                                            <p className="text-[11px] font-medium text-slate-500">{selectedComplaint.citizen?.mobile || 'No Contact Info'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Subject Issue</h4>
                                                    <h3 className="text-[16px] font-bold text-slate-900 mb-2 leading-tight">{selectedComplaint.title}</h3>
                                                    <div className="bg-slate-50 rounded-xl p-5 border-[0.5px] border-slate-100">
                                                        <p className="text-[13px] text-slate-600 leading-relaxed font-medium italic">
                                                            &quot;{selectedComplaint.description}&quot;
                                                        </p>
                                                    </div>
                                                </div>

                                                {selectedComplaint.issueImage && (
                                                    <div>
                                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Evidence Photographed by Citizen</h4>
                                                        <div 
                                                            onClick={() => setViewImageUrl(getFullImageUrl(selectedComplaint.issueImage!))}
                                                            className="relative group rounded-2xl overflow-hidden border border-slate-200 cursor-zoom-in bg-slate-100 aspect-video"
                                                        >
                                                            <img 
                                                                src={getFullImageUrl(selectedComplaint.issueImage!)} 
                                                                alt="Evidence" 
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                            />
                                                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all flex items-center justify-center">
                                                                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all shadow-xl font-bold text-[10px] uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                                                    <Search className="w-3.5 h-3.5" /> Enlarge Asset
                                                                </div>
                                                            </div>
                                                            <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur px-2.5 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-tighter">
                                                                Original Capture
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-emerald-50/50 rounded-xl border-[0.5px] border-emerald-100">
                                                        <h4 className="text-[9px] font-bold text-[#1D9E75] uppercase mb-1">Precise Location</h4>
                                                        <p className="text-[12px] font-bold text-[#0F6E56]">{selectedComplaint.village || 'N/A'}, {selectedComplaint.block}</p>
                                                    </div>
                                                    <div className="p-4 bg-orange-50/50 rounded-xl border-[0.5px] border-orange-100">
                                                        <h4 className="text-[9px] font-bold text-[#D85A30] uppercase mb-1">Target Priority</h4>
                                                        <p className="text-[12px] font-bold text-[#BA7517]">{selectedComplaint.priority} Level Alert</p>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="space-y-6 py-4">
                                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Workflow Timeline</h4>
                                                <div className="relative pl-6 border-l-[0.5px] border-slate-200 space-y-8">
                                                    {/* Initial Report */}
                                                    <div className="relative">
                                                        <div className="absolute -left-[27px] top-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                                                        <div className="space-y-1">
                                                            <p className="text-[11px] font-bold text-slate-900">Grievance Registered</p>
                                                            <p className="text-[10px] text-slate-500">{new Date(selectedComplaint.createdAt!).toLocaleString()}</p>
                                                            <p className="text-[10px] font-medium text-slate-400 italic">&quot;Grievance submitted via JanSetu Web Portal&quot;</p>
                                                        </div>
                                                    </div>

                                                    {/* Escalation History */}
                                                    {(selectedComplaint.escalationHistory as Escalation[] | undefined)?.map((esc, idx: number) => (
                                                        <div key={idx} className="relative">
                                                            <div className="absolute -left-[27px] top-0 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" />
                                                            <div className="space-y-1">
                                                                <p className="text-[11px] font-bold text-slate-900">SLA Breach: Auto-Escalated to {esc.toLevel}</p>
                                                                <p className="text-[10px] text-slate-500">{new Date(esc.escalatedAt).toLocaleString()}</p>
                                                                <p className="text-[10px] font-medium text-red-600 bg-red-50 py-1 px-2 rounded w-fit">Reason: {esc.reason}</p>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Current Pending State */}
                                                    <div className="relative">
                                                        <div className="absolute -left-[27px] top-0 w-3 h-3 rounded-full bg-slate-300 border-2 border-white animate-pulse" />
                                                        <div className="space-y-1">
                                                            <p className="text-[11px] font-bold text-slate-900">Awaiting Official Resolution</p>
                                                            <p className="text-[10px] text-slate-400 italic">Assigned to: {selectedComplaint.department}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <Clock className="w-3 h-3 text-amber-500" />
                                                                <span className="text-[10px] font-bold text-amber-600 uppercase">SLA Breach in {Math.max(0, Math.floor((new Date(selectedComplaint.slaDueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} Days</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Officer Action Form */}
                                    <div className="p-8 bg-slate-50/30 space-y-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Action Execution</h4>
                                                {selectedComplaint.latitude && selectedComplaint.longitude && (
                                                    <a 
                                                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedComplaint.latitude},${selectedComplaint.longitude}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Navigation className="w-3.5 h-3.5" /> Dispatch Field Team
                                                    </a>
                                                )}
                                            </div>
                                            <button 
                                                onClick={handleGenerateAI}
                                                disabled={aiLoading || !selectedComplaint.isActionable}
                                                className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-[10px] font-bold rounded-full shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {aiLoading ? 'Thinking...' : '⚡ Smart AI Assistant'}
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">Official Response</label>
                                                <textarea 
                                                    rows={4}
                                                    placeholder="Explain the technical resolution or current status..."
                                                    value={actionForm.aiDraft || actionForm.remarks}
                                                    onChange={(e) => setActionForm({...actionForm, remarks: e.target.value, aiDraft: ''})}
                                                    className="w-full p-4 bg-white border-[0.5px] border-slate-200 rounded-xl text-[13px] font-medium outline-none focus:ring-1 focus:ring-[#1D9E75] transition-all resize-none shadow-sm"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">New Status</label>
                                                    <select 
                                                        value={actionForm.status}
                                                        disabled={!selectedComplaint.isActionable}
                                                        onChange={(e) => setActionForm({...actionForm, status: e.target.value})}
                                                        className="w-full p-3 bg-white border-[0.5px] border-slate-200 rounded-xl text-[12px] font-bold outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Resolved">Resolved</option>
                                                        <option value="Escalated - Pending Action">Escalate to Dist</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">Proof of Work</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="file" 
                                                            onChange={handleImageUpload}
                                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className="w-full p-3 bg-white border-[0.5px] border-slate-200 rounded-xl text-[12px] font-bold text-slate-500 flex items-center justify-center gap-2">
                                                            {uploading ? 'Uploading...' : actionForm.proofImage ? '✅ Attached' : '📎 Upload Image'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button 
                                                onClick={handleActionSubmit}
                                                disabled={!selectedComplaint.isActionable}
                                                className="w-full py-4 bg-slate-900 text-white text-[13px] font-bold rounded-xl shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400"
                                            >
                                                {selectedComplaint.isActionable ? 'Finalize & Commit Changes' : 'Action Locked (Out of Jurisdiction)'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

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
                    </motion.div>
                </div>
            )}
        </div>
    );
}
