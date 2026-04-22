'use client';

import Link from 'next/link';
import { Eye, Accessibility, Command, Headphones, ArrowLeft } from 'lucide-react';

export default function AccessibilityStatement() {
    return (
        <div className="min-h-screen bg-white">


            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="prose prose-slate prose-lg max-w-none">
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                                <Accessibility className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Our Commitment</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            Bharat JanSetu is committed to providing a digitally inclusive environment. We strive to ensure that our portal is accessible to all citizens, including those with visual, auditory, or cognitive impairments, in accordance with the Guidelines for Indian Government Websites (GIGW) and WCAG 2.1 Standards.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                                <Eye className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Visual Accessibility</h2>
                        </div>
                        <p className="text-slate-600 mb-4">We maintain high-contrast ratios across all dashboard elements and provide support for:</p>
                        <ul className="space-y-4 text-slate-600">
                            <li><strong>Screen Readers:</strong> Optimized semantic HTML for smooth navigation with software like NVDA, JAWS, and VoiceOver.</li>
                            <li><strong>Dynamic Font Scaling:</strong> Support for browser-level zoom and text resizing without layout breakage.</li>
                            <li><strong>Color Blindness:</strong> UI elements rely on icons and text labels, not just color coding, for critical status updates.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
                                <Command className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Navigational Aides</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            Full keyboard navigation support is provided across all citizen and official dashboards. Modern shortcuts and "Skip to Content" links are integrated to allow rapid movement for users who do rely on mouse interaction.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
