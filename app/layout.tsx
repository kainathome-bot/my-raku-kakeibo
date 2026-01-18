import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomNav } from '@/components/layout/BottomNav';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { AppInitProvider } from '@/components/providers/AppInitProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "家計簿",
  description: "オフライン対応 家計簿アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "家計簿",
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-20 safe-area-bottom transition-colors duration-200`}
      >
        <ThemeProvider>
          <AppInitProvider>
            <ToastProvider>
              <main className="min-h-screen">
                {children}
              </main>
              <BottomNav />
            </ToastProvider>
          </AppInitProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
