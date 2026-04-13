import Link from 'next/link';
import { ShieldCheck, BrainCircuit, LineChart, Globe, Lock, Smartphone } from 'lucide-react';

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Minimal Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-orange-600" />
                        <span className="text-xl font-bold text-slate-900 tracking-tight">Bharat <span className="text-orange-600">JanSetu</span></span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-orange-600 transition">About Us</Link>
                        <Link href="/how-it-works" className="text-sm font-medium text-slate-600 hover:text-orange-600 transition">How it Works</Link>
                        <Link href="/features" className="text-sm font-medium text-orange-600">Features</Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1 py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Platform Features</h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">Discover the enterprise-grade tools powering the state&apos;s most advanced civic grievance portal.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

                        {/* Feature 1 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                                <BrainCircuit className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Deep Analysis Router</h3>
                            <p className="text-slate-600 leading-relaxed">A dedicated Python-based AI microservice instantly scans incoming complaints to determine Priority (High, Medium, Low) and maps them to the exact department.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6">
                                <LineChart className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Auto-Escalation SLA Engine</h3>
                            <p className="text-slate-600 leading-relaxed">Background Cron jobs continuously monitor the state of all grievances. If a Block Official breaches their SLA timer, the ticket is forcefully escalated to the District layer.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Proof of Work</h3>
                            <p className="text-slate-600 leading-relaxed">Unlike traditional systems, complaints cannot be blindly marked as &apos;Resolved&apos;. Officials must upload photographic proof of the repaired infrastructure to close the loop.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                                <Smartphone className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Live Twilio SMS Alerts</h3>
                            <p className="text-slate-600 leading-relaxed">Integrated directly with the Twilio telecom API to send real-time secure OTP codes for login, preventing fraudulent spam accounts.</p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                            <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-6">
                                <Lock className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Enterprise Security</h3>
                            <p className="text-slate-600 leading-relaxed">Secured via robust JWT (JSON Web Tokens), BCrypt password hashing, and role-based access control (RBAC) ensuring data siloing between Districts.</p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                                <Globe className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Persistent Data Store</h3>
                            <p className="text-slate-600 leading-relaxed">Powered by a locally installed, high-performance MongoDB native database with full Mongoose ODM schema validation and indexing.</p>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
