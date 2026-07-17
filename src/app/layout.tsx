import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { WalletProvider } from "./context/wallet-context";
import { SandboxProvider } from "./context/sandbox-provider";
import { LanguageProvider } from "./context/language-context";
import { ThemeProvider } from "./context/theme-context";
import { MotionConfig } from "framer-motion";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import InstallPWA from "@/components/pwa/InstallPWA";
import DynamicThemeColor from "@/components/pwa/DynamicThemeColor";
import SovereignSplash from "@/components/pwa/SovereignSplash";
import { Providers } from "./providers";

// Preload fonts for better performance
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: true,
};

export const metadata: Metadata = {
  title: {
    default: "AxiomID - The Human Authorization Protocol",
    template: "%s | AxiomID"
  },
  description: "Prove human intent behind AI actions with decentralized identity verification. Create your sovereign AI passport with Pi Network. Built by Mohamed Abdelaziz.",
  keywords: [
    "decentralized identity",
    "human verification",
    "AI authorization",
    "blockchain identity",
    "sybil resistance",
    "trust score",
    "web3 identity",
    "Pi Network",
    "sovereign passport",
    "DID",
    "verifiable credentials",
    "agent governance",
    "AI identity",
    "digital identity",
    "self-sovereign identity"
  ],
  authors: [{ name: "Mohamed Abdelaziz", url: "https://github.com/Moeabdelaziz007" }],
  creator: "Mohamed Abdelaziz",
  publisher: "AxiomID",
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
    apple: '/icon-192x192.png',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://axiomid.app'),
  alternates: {
    canonical: '/',
    languages: {
      'en': '/',
      'ar': '/',
    },
  },
  openGraph: {
    title: "AxiomID - The Human Authorization Protocol",
    description: "Prove human intent behind AI actions with decentralized identity verification. Create your sovereign AI passport with Pi Network.",
    url: 'https://axiomid.app',
    siteName: 'AxiomID',
    images: [
      {
        url: '/axiomid-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'AxiomID - Human Authorization Protocol for AI Agents',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "AxiomID - The Human Authorization Protocol",
    description: "Prove human intent behind AI actions with decentralized identity verification. Create your sovereign AI passport with Pi Network.",
    images: ['/axiomid-banner.jpg'],
    creator: '@Moeabdelaziz007',
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
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'AxiomID',
    'mobile-web-app-capable': 'yes',
    'virtual-protocol-site-verification': '02985324a1093a757f83d0d6ea4f33b5',
  },
};

/**
 * Render the application's root HTML layout with global context providers.
 *
 * @returns The application root element.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen overflow-x-hidden`}
      >
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {/* Pi SDK loaded dynamically by loadPiSdk() in pi-sdk.ts — avoids overriding native Pi in Pi Browser */}
        <Script src="/register-sw.js" strategy="afterInteractive" />
      <ThemeProvider>
        <DynamicThemeColor />
        <SovereignSplash />
        <LanguageProvider>
          <SandboxProvider>
            <WalletProvider>

                <Providers>
                  <MotionConfig reducedMotion="user">
                    {children}
                  </MotionConfig>
                </Providers>
              </WalletProvider>
            </SandboxProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
         <Toaster
           theme="dark"
           position="bottom-right"
           toastOptions={{
             style: {
               background: "rgba(255,255,255,0.05)",
               border: "1px solid rgba(255,255,255,0.1)",
               backdropFilter: "blur(12px)",
               color: "#fafafa",
               fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
               fontSize: "0.8rem",
             },
           }}
         />
          <InstallPWA />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "AxiomID",
                "url": "https://axiomid.app",
                "description": "Prove human intent behind AI actions with decentralized identity verification. Create your sovereign AI passport with Pi Network.",
                "applicationCategory": "IdentityApplication",
                "operatingSystem": "Web",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                },
                "creator": {
                  "@type": "Person",
                  "name": "Mohamed Abdelaziz",
                  "url": "https://github.com/Moeabdelaziz007"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "AxiomID",
                  "url": "https://axiomid.app"
                },
                "sameAs": [
                  "https://github.com/Moeabdelaziz007/AxiomID",
                  "https://minepi.com"
                ],
                "featureList": [
                  "Decentralized Identity (DID)",
                  "Sovereign Passports",
                  "Trust Score Verification",
                  "AI Agent Governance",
                  "Pi Network Authentication",
                  "Verifiable Credentials"
                ]
              })
            }}
          />
       </body>
     </html>

  );
}
