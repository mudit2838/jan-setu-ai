'use client';

import Link from 'next/link';
import { Copyright, Share2, Download, AlertCircle, ArrowLeft } from 'lucide-react';

export default function CopyrightPolicy() {
    return (
        <div className="min-h-screen bg-white">
            <header className="bg-slate-50 border-b border-slate-200 py-12">
                <div className="max-w-4xl mx-auto px-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 font-semibold text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Copyright Policy</h1>
                    <p className="text-slate-500 font-medium">Intellectual Property & Content Usage</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="prose prose-slate prose-lg max-w-none">
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                                <Copyright className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Ownership of Content</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            All materials on this portal, including but not limited to AI logic models, visual designs, logos, and administrative data datasets, are either the intellectual property of the Government or its authorized administrative bodies. No part of this portal may be reproduced without prior written permission.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                                <Share2 className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Permitted Use</h2>
                        </div>
                        <p className="text-slate-600 mb-4">Users are permitted to:</p>
                        <ul className="space-y-4 text-slate-600">
                            <li>Download grievance receipts and official resolution reports for personal record-keeping.</li>
                            <li>Share public analytics links to promote transparency in governance.</li>
                            <li>Use portal screenshots for academic or non-commercial journalistic purposes, provided credit is given to Bharat JanSetu.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Copyright Violations</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            Commercial reproduction or redistribution of Bharat JanSetu content for the purpose of creating "cloned" portals or for-profit advisory services is strictly prohibited and will be met with legal action under the Copyright Act of 1957.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
