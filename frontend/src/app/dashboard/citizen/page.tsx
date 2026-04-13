'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, PlusCircle, AlertCircle, LogOut, Navigation, CopyCheck, RefreshCw, Image as ImageIcon, Loader2, CheckCircle, Clock, AlertTriangle, Globe, Download, User, Mail, Phone, MapPin, Shield, Calendar, ShieldCheck, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import SkeletonCard from '@/components/SkeletonCard';

const MapDisplay = dynamic(() => import('@/components/MapDisplay'), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-slate-100 animate-pulse rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 text-sm font-medium">Loading Map Sandbox...</div>
});

export default function CitizenDashboard() {
    const router = useRouter();
    const { t, language, toggleLanguage } = useLanguage();
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'new' | 'feedback'
    const [accountSubTab, setAccountSubTab] = useState('profile'); // 'profile' | 'security' | 'activity'
    const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    // Complaint List State
    const [complaints, setComplaints] = useState([]);
    const [loadingList, setLoadingList] = useState(true);

    // Feedback State
    const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackData, setFeedbackData] = useState({
        satisfactionLevel: '',
        comments: ''
    });

    // New Complaint State
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [villages, setVillages] = useState([]);
    const [formLoading, setFormLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        district: '',
        block: '',
        village: '',
        latitude: '',
        longitude: '',
        issueImage: ''
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        // Retrieve auth
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            router.push('/login');
        } else {
            setUser(JSON.parse(userData));
            fetchComplaints();
            // Fetch initial districts for form
            axios.get('http://localhost:5000/api/users/locations/districts')
                .then(res => setDistricts(res.data)).catch(err => console.error(err));
        }
    }, []);

    const fetchComplaints = async () => {
        setLoadingList(true);
        try {
            const { data } = await axios.get('http://localhost:5000/api/complaints/my', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setComplaints(data);
        } catch (error: any) {
            console.error('Failed to fetch complaints');
            if (error.response?.status === 401) {
                localStorage.clear();
                router.push('/login');
            }
        } finally {
            setLoadingList(false);
        }
    };

    const downloadReceipt = async (id: string, trackingId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/complaints/${id}/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Grievance_Receipt_${trackingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Receipt downloaded successfully!');
        } catch (error) {
            console.error('Failed to download receipt', error);
            toast.error('Failed to generate PDF. Please try again later.');
        }
    };

    // GeoLocation Tool
    const captureLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        toast.loading('Requesting Location Access...', { id: 'gpsReq' });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toString(),
                    longitude: position.coords.longitude.toString()
                }));
                toast.success('GPS Location Captured Successfully!', { id: 'gpsReq' });
            },
            (error) => {
                console.error("GPS Error Code:", error.code, "Message:", error.message);
                let errorMessage = 'Unable to retrieve your location.';

                switch (error.code) {
                    case 1: // PERMISSION_DENIED
                        errorMessage = "Location request denied. Please allow location access in your browser settings to use this feature.";
                        break;
                    case 2: // POSITION_UNAVAILABLE
                        errorMessage = "Location information is unavailable right now.";
                        break;
                    case 3: // TIMEOUT
                        errorMessage = "The request to get user location timed out.";
                        break;
                }
                toast.error(errorMessage, { id: 'gpsReq', duration: 5000 });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Location Hierarchy Handlers
    const handleLocationChange = async (type: string, value: string) => {
        setFormData(prev => ({ ...prev, [type]: value }));

        if (type === 'district') {
            setFormData(prev => ({ ...prev, block: '', village: '' }));
            setBlocks([]); setVillages([]);
            if (value) {
                const res = await axios.get(`http://localhost:5000/api/users/locations/blocks/${value}`);
                setBlocks(res.data);
            }
        } else if (type === 'block') {
            setFormData(prev => ({ ...prev, village: '' }));
            setVillages([]);
            if (value) {
                const res = await axios.get(`http://localhost:5000/api/users/locations/villages/${formData.district}/${value}`);
                setVillages(res.data);
            }
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const submitGrievance = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            await axios.post('http://localhost:5000/api/complaints', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            toast.success('Grievance submitted successfully! AI has routed it to the designated official.');

            // Reset & reload
            setFormData({ title: '', description: '', district: '', block: '', village: '', latitude: '', longitude: '', issueImage: '' });
            setImagePreview(null);
            setTimeout(() => {
                setActiveTab('list');
                fetchComplaints();
            }, 2000);

        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit grievance');
        } finally {
            setFormLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const { data } = await axios.post('http://localhost:5000/api/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // data.url returns the path "/uploads/..."
            setFormData(prev => ({ ...prev, issueImage: data.url }));
            setImagePreview(URL.createObjectURL(file));
        } catch (error) {
            console.error('Image upload failed', error);
            toast.error('Failed to upload image. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    };

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
                    {t('brand')}
                </div>
                <div className="p-6">
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('citizen_panel')}</div>
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-xs text-orange-400 mt-1">{user.district} Citizen</div>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'list' ? 'bg-orange-600 text-white' : 'hover:bg-slate-800'}`}>
                        <LayoutDashboard className="w-5 h-5" /> {t('my_grievances')}
                    </button>
                    <button onClick={() => setActiveTab('new')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'new' ? 'bg-orange-600 text-white' : 'hover:bg-slate-800'}`}>
                        <PlusCircle className="w-5 h-5" /> {t('report_issue')}
                    </button>
                    <button onClick={() => setActiveTab('account')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'account' ? 'bg-orange-600 text-white' : 'hover:bg-slate-800'}`}>
                        <User className="w-5 h-5" /> My Account
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-800 space-y-2">
                    <button onClick={toggleLanguage} className="w-full flex items-center justify-between px-4 py-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5" /> {language === 'en' ? 'English' : 'हिंदी'}
                        </div>
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded">Aa</span>
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
                        <LogOut className="w-5 h-5" /> {t('log_out')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative pb-16 md:pb-0">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:hidden">
                    <div className="font-bold text-lg text-slate-900">Bharat JanSetu</div>
                    <button onClick={handleLogout} className="text-slate-500"><LogOut className="w-5 h-5" /></button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">

                    {/* LIST TAB */}
                    {activeTab === 'list' && (
                        <div className="max-w-5xl mx-auto">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900">{t('my_grievances')}</h1>
                                    <p className="text-slate-500 mt-1">{t('track_status')}</p>
                                </div>
                                <button onClick={fetchComplaints} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg border border-slate-200 shadow-sm"><RefreshCw className="w-5 h-5" /></button>
                            </div>

                            {loadingList ? (
                                <div className="grid gap-4">
                                    <SkeletonCard />
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </div>
                            ) : complaints.length === 0 ? (
                                <div className="bg-white border text-center border-slate-200 rounded-2xl p-12 shadow-sm">
                                    <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                    <h2 className="text-xl font-semibold text-slate-700">{t('no_grievances')}</h2>
                                    <p className="text-slate-500 mt-2 mb-6">You haven't reported any issues yet.</p>
                                    <button onClick={() => setActiveTab('new')} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                                        {t('report_now')}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {complaints.map((c: any) => (
                                        <div key={c._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${c.status === 'Resolved' || c.status === 'Closed Permanently' ? 'bg-green-100 text-green-700' :
                                                            c.status === 'Escalated - Pending Action' ? 'bg-red-100 text-red-700' :
                                                                c.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-1">Tracking ID: #{c._id.substring(c._id.length - 8).toUpperCase()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-slate-700">{new Date(c.createdAt).toLocaleDateString()}</div>
                                                    <div className="text-xs text-slate-400 mt-1">AI Assessed Priority: <span className={`font-semibold ${c.priority === 'High' ? 'text-red-500' : 'text-slate-600'}`}>{c.priority}</span></div>
                                                    <button onClick={() => downloadReceipt(c._id, c._id.substring(c._id.length - 8).toUpperCase())} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg border border-orange-200 transition-colors">
                                                        <Download className="w-3.5 h-3.5" /> Receipt
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <div className="flex-1"><strong>Dept:</strong> {c.department}</div>
                                                <div className="flex-1"><strong>Level:</strong> {c.assignedToLevel} Official</div>
                                                {c.slaDueDate && (
                                                    <div className="flex-1 text-right">
                                                        <strong>Deadline:</strong> {new Date(c.slaDueDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* INTERACTIVE TRACKING TIMELINE */}
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Live Tracking Timeline</h4>
                                                <div className="space-y-0">
                                                    {/* Step 1: Submission */}
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white"><CheckCircle className="w-3.5 h-3.5" /></div>
                                                            <div className="w-0.5 h-10 bg-green-200"></div>
                                                        </div>
                                                        <div className="pb-4">
                                                            <div className="text-sm font-bold text-slate-900">{t('submitted_ai')}</div>
                                                            <div className="text-xs text-slate-500">System routed to {c.department}</div>
                                                        </div>
                                                    </div>

                                                    {/* Step 2: Local Review */}
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${c.status === 'Resolved' || c.status === 'Closed Permanently' || c.assignedToLevel === 'District' || c.assignedToLevel === 'State' ? 'bg-green-500' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'}`}>
                                                                {(c.status === 'Resolved' || c.status === 'Closed Permanently' || c.assignedToLevel === 'District' || c.assignedToLevel === 'State') ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                            </div>
                                                            {(c.assignedToLevel === 'District' || c.assignedToLevel === 'State' || c.status === 'Resolved' || c.status === 'Closed Permanently') && <div className="w-0.5 h-10 bg-green-200"></div>}
                                                        </div>
                                                        <div className="pb-4">
                                                            <div className="text-sm font-bold text-slate-900">{t('local_review')}</div>
                                                            <div className="text-xs text-slate-500">
                                                                {(c.assignedToLevel === 'District' || c.assignedToLevel === 'State') ? 'Escalated to higher authority' : (c.status === 'Resolved' || c.status === 'Closed Permanently') ? 'Completed' : c.status}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Step 3: District Review (If Applicable) */}
                                                    {(c.assignedToLevel === 'District' || c.assignedToLevel === 'State' || (c.escalationHistory && c.escalationHistory.some((h: any) => h.toLevel === 'District'))) && (
                                                        <div className="flex gap-4">
                                                            <div className="flex flex-col items-center">
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${c.status === 'Resolved' || c.status === 'Closed Permanently' || c.assignedToLevel === 'State' ? 'bg-green-500' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'}`}>
                                                                    {(c.status === 'Resolved' || c.status === 'Closed Permanently' || c.assignedToLevel === 'State') ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                                </div>
                                                                {(c.assignedToLevel === 'State' || c.status === 'Resolved' || c.status === 'Closed Permanently') && <div className="w-0.5 h-10 bg-green-200"></div>}
                                                            </div>
                                                            <div className="pb-4">
                                                                <div className="text-sm font-bold text-slate-900">{t('district_review')}</div>
                                                                <div className="text-xs text-slate-500">{c.assignedToLevel === 'State' ? 'Escalated to State Level' : c.assignedToLevel === 'District' ? c.status : 'Completed'}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Step 4: State Review (If Applicable) */}
                                                    {(c.assignedToLevel === 'State' || (c.escalationHistory && c.escalationHistory.some((h: any) => h.toLevel === 'State'))) && (
                                                        <div className="flex gap-4">
                                                            <div className="flex flex-col items-center">
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${c.status === 'Resolved' || c.status === 'Closed Permanently' ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}>
                                                                    {(c.status === 'Resolved' || c.status === 'Closed Permanently') ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                                                </div>
                                                                {(c.status === 'Resolved' || c.status === 'Closed Permanently') && <div className="w-0.5 h-10 bg-green-200"></div>}
                                                            </div>
                                                            <div className="pb-4">
                                                                <div className="text-sm font-bold text-slate-900">{t('state_review')}</div>
                                                                <div className="text-xs text-red-600 font-medium">{c.status === 'Resolved' || c.status === 'Closed Permanently' ? 'Resolved successfully' : 'Mandatory Action Required'}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Step 5: Resolution */}
                                                    {(c.status === 'Resolved' || c.status === 'Closed Permanently' || c.status === 'State Re-Review Required') && (
                                                        <div className="flex gap-4">
                                                            <div className="flex flex-col items-center">
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${c.status === 'State Re-Review Required' ? 'bg-orange-500' : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]'}`}>
                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className={`text-sm font-bold ${c.status === 'State Re-Review Required' ? 'text-orange-700' : 'text-green-700'}`}>{c.status === 'State Re-Review Required' ? 'Resolution Rejected by Citizen' : t('issue_resolved')}</div>
                                                                <div className={`text-xs ${c.status === 'State Re-Review Required' ? 'text-orange-600' : 'text-green-600'}`}>{c.status === 'State Re-Review Required' ? 'Pending Re-evaluation' : t('pending_verification')}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                            {/* RESOLUTION GALLERY (BEFORE & AFTER) */}
                                            {(c.issueImage || c.proofImage) && (
                                                <div className="mt-4 pt-4 border-t border-slate-100">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <ImageIcon className="w-3.5 h-3.5" /> Resolution Evidence Gallery
                                                    </h4>
                                                    <div className="flex flex-wrap gap-4">
                                                        {c.issueImage && (
                                                            <div className="flex-1 min-w-[140px] max-w-[200px]">
                                                                <div className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Originally Reported</div>
                                                                <div 
                                                                    onClick={() => setViewImageUrl(`http://localhost:5000${c.issueImage}`)}
                                                                    className="relative group rounded-xl overflow-hidden border border-slate-200 cursor-zoom-in"
                                                                >
                                                                    <img src={`http://localhost:5000${c.issueImage}`} alt="Before" className="h-28 w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                                                                        <Search className="text-white opacity-0 group-hover:opacity-100 w-5 h-5" />
                                                                    </div>
                                                                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[8px] font-black text-slate-900 uppercase">Before</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {c.proofImage && (
                                                            <div className="flex-1 min-w-[140px] max-w-[200px]">
                                                                <div className="text-[10px] font-bold text-green-600 mb-1.5 uppercase">Official Resolution Proof</div>
                                                                <div 
                                                                    onClick={() => setViewImageUrl(`http://localhost:5000${c.proofImage}`)}
                                                                    className="relative group rounded-xl overflow-hidden border-2 border-green-200 shadow-sm shadow-green-100 cursor-zoom-in"
                                                                >
                                                                    <img src={`http://localhost:5000${c.proofImage}`} alt="After" className="h-28 w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                    <div className="absolute inset-0 bg-green-500/10 group-hover:bg-green-500/30 transition-colors flex items-center justify-center">
                                                                        <Search className="text-white opacity-0 group-hover:opacity-100 w-5 h-5" />
                                                                    </div>
                                                                    <div className="absolute bottom-2 left-2 bg-green-600/90 backdrop-blur px-2 py-0.5 rounded text-[8px] font-black text-white uppercase">After</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Feedback Trigger for Resolved state */}
                                            {(c.status === 'Resolved' || c.status === 'State Re-Review Required') && (
                                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                                                    <button
                                                        onClick={() => { setSelectedComplaint(c); setActiveTab('feedback'); }}
                                                        className="text-sm bg-green-50 hover:bg-green-100 text-green-700 font-semibold px-4 py-2 rounded-lg border border-green-200 transition-colors"
                                                    >
                                                        Review Resolution & Provide Feedback
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* NEW COMPLAINT TAB */}
                    {activeTab === 'new' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-slate-900">Report a Civic Issue</h1>
                                <p className="text-slate-500 mt-1">Our AI will automatically categorize and route your problem to the correct Department.</p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <form onSubmit={submitGrievance} className="p-6 md:p-8 space-y-6">

                                    <div className="space-y-4">
                                        <h3 className="text-sm border-b pb-2 font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500" /> Issue Details
                                        </h3>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Issue Title *</label>
                                            <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500 text-sm outline-none bg-slate-50 focus:bg-white transition-colors" placeholder="e.g. Broken Water Pipe overflowing on Main Street" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description *</label>
                                            <textarea required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500 text-sm outline-none bg-slate-50 focus:bg-white transition-colors" placeholder="Please describe the issue in detail, including landmarks or duration..."></textarea>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2 mt-2">Upload Photo Evidence (Optional)</label>
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        disabled={uploadingImage}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                    />
                                                    <button type="button" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl border border-slate-300 font-medium text-sm transition-colors">
                                                        {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                                        {uploadingImage ? 'Uploading...' : 'Select Image'}
                                                    </button>
                                                </div>

                                                {imagePreview && (
                                                    <div className="relative h-16 w-16 rounded-lg overflow-hidden border-2 border-slate-200">
                                                        <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <h3 className="text-sm border-b pb-2 font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <CopyCheck className="w-4 h-4 text-blue-500" /> Exact Location Tagging
                                        </h3>

                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
                                            <div className="bg-white p-2 rounded-lg border border-blue-200 text-blue-600">
                                                <Navigation className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-800 text-sm">Use Automated GPS (Recommended)</h4>
                                                <p className="text-xs text-slate-500 mt-1 mb-3">Capturing exact coordinates vastly speeds up the resolution team's dispatch.</p>

                                                <button type="button" onClick={captureLocation} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                                    Capture My Location
                                                </button>

                                                {formData.latitude && (
                                                    <div className="mt-4">
                                                        <MapDisplay latitude={formData.latitude} longitude={formData.longitude} />
                                                        <div className="mt-3 text-xs font-mono font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 border border-green-200">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Coordinates Locked: [{Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}]
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                                                <input disabled type="text" value="Uttar Pradesh" className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 text-sm outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">District *</label>
                                                <select required value={formData.district} onChange={(e) => handleLocationChange('district', e.target.value)}
                                                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none">
                                                    <option value="">Select District</option>
                                                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Local Authority / Block *</label>
                                                <select required disabled={!formData.district} value={formData.block} onChange={(e) => handleLocationChange('block', e.target.value)}
                                                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none disabled:opacity-50">
                                                    <option value="">Select Local Block</option>
                                                    {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Village/Area</label>
                                                <select disabled={!formData.block} value={formData.village} onChange={(e) => handleLocationChange('village', e.target.value)}
                                                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none disabled:opacity-50">
                                                    <option value="">Select Village</option>
                                                    {villages.map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t">
                                        <button
                                            disabled={formLoading}
                                            type="submit"
                                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-70"
                                        >
                                            {formLoading ? 'AI Routing...' : t('submit_ai')}
                                        </button>
                                    </div>

                                </form>
                            </div>
                        </div>
                    )}

                    {/* FEEDBACK TAB */}
                    {activeTab === 'feedback' && selectedComplaint && (
                        <div className="max-w-2xl mx-auto">
                            <button onClick={() => { setActiveTab('list'); setSelectedComplaint(null); }} className="text-sm text-slate-500 hover:text-slate-800 mb-6 flex items-center gap-1">
                                &larr; Back to List
                            </button>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 bg-slate-50 border-b border-slate-200">
                                    <h2 className="text-xl font-bold text-slate-900">Review Resolution</h2>
                                    <p className="text-sm text-slate-500 mt-1">Ticket: {selectedComplaint.title}</p>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <h3 className="text-sm font-semibold text-green-800 uppercase tracking-widest mb-2">Officer Remarks</h3>
                                        <p className="text-green-900 text-sm">{selectedComplaint.officerRemarks || "Issue has been resolved at the site."}</p>

                                        {selectedComplaint.proofImage && (
                                            <div className="mt-4 pt-4 border-t border-green-200">
                                                <h4 className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-2">Resolution Proof</h4>
                                                <a href={`http://localhost:5000${selectedComplaint.proofImage}`} target="_blank" rel="noreferrer">
                                                    <img src={`http://localhost:5000${selectedComplaint.proofImage}`} alt="Resolution Proof" className="h-40 w-auto object-cover rounded-lg border border-green-200 shadow-sm hover:opacity-90 transition-opacity cursor-pointer" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <hr className="border-slate-100" />

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-3">How satisfied are you with this resolution? *</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                { val: 'Satisfied', color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' },
                                                { val: 'Partially Satisfied', color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200' },
                                                { val: 'Not Satisfied', color: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.val}
                                                    onClick={() => setFeedbackData({ ...feedbackData, satisfactionLevel: opt.val })}
                                                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${feedbackData.satisfactionLevel === opt.val
                                                        ? 'ring-2 ring-slate-900 ring-offset-2 ' + opt.color.split(' ')[0] + ' ' + opt.color.split(' ')[1] + ' border-transparent'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {opt.val}
                                                </button>
                                            ))}
                                        </div>
                                        {feedbackData.satisfactionLevel === 'Partially Satisfied' && <p className="text-xs text-orange-600 mt-2">This will reopen the ticket with the current officer for further work.</p>}
                                        {feedbackData.satisfactionLevel === 'Not Satisfied' && <p className="text-xs text-red-600 mt-2">This will automatically escalate your grievance to the next level of authority.</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Additional Comments (Optional)</label>
                                        <textarea rows={3} value={feedbackData.comments} onChange={e => setFeedbackData({ ...feedbackData, comments: e.target.value })}
                                            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-slate-500 focus:border-slate-500 text-sm outline-none bg-slate-50 focus:bg-white" placeholder="Any details you'd like to add..."></textarea>
                                    </div>

                                    <button
                                        disabled={feedbackLoading || !feedbackData.satisfactionLevel}
                                        onClick={async () => {
                                            setFeedbackLoading(true);
                                            try {
                                                await axios.post(`http://localhost:5000/api/complaints/${selectedComplaint._id}/feedback`, feedbackData, {
                                                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                                });
                                                alert('Feedback submitted successfully!');
                                                setSelectedComplaint(null);
                                                setActiveTab('list');
                                                fetchComplaints();
                                            } catch (e) {
                                                alert('Failed to submit feedback');
                                            } finally {
                                                setFeedbackLoading(false);
                                            }
                                        }}
                                        className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-50"
                                    >
                                        {feedbackLoading ? 'Processing Workflow...' : 'Submit Feedback & Update Workflow'}
                                    </button>

                                </div>
                            </div>
                        </div>
                    )}
                    {/* ACCOUNT TAB - PROFESSIONAL REDESIGN */}
                    {activeTab === 'account' && (
                        <div className="max-w-6xl mx-auto pb-20">
                            {/* Breadcrumbs */}
                            <nav className="flex mb-8 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                <button onClick={() => setActiveTab('list')} className="hover:text-orange-600 transition-colors">Portal</button>
                                <span className="mx-3 text-slate-300">/</span>
                                <span className="text-slate-900">Account Settings</span>
                            </nav>

                            <div className="flex flex-col lg:flex-row gap-10">
                                {/* Account Sidebar Navigation */}
                                <aside className="w-full lg:w-72 shrink-0">
                                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 sticky top-24">
                                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                                            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 text-sm truncate w-40">{user.name}</div>
                                                <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-0.5 flex items-center gap-1"><Shield className="w-3 h-3" /> Verified</div>
                                            </div>
                                        </div>
                                        
                                        <nav className="space-y-1">
                                            {[
                                                { id: 'profile', label: 'Personal Information', icon: User },
                                                { id: 'security', label: 'Security & Privacy', icon: ShieldCheck },
                                                { id: 'activity', label: 'Activity Journal', icon: Clock }
                                            ].map(tab => (
                                                <button 
                                                    key={tab.id}
                                                    onClick={() => setAccountSubTab(tab.id)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${accountSubTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                                                >
                                                    <tab.icon className="w-4 h-4" /> {tab.label}
                                                </button>
                                            ))}
                                        </nav>

                                        <div className="mt-8 pt-6 border-t border-slate-100 text-[10px] font-bold text-slate-400 px-4">
                                            PLATFORM VERSION V.2.4.0 <br /> BHARAT JANSETU AI
                                        </div>
                                    </div>
                                </aside>

                                {/* Account Main Area */}
                                <div className="flex-1 space-y-10">
                                    {accountSubTab === 'profile' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                                            {/* Profile Branding Header */}
                                            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                                                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                                                    <div className="w-24 h-24 bg-slate-100 rounded-[28px] flex items-center justify-center border-2 border-slate-50 group-hover:rotate-3 transition-transform duration-500">
                                                        <User className="w-10 h-10 text-slate-300" />
                                                    </div>
                                                    <div className="text-center sm:text-left flex-1">
                                                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{user.name}</h1>
                                                        <p className="text-slate-500 font-medium mt-1">Grievance ID Holder • Uttar Pradesh Portal</p>
                                                        <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-4">
                                                            <span className="bg-orange-50 text-orange-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">Citizenship: {user.district}</span>
                                                            <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> ID Verified</span>
                                                        </div>
                                                    </div>
                                                    <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95">Edit Public Profile</button>
                                                </div>
                                            </div>

                                            {/* Information Tiles */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 hover:shadow-lg transition-all">
                                                    <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest"><Phone className="w-4 h-4 text-slate-400" /> Contact Repository</h3>
                                                    <div className="space-y-6">
                                                        <div className="group">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 group-hover:text-orange-500 transition-colors">Primary Mobile Reference</label>
                                                            <div className="font-bold text-slate-900 text-lg">+91 {user.mobile}</div>
                                                        </div>
                                                        <div className="group pt-6 border-t border-slate-50">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 group-hover:text-orange-500 transition-colors">Digital Correspondence</label>
                                                            <div className="font-bold text-slate-900 italic text-lg">{user.email || 'NO_RECORDED_EMAIL'}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 hover:shadow-lg transition-all">
                                                    <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest"><MapPin className="w-4 h-4 text-slate-400" /> Geographical Attachment</h3>
                                                    <div className="space-y-6">
                                                        <div className="flex gap-8">
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">State Registry</label>
                                                                <div className="font-bold text-slate-900">{user.state}</div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">District</label>
                                                                <div className="font-bold text-slate-900">{user.district}</div>
                                                            </div>
                                                        </div>
                                                        <div className="pt-6 border-t border-slate-50">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Jurisdiction (Block/Village)</label>
                                                            <div className="font-bold text-slate-900">{user.block}, {user.village}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {accountSubTab === 'security' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="p-8 border-b border-slate-100">
                                                    <h3 className="text-xl font-bold text-slate-900">Security Credentials</h3>
                                                    <p className="text-slate-500 text-sm mt-1">Manage your platform access and validation methods.</p>
                                                </div>
                                                <div className="p-8 space-y-8">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><ShieldCheck className="w-6 h-6" /></div>
                                                            <div>
                                                                <div className="font-bold text-slate-900">Authentication Method</div>
                                                                <div className="text-slate-500 text-xs mt-0.5">Mobile OTP + Digital Signature</div>
                                                            </div>
                                                        </div>
                                                        <button className="text-[10px] font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-lg border border-orange-100 uppercase tracking-widest">Update</button>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500"><Calendar className="w-6 h-6" /></div>
                                                            <div>
                                                                <div className="font-bold text-slate-900">Last Successful Login</div>
                                                                <div className="text-slate-500 text-xs mt-0.5">{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-green-600 px-3 py-1 rounded bg-green-50 uppercase tracking-widest border border-green-100">STABLE</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-red-50 border border-red-100 rounded-[32px] p-8 flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-red-900 font-bold">Terminate Session</h4>
                                                    <p className="text-red-700 text-xs mt-1">Instantly sign out of the Bharat JanSetu portal and clear authentication tokens.</p>
                                                </div>
                                                <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all active:scale-95">LOGOUT_NOW</button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {accountSubTab === 'activity' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 min-h-[500px]">
                                            <div className="mb-8 pb-6 border-b border-slate-100 flex items-center justify-between">
                                                <h3 className="text-xl font-bold text-slate-900">Activity Journal</h3>
                                                <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 flex items-center gap-1.5 transition-colors">
                                                    <RefreshCw className="w-3 h-3" /> Refresh Logs
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-6">
                                                {complaints.length > 0 ? (
                                                    complaints.slice(0, 5).map((c: any, i) => (
                                                        <div key={i} className="flex gap-4 group">
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 group-hover:scale-150 transition-transform"></div>
                                                                <div className="w-px h-full bg-slate-100 mt-2 italic"></div>
                                                            </div>
                                                            <div className="pb-6">
                                                                <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Grievance Registered: {c.title}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">#{c._id.substring(c._id.length - 8)} • {new Date(c.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-20">
                                                        <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No recent journal entries detected.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex justify-around items-center h-16 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button onClick={() => setActiveTab('list')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'list' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{t('my_grievances')}</span>
                    </button>
                    <button onClick={() => setActiveTab('new')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'new' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        <PlusCircle className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{t('report_issue')}</span>
                    </button>
                    <button onClick={() => setActiveTab('account')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'account' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        <User className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Account</span>
                    </button>
                    <button onClick={toggleLanguage} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600">
                        <Globe className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{language === 'en' ? 'ENG' : 'HIN'}</span>
                    </button>
                </div>
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
            </main>
        </motion.div>
    );
}
