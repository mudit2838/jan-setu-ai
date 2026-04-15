'use client';

import Link from 'next/link';
import { Shield, Lock, Eye, Server, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white">
            <header className="bg-slate-50 border-b border-slate-200 py-12">
                <div className="max-w-4xl mx-auto px-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 font-semibold text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-slate-500 font-medium">Last Updated: April 15, 2026</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="prose prose-slate prose-lg max-w-none">
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Introduction</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            Bharat JanSetu ("we," "our," or "the Portal") is committed to protecting the privacy of its users. This Privacy Policy explains how we collect, use, and protect your personal information when you use our AI-powered grievance redressal system.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Information We Collect</h2>
                        </div>
                        <ul className="space-y-4 text-slate-600">
                            <li><strong>Identity Data:</strong> Full name, mobile number, and unique citizen identification.</li>
                            <li><strong>Location Data:</strong> District, Block, and Village information (and optional GPS coordinates for specific grievance reporting).</li>
                            <li><strong>Grievance Data:</strong> Details of the complaints filed, including descriptions, categories, and supporting photographic evidence.</li>
                            <li><strong>Technical Data:</strong> IP address, device type, and operational logs for security and performance monitoring.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                                <Eye className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">How We Use Information</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            Your information is strictly used for the purpose of grievance resolution. This includes:
                        </p>
                        <ul className="space-y-4 text-slate-600 mt-4">
                            <li>AI-based routing of complaints to the appropriate government official.</li>
                            <li>Verification of grievance resolution through citizen-officer communication.</li>
                            <li>Generating state-level analytics to improve governance efficiency.</li>
                            <li>Sending real-time notifications regarding the status of your grievance.</li>
                        </ul>
                    </section>

                    <section className="mb-12 border-t border-slate-100 pt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
                                <Server className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Data Security</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            We implement robust security measures, including end-to-end encryption for authentication and secure cloud storage for sensitive evidence. Access to citizen data is strictly restricted to assigned officials based on a need-to-know jurisdictional basis.
                        </p>
                    </section>

                    <footer className="mt-20 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-400 text-sm">Official Privacy Charter - Bharat JanSetu Initiative</p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
