import Link from 'next/link';
import { ShieldCheck, Search, Filter, ClipboardList, CheckCircle } from 'lucide-react';

export default function HowItWorksPage() {
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
                        <Link href="/how-it-works" className="text-sm font-medium text-orange-600">How it Works</Link>
                        <Link href="/features" className="text-sm font-medium text-slate-600 hover:text-orange-600 transition">Features</Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1 py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">How JanSetu Works</h1>
                        <p className="text-lg text-slate-500">From reporting an issue to closing the feedback loop, we ensure total accountability.</p>
                    </div>

                    <div className="relative border-l-4 border-orange-200 ml-8 md:ml-0 md:border-none space-y-12">

                        {/* Step 1 */}
                        <div className="relative flex flex-col md:flex-row items-center gap-8 group">
                            <div className="md:w-1/2 md:text-right pr-0 md:pr-12 pl-12 md:pl-0">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">1. Report an Issue</h3>
                                <p className="text-slate-600 leading-relaxed">Simply upload a photo, drop your location pin using your phone's GPS, and describe the problem in a few words (English or Hindi).</p>
                            </div>
                            <div className="absolute left-[-22px] md:relative md:left-auto md:w-16 md:h-16 bg-white border-4 border-orange-500 rounded-full flex items-center justify-center shrink-0 z-10 shadow-lg">
                                <Search className="w-6 h-6 text-orange-500" />
                            </div>
                            <div className="hidden md:block md:w-1/2"></div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col md:flex-row-reverse items-center gap-8 group">
                            <div className="md:w-1/2 pl-12 md:pl-12">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">2. AI Priority & Routing</h3>
                                <p className="text-slate-600 leading-relaxed">Our centralized AI system instantly reads your grievance. It categorizes the department (e.g., Water Board), assigns a Priority Level, and calculates a strict SLA Deadline.</p>
                            </div>
                            <div className="absolute left-[-22px] md:relative md:left-auto md:w-16 md:h-16 bg-white border-4 border-blue-500 rounded-full flex items-center justify-center shrink-0 z-10 shadow-lg">
                                <Filter className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="hidden md:block md:w-1/2"></div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex flex-col md:flex-row items-center gap-8 group">
                            <div className="md:w-1/2 md:text-right pr-0 md:pr-12 pl-12 md:pl-0">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">3. The Escalation Matrix</h3>
                                <p className="text-slate-600 leading-relaxed">The ticket drops into the dashboard of your local <strong>Block Official</strong>. If they fail to fix it before the AI Deadline, the ticket auto-escalates to the <strong>District Magistrate</strong>.</p>
                            </div>
                            <div className="absolute left-[-22px] md:relative md:left-auto md:w-16 md:h-16 bg-white border-4 border-red-500 rounded-full flex items-center justify-center shrink-0 z-10 shadow-lg">
                                <ClipboardList className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="hidden md:block md:w-1/2"></div>
                        </div>

                        {/* Step 4 */}
                        <div className="relative flex flex-col md:flex-row-reverse items-center gap-8 group">
                            <div className="md:w-1/2 pl-12 md:pl-12">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">4. Verified Resolution</h3>
                                <p className="text-slate-600 leading-relaxed">When the official completes the work, they must upload a 'Proof of Action' image. You will be notified via SMS to verify the work and rate the resolution.</p>
                            </div>
                            <div className="absolute left-[-22px] md:relative md:left-auto md:w-16 md:h-16 bg-white border-4 border-green-500 rounded-full flex items-center justify-center shrink-0 z-10 shadow-lg">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                            <div className="hidden md:block md:w-1/2"></div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
