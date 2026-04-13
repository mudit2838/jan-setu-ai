'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: string) => string;
}

const translations = {
    en: {
        'brand': 'Bharat JanSetu',
        'citizen_panel': 'Citizen Panel',
        'my_grievances': 'My Grievances',
        'report_issue': 'Report Issue',
        'log_out': 'Log Out',
        'track_status': 'Track the status of your reported civic issues.',
        'no_grievances': 'No Grievances Found',
        'report_now': 'Report an Issue Now',
        'report_title': 'Report a Civic Issue',
        'report_desc': 'Our AI will automatically categorize and route your problem to the correct Department.',
        'issue_title': 'Issue Title *',
        'issue_title_placeholder': 'e.g., Broken water pipe causing flooding',
        'detailed_desc': 'Detailed Description *',
        'detailed_desc_placeholder': 'Please describe the issue in detail...',
        'upload_evidence': 'Upload Photo Evidence (Optional)',
        'capture_location': 'Capture My Location',
        'submit_ai': 'Submit Grievance to AI System',

        // Timeline & Status
        'submitted_ai': 'Submitted & AI Categorized',
        'local_review': 'Local Authority Review',
        'district_review': 'District Authority Review',
        'state_review': 'State Command Review',
        'issue_resolved': 'Issue Resolved',
        'pending_verification': 'Pending Citizen Verification'
    },
    hi: {
        'brand': 'भारत जनसेतु',
        'citizen_panel': 'नागरिक पैनल',
        'my_grievances': 'मेरी शिकायतें',
        'report_issue': 'समस्या दर्ज करें',
        'log_out': 'लॉग आउट',
        'track_status': 'अपनी दर्ज की गई नागरिक समस्याओं की स्थिति ट्रैक करें।',
        'no_grievances': 'कोई शिकायत नहीं मिली',
        'report_now': 'अभी समस्या दर्ज करें',
        'report_title': 'नागरिक समस्या दर्ज करें',
        'report_desc': 'हमारा AI स्वचालित रूप से आपकी समस्या को श्रेणीबद्ध करेगा और सही विभाग को भेजेगा।',
        'issue_title': 'समस्या का शीर्षक *',
        'issue_title_placeholder': 'जैसे, टूटी पानी की पाइप के कारण जलभराव',
        'detailed_desc': 'विस्तृत विवरण *',
        'detailed_desc_placeholder': 'कृपया समस्या का विस्तार से वर्णन करें...',
        'upload_evidence': 'फोटो साक्ष्य अपलोड करें (वैकल्पिक)',
        'capture_location': 'मेरा स्थान कैप्चर करें',
        'submit_ai': 'AI सिस्टम में शिकायत दर्ज करें',

        // Timeline & Status
        'submitted_ai': 'AI द्वारा वर्गीकृत और दर्ज',
        'local_review': 'स्थानीय प्राधिकरण समीक्षा',
        'district_review': 'जिला प्राधिकरण समीक्षा',
        'state_review': 'राज्य कमान समीक्षा',
        'issue_resolved': 'समस्या हल हो गई',
        'pending_verification': 'नागरिक सत्यापन लंबित'
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const storedLang = localStorage.getItem('janSetuLang') as Language;
        if (storedLang && (storedLang === 'en' || storedLang === 'hi')) {
            setLanguage(storedLang);
        }
    }, []);

    const toggleLanguage = () => {
        setLanguage((prev) => {
            const next = prev === 'en' ? 'hi' : 'en';
            localStorage.setItem('janSetuLang', next);
            return next;
        });
    };

    const t = (key: string): string => {
        // @ts-ignore
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
