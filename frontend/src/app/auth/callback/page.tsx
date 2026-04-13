'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2, ShieldCheck } from 'lucide-react';

function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('Verifying your GovTech Identity...');

    useEffect(() => {
        const processDigiLockerLogin = async () => {
            if (!token) {
                setStatus('Invalid Authentication Token.');
                toast.error('Authentication Failed: No Secure Token Provider');
                setTimeout(() => router.push('/login'), 2000);
                return;
            }

            try {
                setStatus('Validating National KYC Data...');
                // Decode the mock base64 token payload
                const payloadStr = Buffer.from(token, 'base64').toString('utf8');
                const userKYCData = JSON.parse(payloadStr);

                setStatus('Establishing Secure Session...');
                // Post to our new API endpoint
                const { data } = await axios.post('http://localhost:5000/api/users/login/digilocker', userKYCData);

                // Save token
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));

                toast.success('Meri Pehchaan Login Successful!');
                setStatus('Redirecting to Command Center...');

                setTimeout(() => {
                    // Route admins vs citizens
                    if (['admin', 'official_block', 'official_district', 'official_state'].includes(data.role)) {
                        router.push('/dashboard/official');
                    } else {
                        router.push('/dashboard/citizen');
                    }
                }, 1000);

            } catch (error: any) {
                console.error("SSO Error:", error);
                setStatus('System Verification Failed.');
                toast.error(error.response?.data?.message || 'Single Sign-On Failed');
                setTimeout(() => router.push('/login'), 2000);
            }
        };

        processDigiLockerLogin();
    }, [token, router]);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="text-center">
                <ShieldCheck className="w-16 h-16 text-blue-500 mx-auto mb-6 animate-pulse" />
                <h1 className="text-2xl font-bold text-white mb-2">Bharat JanSetu SSO</h1>
                <p className="text-slate-400 font-medium flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {status}
                </p>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        // Next.js requires useSearchParams to be wrapped in a suspense boundary
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Verification Engine...</div>}>
            <CallbackHandler />
        </Suspense>
    );
}
