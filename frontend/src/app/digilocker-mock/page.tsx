'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, FileText, CheckCircle2, User, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DigiLockerMock() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Hardcoded mock persona for simulation
    const mockPersona = {
        name: "Rajesh Kumar",
        mobile: "9876543210",
        aadhaar: "XXXX-XXXX-1234",
        state: "Uttar Pradesh",
        district: "Varanasi",
        block: "Arajiline",
        village: "Kashipur",
        pincode: "221302"
    };

    const handleAuthorize = () => {
        setLoading(true);
        // Simulate a tiny network latency for authenticity
        setTimeout(() => {
            // In a real OAuth flow this would be a secure, signed JWT token attached to the URL.
            // For the mock, we will base64 encode the persona and pass it back to our callback route.
            const token = Buffer.from(JSON.stringify(mockPersona)).toString('base64');
            router.push(`/auth/callback?token=${token}`);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-200"
            >
                {/* Official Indian Gov Header Ribbon */}
                <div className="bg-[#1e3a8a] px-6 py-4 flex items-center justify-between border-b-2 border-orange-500">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-white" />
                        <div>
                            <h2 className="text-white font-bold text-lg leading-tight tracking-wide">Meri Pehchaan</h2>
                            <p className="text-blue-200 text-xs">National Single Sign-On</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <Fingerprint className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-slate-800">Consent to Share Information</h1>
                        <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                            <span className="font-semibold text-slate-700">Bharat JanSetu</span> is requesting access to your verified Digilocker KYC documents for immediate onboarding.
                        </p>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-5 mb-8">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Data to be shared:
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-slate-800">Verified Name & Aadhaar</p>
                                    <p className="text-xs text-slate-500">{mockPersona.name} • {mockPersona.aadhaar}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-slate-800">Registered Mobile Number</p>
                                    <p className="text-xs text-slate-500">+91 {mockPersona.mobile}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-slate-800">Residential Address details</p>
                                    <p className="text-xs text-slate-500">{mockPersona.village}, {mockPersona.district}, {mockPersona.state}</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Deny
                        </button>
                        <button
                            disabled={loading}
                            onClick={handleAuthorize}
                            className="flex-[2] flex justify-center items-center gap-2 px-4 py-3 bg-[#1e3a8a] rounded-lg font-bold text-white hover:bg-[#152c6b] transition-colors shadow-md disabled:opacity-70"
                        >
                            {loading ? 'Authenticating...' : 'Allow & Share Data'}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-400">
                    <p>Secured by Government of India • Ministry of Electronics & IT</p>
                </div>
            </motion.div>
        </div>
    );
}
