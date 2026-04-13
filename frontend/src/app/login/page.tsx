'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Phone, Mail, Lock, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const router = useRouter();

    // UI State
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [isHighSecurityCitizen, setIsHighSecurityCitizen] = useState(false);
    const [step, setStep] = useState(1); // 1 = Creds, 2 = OTP
    const [loading, setLoading] = useState(false);

    // Form Data
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: any = {};

            if (isAdminMode) {
                payload.email = email;
                payload.password = password;
            } else {
                payload.mobile = mobile;
                payload.password = password;
            }

            const { data } = await axios.post('http://localhost:5000/api/users/login', payload);

            // Save token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));

            toast.success('Login successful! Redirecting...');

            setTimeout(() => {
                if (['admin', 'official_block', 'official_district', 'official_state'].includes(data.role)) {
                    router.push('/dashboard/official');
                } else {
                    router.push('/dashboard/citizen');
                }
            }, 1000);

        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
        >
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">

                {/* Header */}
                <div className="bg-slate-900 px-6 py-8 text-center text-white relative overflow-hidden">
                    <div className="absolute opacity-10 right-[-20%] top-[-20%] w-48 h-48 bg-white rounded-full blur-3xl"></div>
                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-orange-400" />
                    <h2 className="text-2xl font-bold">Bharat JanSetu</h2>
                    <p className="text-slate-300 text-sm mt-1">Secure Authentication Gateway</p>
                </div>

                <div className="p-6 sm:p-8">
                    {/* Toggle Modes */}
                    <div className="flex rounded-lg bg-slate-100 p-1 mb-8">
                        <button
                            onClick={() => setIsAdminMode(false)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isAdminMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Citizen
                        </button>
                        <button
                            onClick={() => setIsAdminMode(true)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isAdminMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Official / Admin
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">

                        {isAdminMode ? (
                            <>
                                {/* ADMIN/OFFICIAL FORM */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Official Email ID</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500 text-sm outline-none transition-all"
                                            placeholder="official@up.gov.in"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* CITIZEN FORM */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Registered Mobile Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            required
                                            pattern="[0-9]{10}"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500 text-sm outline-none transition-all"
                                            placeholder="10-digit mobile number"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Account Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500 text-sm outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all mt-6 disabled:opacity-70"
                        >
                            {loading ? 'Authenticating...' : 'Secure Login'}
                        </button>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">Or continue with</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push('/digilocker-mock')}
                                className="mt-6 w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                            >
                                <span className="text-blue-700 font-bold border-r border-slate-300 pr-2">Meri Pehchaan</span>
                                <span>Login via DigiLocker</span>
                            </button>
                        </div>
                    </form>

                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-500">
                        New Citizen? <Link href="/register" className="font-semibold text-orange-600 hover:text-orange-500">Register Here</Link>
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
