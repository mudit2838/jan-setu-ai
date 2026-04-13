'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    UserCheck, UserMinus, Shield, ShieldAlert, Search, MapPin, 
    Building, Phone, Mail, Loader2, Power, UserPlus, X, Lock, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function OfficialDirectory() {
    const [officials, setOfficials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionId, setActionId] = useState<string | null>(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        password: '',
        role: 'official_block',
        district: '',
        block: '',
        department: 'General Administration'
    });

    const [districts, setDistricts] = useState<string[]>([]);

    const fetchOfficials = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/master/officials', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOfficials(data);
        } catch (error) {
            console.error('Failed to fetch directory', error);
            toast.error('Directory access restricted');
        } finally {
            setLoading(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/users/locations/districts');
            setDistricts(data);
        } catch (error) {
            console.error('Failed to fetch districts');
        }
    };

    useEffect(() => {
        fetchOfficials();
        fetchLocations();
    }, []);

    const toggleStatus = async (id: string) => {
        setActionId(id);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.patch(`http://localhost:5000/api/master/official/${id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setOfficials(prev => prev.map(off => off._id === id ? { ...off, isActive: data.status } : off));
            toast.success(data.message);
        } catch (error) {
            toast.error('Privilege escalation required to change status');
        } finally {
            setActionId(null);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/master/register', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success('Official provisioned successfully!');
            setShowRegisterModal(false);
            setFormData({
                name: '',
                mobile: '',
                email: '',
                password: '',
                role: 'official_block',
                district: '',
                block: '',
                department: 'General Administration'
            });
            fetchOfficials();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Provisioning failed');
        } finally {
            setRegisterLoading(false);
        }
    };

    const filtered = officials.filter(off => 
        off.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">Syncing State Official Directory...</p>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-8">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            State Authority Directory
                            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded-full uppercase font-black">Control Center</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Managing administrative hierarchy for Uttar Pradesh</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search By Name, District, or Dept..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all shadow-sm"
                            />
                        </div>
                        <button 
                            onClick={() => setShowRegisterModal(true)}
                            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 whitespace-nowrap"
                        >
                            <UserPlus className="w-4 h-4" />
                            Provision New Official
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto text-slate-900">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Identity & Rank</th>
                                <th className="px-8 py-5">Jurisdiction & Dept</th>
                                <th className="px-8 py-5">Contact Vector</th>
                                <th className="px-8 py-5">Global Status</th>
                                <th className="px-8 py-5 text-right">Administrative Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic font-medium">No officials found in the searched criteria</td></tr>
                            ) : (
                                filtered.map((off: any) => (
                                    <tr key={off._id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${off.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {off.role === 'official_super' ? <Shield className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{off.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{off.role.replace('official_', '').toUpperCase()} AUTHORITY</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                    <MapPin className="w-3 h-3 text-red-500" /> {off.district || 'State HQ'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                                    <Building className="w-3 h-3 text-blue-500" /> {off.department}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1 text-[11px]">
                                                <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                                                    <Phone className="w-3 h-3 text-green-500" /> +91 {off.mobile}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[150px]">
                                                    <Mail className="w-3 h-3 text-slate-300" /> {off.email || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${off.isActive ? 'bg-green-100 text-green-700 ring-4 ring-green-100/50' : 'bg-red-100 text-red-700 ring-4 ring-red-100/50'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${off.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {off.isActive ? 'Active Duty' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => toggleStatus(off._id)}
                                                disabled={actionId === off._id || off.role === 'official_super'}
                                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${off.isActive ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'} disabled:opacity-30 flex items-center justify-center gap-2 ml-auto shadow-sm active:scale-95`}
                                            >
                                                {actionId === off._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                                                {off.isActive ? 'Suspend Authorization' : 'Activate Authorization'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* REGISTER MODAL */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowRegisterModal(false)}></div>
                    <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col text-slate-900">
                        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20">
                                        <UserPlus className="w-6 h-6" />
                                    </div>
                                    Provision State Official
                                </h2>
                                <p className="text-slate-500 text-sm mt-1 font-medium">Issue authenticated administrative credentials</p>
                            </div>
                            <button onClick={() => setShowRegisterModal(false)} className="bg-white border border-slate-200 p-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleRegister} className="flex-1 overflow-y-auto p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                        Official Name <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        required 
                                        type="text" 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold placeholder:text-slate-400"
                                        placeholder="Enter Full Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                        Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        required 
                                        type="tel" 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold"
                                        placeholder="10-Digit Mobile"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                        Official Email
                                    </label>
                                    <input 
                                        type="email" 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold"
                                        placeholder="officer@up.gov.in"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                        Secret Password <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        required 
                                        type="password" 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                        Authority Role <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold appearance-none cursor-pointer"
                                        value={formData.role}
                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    >
                                        <option value="official_block">Block Authority (L1)</option>
                                        <option value="official_district">District Authority (L2)</option>
                                        <option value="official_state">State Authority (L3)</option>
                                        <option value="official_super">Super Monitor (L4)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                        Assigned District <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold appearance-none cursor-pointer"
                                        value={formData.district}
                                        onChange={(e) => setFormData({...formData, district: e.target.value})}
                                    >
                                        <option value="">Select Domain District</option>
                                        {districts.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                        Block / HQ Name
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold"
                                        placeholder="e.g. Sadar or Secretariat"
                                        value={formData.block}
                                        onChange={(e) => setFormData({...formData, block: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                        Department
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold"
                                        placeholder="e.g. PWD, Healthcare, etc."
                                        value={formData.department}
                                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-10 flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowRegisterModal(false)}
                                    className="flex-1 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Abort
                                </button>
                                <button 
                                    type="submit"
                                    disabled={registerLoading}
                                    className="flex-[2] bg-blue-600 text-white px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {registerLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                                    {registerLoading ? 'Provisioning...' : 'Confirm Authorization'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
