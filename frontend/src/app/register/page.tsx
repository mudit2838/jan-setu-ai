'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { UserPlus, Phone, Lock, User } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();

    // UI State
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Location Data State
    const [districts, setDistricts] = useState<string[]>([]);
    const [blocks, setBlocks] = useState<string[]>([]);
    const [villages, setVillages] = useState<string[]>([]);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        password: '',
        confirmPassword: '',
        district: '',
        block: '',
        village: '',
        pincode: '',
        addressLine: ''
    });

    // const [otp, setOtp] = useState(''); (Removed unused OTP field)

    // Fetch initial districts on load
    useEffect(() => {
        axios.get('http://localhost:5000/api/users/locations/districts')
            .then(res => setDistricts(res.data))
            .catch(err => console.error(err));
    }, []);

    // Handle Location Cascading Dropdowns
    const handleLocationChange = async (type: string, value: string) => {
        // Update state immediately
        setFormData(prev => ({ ...prev, [type]: value }));
        console.log(`[LOCATION_CHANGE] ${type} -> ${value}`);

        if (type === 'district') {
            setFormData(prev => ({ ...prev, block: '', village: '' }));
            setBlocks([]); setVillages([]);
            if (value) {
                try {
                    setLoading(true);
                    const res = await axios.get(`http://localhost:5000/api/users/locations/blocks/${value}`);
                    console.log(`[BLOCKS_FETCHED] for ${value}:`, res.data);
                    setBlocks(res.data);
                } catch (err) {
                    console.error("Failed to fetch blocks", err);
                } finally {
                    setLoading(false);
                }
            }
        } else if (type === 'block') {
            setFormData(prev => ({ ...prev, village: '' }));
            setVillages([]);
            if (value) {
                try {
                    setLoading(true);
                    // Use 'formData.district' carefully - or better, the value of district from the form state
                    const res = await axios.get(`http://localhost:5000/api/users/locations/villages/${formData.district}/${value}`);
                    console.log(`[VILLAGES_FETCHED] for ${formData.district}/${value}:`, res.data);
                    setVillages(res.data);
                } catch (err) {
                    console.error("Failed to fetch villages", err);
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // Numeric only validation for mobile and pincode
        if (name === 'mobile' || name === 'pincode') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setMessage({ text: 'Passwords do not match.', type: 'error' });
            return;
        }

        if (formData.mobile.length !== 10) {
            setMessage({ text: 'Mobile number must be exactly 10 digits.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            await axios.post('http://localhost:5000/api/users/register', formData);

            setMessage({ text: 'Registration successful! Redirecting to login...', type: 'success' });

            setTimeout(() => {
                router.push('/login');
            }, 1500);

        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setMessage({
                    text: error.response?.data?.message || 'Failed to complete registration',
                    type: 'error'
                });
            } else {
                setMessage({
                    text: 'Failed to complete registration',
                    type: 'error'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">

                {/* Header */}
                <div className="bg-orange-600 px-6 py-8 text-center text-white relative overflow-hidden">
                    <div className="absolute opacity-10 right-[-20%] top-[-20%] w-48 h-48 bg-white rounded-full blur-3xl"></div>
                    <UserPlus className="w-12 h-12 mx-auto mb-3 text-white" />
                    <h2 className="text-2xl font-bold">Citizen Registration</h2>
                    <p className="text-orange-100 text-sm mt-1">Join the Bharat JanSetu Network</p>
                </div>

                <div className="p-6 sm:p-8">

                    {message.text && (
                        <div className={`p-4 rounded-lg mb-6 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleRegistration} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Personal Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">Personal Details</h3>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input required type="text" name="name" value={formData.name} onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none" placeholder="John Doe" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input 
                                            required 
                                            type="tel" 
                                            name="mobile" 
                                            pattern="[0-9]{10}" 
                                            minLength={10}
                                            maxLength={10} 
                                            value={formData.mobile} 
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none" 
                                            placeholder="10-digit number" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input required type="password" name="password" value={formData.password} onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none" placeholder="••••••••" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input required type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none" placeholder="••••••••" />
                                    </div>
                                </div>
                            </div>

                            {/* Address Hierarchy */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">Address Details (U.P. Only)</h3>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">District *</label>
                                    <select required value={formData.district} onChange={(e) => handleLocationChange('district', e.target.value)}
                                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none cursor-pointer">
                                        <option value="">Select District</option>
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Block *</label>
                                    <select required disabled={!formData.district} value={formData.block} onChange={(e) => handleLocationChange('block', e.target.value)}
                                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none cursor-pointer disabled:opacity-50">
                                        <option value="">Select Block</option>
                                        {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Village/Town *</label>
                                    <select required disabled={!formData.block} value={formData.village} onChange={(e) => handleLocationChange('village', e.target.value)}
                                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none cursor-pointer disabled:opacity-50">
                                        <option value="">Select Village</option>
                                        {villages.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">House/Street/Landmark *</label>
                                        <input required type="text" name="addressLine" value={formData.addressLine} onChange={handleChange}
                                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none" placeholder="H.No 123, Near Temple" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Pincode *</label>
                                        <input 
                                            required 
                                            type="text" 
                                            name="pincode" 
                                            pattern="[0-9]{6}" 
                                            minLength={6}
                                            maxLength={6}
                                            value={formData.pincode} 
                                            onChange={handleChange}
                                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm outline-none" 
                                            placeholder="226001" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600 transition-all mt-8 disabled:opacity-70"
                        >
                            {loading ? 'Processing...' : 'Create Account'}
                        </button>
                    </form>

                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-500">
                        Already have an account? <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-500">Login Here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
