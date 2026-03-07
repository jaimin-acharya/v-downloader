import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Universal Video Downloader - Download from YouTube, Instagram, Facebook",
  description: "Free online video downloader. Download videos from YouTube, Instagram, Facebook, X, and TikTok instantly in HD or 4K.",
  keywords: ["video downloader", "youtube downloader", "instagram downloader", "facebook downloader", "tiktok downloader", "free downloader"],
};

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", fontSans.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
