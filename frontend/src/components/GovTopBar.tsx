'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function GovTopBar() {
    const { t, language, toggleLanguage } = useLanguage();
    const [fontSize, setFontSize] = useState(16); // Base 16px
    const [highContrast, setHighContrast] = useState(false);

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}px`;
    }, [fontSize]);

    useEffect(() => {
        if (highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }, [highContrast]);

    const changeFontSize = (step: number) => {
        setFontSize(prev => {
            const newSize = prev + step;
            if (newSize >= 12 && newSize <= 24) return newSize;
            return prev;
        });
    };

    const resetFontSize = () => setFontSize(16);

    return (
        <div className="bg-[#1f2937] text-white text-[12px] h-8 w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 z-[100] relative font-sans tracking-wide">
            {/* Left side: GOI Links */}
            <div className="flex items-center gap-4 opacity-90">
                <div className="hidden sm:block hover:underline cursor-pointer">
                    {language === 'en' ? 'Government of India' : 'भारत सरकार'}
                </div>
                <div className="hidden sm:block opacity-50">|</div>
                <Link href="/" className="hover:underline cursor-pointer font-medium">
                    {language === 'en' ? 'Ministry of Civic Affairs' : 'नागरिक मामलों का मंत्रालय'}
                </Link>
            </div>

            {/* Right side: Accessibility / Language */}
            <div className="flex items-center gap-3 opacity-90">
                <Link href="#main-content" className="hidden md:block hover:underline focus:bg-orange-500 focus:text-white px-1">
                    {language === 'en' ? 'Skip to Main Content' : 'मुख्य सामग्री पर जाएं'}
                </Link>
                <div className="hidden md:block opacity-50">|</div>

                {/* Font Adjusters */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => changeFontSize(-1)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-slate-600 rounded transition focus:ring-2 focus:ring-orange-500 aria-label='Decrease Font Size'"
                        title={language === 'en' ? 'Decrease Font Size' : 'फ़ॉन्ट आकार घटाएं'}
                    >
                        A-
                    </button>
                    <button
                        onClick={resetFontSize}
                        className="w-5 h-5 flex items-center justify-center hover:bg-slate-600 rounded transition focus:ring-2 focus:ring-orange-500 aria-label='Reset Font Size'"
                        title={language === 'en' ? 'Reset Font Size' : 'सामान्य फ़ॉन्ट आकार'}
                    >
                        A
                    </button>
                    <button
                        onClick={() => changeFontSize(1)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-slate-600 rounded transition focus:ring-2 focus:ring-orange-500 aria-label='Increase Font Size'"
                        title={language === 'en' ? 'Increase Font Size' : 'फ़ॉन्ट आकार बढ़ाएं'}
                    >
                        A+
                    </button>
                </div>

                <div className="opacity-50">|</div>

                {/* High Contrast Toggle */}
                <button
                    onClick={() => setHighContrast(!highContrast)}
                    className="w-5 h-5 flex items-center justify-center hover:bg-slate-600 rounded transition focus:ring-2 focus:ring-orange-500"
                    title={language === 'en' ? 'High Contrast Mode' : 'उच्च कंट्रास्ट'}
                    aria-label="High Contrast Toggle"
                >
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-white to-black border border-gray-400"></div>
                </button>

                <div className="opacity-50">|</div>

                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className="hover:underline font-bold focus:ring-2 focus:ring-orange-500 px-1 rounded"
                >
                    {language === 'en' ? 'हिन्दी' : 'English'}
                </button>
            </div>

            {/* Inject High Contrast CSS Globally */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .high-contrast {
          background-color: #000 !important;
          color: #fff !important;
        }
        .high-contrast * {
          background-color: #000 !important;
          color: #fff !important;
          border-color: #fff !important;
        }
        .high-contrast a {
          color: #ffff00 !important;
          text-decoration: underline !important;
        }
      `}} />
        </div>
    );
}
