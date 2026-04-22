'use client';

import Link from 'next/link';
import { FileText, UserCheck, AlertTriangle, Scale, ArrowLeft } from 'lucide-react';

export default function TermsOfUse() {
    return (
        <div className="min-h-screen bg-white">


            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="prose prose-slate prose-lg max-w-none">
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Account Responsibilities</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            By registering on Bharat JanSetu, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Prohibited Conduct</h2>
                        </div>
                        <p className="text-slate-600 mb-4">Users are strictly prohibited from:</p>
                        <ul className="space-y-4 text-slate-600">
                            <li>Filing false, malicious, or frivolous grievances.</li>
                            <li>Uploading obscene, offensive, or unrelated photographic evidence.</li>
                            <li>Attempting to bypass jurisdictional security controls (Role Escalation).</li>
                            <li>Using the portal for non-grievance related service requests.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Grievance Processing</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            The Portal uses automated AI routing to assign grievances to departments. While we strive for 100% accuracy, the routing remains subject to administrative review. We do not guarantee a resolution within the specified SLA if the grievance requires extensive field-work or complex legal intervention.
                        </p>
                    </section>

                    <section className="mb-12 border-t border-slate-100 pt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
                                <Scale className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Legal Jurisdiction</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            These terms are governed by the laws of India. Any disputes arising out of the use of this portal shall be subject to the exclusive jurisdiction of the courts in Uttar Pradesh.
                        </p>
                    </section>

                    <footer className="mt-20 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-400 text-sm">By using Bharat JanSetu, you signify your acceptance of these terms.</p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
