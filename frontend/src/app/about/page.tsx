import Link from 'next/link';
import { ShieldCheck, ArrowRight, HeartHandshake, Eye, Zap } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">


            {/* Hero Section */}
            <main className="flex-1">
                <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
                    <div className="absolute opacity-10 right-[-10%] top-[-20%] w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                            Bridging the Gap Between Citizens and Governance.
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
                            Bharat JanSetu is a next-generation civic grievance redressal platform built for the state of Uttar Pradesh. We leverage artificial intelligence to ensure your voice is heard, categorized, and resolved faster than ever before.
                        </p>
                    </div>
                </section>

                {/* Core Values */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900">Our Core Mission</h2>
                            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">We believe in a transparent, accountable, and hyper-efficient government that serves its citizens proactively.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Eye className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Total Transparency</h3>
                                <p className="text-slate-600 leading-relaxed">Every complaint is tracked visibly. You can see exactly which official is handling your issue and how long they have to resolve it.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Zap className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">AI-Powered Speed</h3>
                                <p className="text-slate-600 leading-relaxed">No more manual sorting. Our AI instantly reads your complaint, categorizes it, assigns priority, and routes it to the exact local official who can fix it.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <HeartHandshake className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Citizen Empowerment</h3>
                                <p className="text-slate-600 leading-relaxed">The feedback loop belongs to you. Officials must provide photographic proof of resolution before a ticket can be truly closed by your approval.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-orange-50 py-16">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Ready to make a difference in your locality?</h2>
                        <Link href="/register" className="inline-flex items-center gap-2 bg-orange-600 text-white px-8 py-3.5 rounded-full font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-600/20">
                            Register as a Citizen <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

            </main>

            {/* Simple Footer */}
            <footer className="bg-slate-900 py-8 border-t border-slate-800 text-center">
                <p className="text-slate-400 text-sm">© {new Date().getFullYear()} Bharat JanSetu. A Governance Initiative.</p>
            </footer>
        </div>
    );
}
