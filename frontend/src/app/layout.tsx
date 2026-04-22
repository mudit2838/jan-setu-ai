import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import GovTopBar from "@/components/GovTopBar";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#f97316",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Bharat JanSetu | AI-Powered Civic Grievance Redressal System",
    template: "%s | Bharat JanSetu",
  },
  description: "Official public grievance portal for the Government of India, powered by AI routing, GIS tracking, and automated workflows.",
  manifest: "/manifest.json",
  keywords: "grievance, civic, complaints, municipal, AI, government portal, jan setu, citizen services, india, govt, resolution",
  authors: [{ name: "National Informatics Centre (NIC)" }],
  creator: "GovTech AI Division",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://bharatjansetu.in",
    siteName: "Bharat JanSetu",
    title: "Bharat JanSetu | AI-Powered Civic Grievance Redressal System",
    description: "Official public grievance portal for the Government of India, powered by AI routing, GIS tracking, and automated workflows.",
    images: [
      {
        url: "/globe.svg",
        width: 1200,
        height: 630,
        alt: "Bharat JanSetu Hero Visual",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bharat JanSetu | AI-Powered Civic Grievance Redressal System",
    description: "Official public grievance portal for the Government of India.",
    images: ["/globe.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#334155',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                fontWeight: '500'
              },
            }}
          />
          <div className="flex flex-col min-h-screen">
            <GovTopBar />
            <Navbar />
            <main className="flex-1 w-full pt-16" id="main-content">
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
