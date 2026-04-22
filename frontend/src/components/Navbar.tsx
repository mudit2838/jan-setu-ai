'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronLeft, LogIn } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Hide Back button on Home page
    const isHome = pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const navLinks = [
        { name: 'About', href: '/about' },
        { name: 'Features', href: '/features' },
        { name: 'Analytics', href: '/analytics', badge: 'Live' },
        { name: 'How It Works', href: '/how-it-works' },
    ];

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
                scrolled ? 'top-4 px-4 sm:px-10' : 'top-8 px-0'
            }`}
        >
            <div className={`mx-auto transition-all duration-500 ease-in-out border-white/20 ${
                scrolled 
                ? 'max-w-7xl rounded-full bg-white/70 backdrop-blur-2xl shadow-[0_8px_32px_rgba(31,41,55,0.1)] py-2 border' 
                : 'max-w-full rounded-none bg-white/95 backdrop-blur-md shadow-sm py-4 border-b'
            }`}>
                <div className="px-6 flex items-center justify-between">
                    
                    {/* LEFT SECTION: Back Button and Logo */}
                    <div className="flex items-center gap-8">
                        {!isHome && (
                            <button 
                                onClick={() => router.back()}
                                className="flex items-center gap-1.5 text-slate-600 hover:text-orange-600 font-bold transition-all group"
                            >
                                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        )}
                        <Link href="/" className="flex items-center gap-2 group transform active:scale-95 transition-transform">
                            <div className="text-2xl drop-shadow-sm group-hover:rotate-12 transition-transform duration-300">🇮🇳</div> 
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
                                <span className="text-xl sm:text-2xl font-black tracking-tighter bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent uppercase">
                                    Bharat <span className="text-orange-600">JanSetu</span>
                                </span>
                                <span className="text-sm sm:text-lg italic font-black text-blue-600 tracking-widest uppercase">
                                    AI
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* DESKTOP NAV */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name} 
                                href={link.href}
                                className={`text-sm font-bold transition-all hover:scale-105 ${
                                    pathname === link.href ? 'text-orange-600' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    {link.name}
                                    {link.badge && (
                                        <span className="bg-orange-100 text-orange-600 text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter animate-pulse">
                                            {link.badge}
                                        </span>
                                    )}
                                </span>
                            </Link>
                        ))}
                    </nav>

                    {/* RIGHT SECTION: Auth & Hamburger */}
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="hidden sm:flex items-center gap-1.5 text-slate-700 font-bold hover:text-orange-600 transition-colors px-4 py-2">
                            <LogIn className="w-4 h-4" />
                            Login
                        </Link>
                        <Link href="/register" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange-500/30 text-white px-5 py-2.5 rounded-2xl font-black text-sm transition-all hover:scale-105">
                            Report Issue
                        </Link>
                        
                        {/* MOBILE MENU BUTTON */}
                        <button 
                            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* MOBILE MENU DRAWER */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden overflow-hidden border-t border-slate-100"
                        >
                            <div className="px-6 py-6 flex flex-col gap-4">
                                {navLinks.map((link) => (
                                    <Link 
                                        key={link.name} 
                                        href={link.href}
                                        className={`text-lg font-bold ${
                                            pathname === link.href ? 'text-orange-600' : 'text-slate-600'
                                        }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                                <hr className="border-slate-100" />
                                <Link href="/login" className="flex items-center gap-2 text-lg font-bold text-slate-600">
                                    <LogIn className="w-5 h-5" />
                                    Account Login
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
}
