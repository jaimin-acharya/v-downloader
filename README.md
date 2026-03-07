# 🎥 V-Downloader

A premium, production-ready video downloader built with **Next.js 15**, **Tailwind CSS**, and **yt-dlp**. Download high-quality videos and audio from YouTube, Instagram, Facebook, X (Twitter), TikTok, and more with just a few clicks.

![V-Downloader Preview](https://placehold.co/1200x600/0f172a/ffffff?text=V-Downloader)

## ✨ Features

- **🚀 High-Speed Downloads**: Powered by `yt-dlp` for the fastest extraction and streaming.
- **📱 Responsive UI**: Fully optimized for mobile, tablet, and desktop experiences.
- **🕒 Real-time Progress**: Track your download percentage, speed, and ETA in real-time.
- **🎨 Modern Design**: Sleek SaaS-style interface with dark mode support, glassmorphism, and smooth animations.
- **💎 Quality Selection**: Choose from various video resolutions (4K, 1080p, 720p) or extract high-quality MP3 audio.
- **🛡️ Privacy Focused**: Zero tracking and no storage of user download history.
- **🔗 Multi-Platform Support**:
  - YouTube (Shorts & Long-form)
  - Instagram (Reels & Videos)
  - Facebook
  - X (formerly Twitter)
  - TikTok (No Watermark)
  - Vimeo & more!

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend API**: Next.js API Routes (Node.js)
- **Engine**: [yt-dlp](https://github.com/yt-dlp/yt-dlp) (Python-based)
- **Notifications**: [Sonner](https://sonner.stevenly.me/) (Toast)

## 🚀 Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Python 3.x](https://www.python.org/) (required for yt-dlp)
- [FFmpeg](https://ffmpeg.org/) (optional, for advanced merging)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jaimin-acharya/video-downloader.git
   cd next-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install yt-dlp:**
   ```bash
   pip install yt-dlp
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```text
/app
  /api
    /download  # Handles file streaming
    /info      # Fetches video metadata
  /privacy     # Privacy Policy
  /terms       # Terms of Service
  /dmca        # DMCA page
/components
  Downloader.tsx    # Main interaction logic
  QualityTable.tsx  # Format selection & progress
  HowItWorks.tsx    # Visual steps
  VideoPreview.tsx  # Dynamic metadata card
/lib
  downloader.ts     # Core yt-dlp wrapper
/types
  video.ts          # TypeScript interfaces
```

## 📄 Legal

This software is for educational purposes and personal use only. Please respect the copyrights of content creators. Check our [DMCA](/dmca) and [Terms of Service](/terms) for more details.

---

**Engineered by [Jaimin Acharya](https://github.com/jaimin-acharya)**. If you like this project, feel free to give it a ⭐!
