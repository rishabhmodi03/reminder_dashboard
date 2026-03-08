import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "@/components/Navigation";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FirebaseProvider } from "@/components/FirebaseProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpacedRep - Spaced Repetition",
  description: "Stay consistent with your learning and log your daily progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 flex min-h-screen selection:bg-blue-500/30 font-sans`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <FirebaseProvider>
            <Navigation />
            <main className="flex-1 ml-64 min-h-screen">
              <div className="max-w-7xl mx-auto px-10 py-12">
                {children}
              </div>
            </main>
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
