"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Search, AlertCircle, Download } from "lucide-react";
import { VideoInfo } from "@/types/video";
import axios from "axios";
import VideoPreview from "@/components/VideoPreview";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiUrl } from "@/lib/api";
import QualityTable from "@/components/QualityTable";

// ─── URL Validation ────────────────────────────────────────────────────────────
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Downloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch video info ──────────────────────────────────────────────────────
  const fetchVideoInfo = async () => {
    if (!url) return;

    if (!isValidUrl(url)) {
      setError("Please enter a valid video URL (e.g. https://youtube.com/watch?v=...)");
      return;
    }

    setLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const response = await axios.post(
        getApiUrl("/api/info"),
        { url },
        { timeout: 30000 }
      );

      setVideoInfo(response.data);
    } catch (err: any) {
      const message =
        err.code === "ECONNABORTED"
          ? "Request timed out. The server may be starting up — please try again."
          : err.response?.data?.error || "Failed to fetch video information.";

      setError(message);
      toast.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div id="downloader" className="w-full max-w-4xl mx-auto pb-20">

      {/* Hero */}
      <div className="text-center space-y-4 md:space-y-6 mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight text-slate-900 dark:text-white px-4">
          Download Videos From{" "}
          <span className="text-primary italic">Any Platform</span> Instantly
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-6">
          Paste a link from YouTube, Instagram, Facebook, X, or TikTok and download instantly.
        </p>

        {/* Search bar */}
        <div className="relative max-w-2xl mx-auto group px-4">
          <div className="absolute inset-x-4 inset-y-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative flex gap-2 p-1.5 sm:p-2 bg-background border rounded-2xl shadow-2xl">
            <div className="flex-1 flex items-center px-2 sm:px-4">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mr-2 sm:mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="url"
                placeholder="Paste video link here..."
                className="w-full bg-transparent border-none focus:ring-0 outline-none h-10 sm:h-12 text-sm sm:text-lg"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && fetchVideoInfo()}
              />
              {url && (
                <button
                  onClick={() => { setUrl(""); setVideoInfo(null); setError(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
            <Button
              size="lg"
              className="px-4 sm:px-8 rounded-xl h-10 sm:h-12 text-sm sm:text-base font-bold"
              onClick={() => fetchVideoInfo()}
              disabled={loading || !url}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Download</span>
                  <Download className="sm:hidden w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-8 text-destructive bg-destructive/10 rounded-2xl border border-destructive/20 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !videoInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 max-w-4xl mx-auto">
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="aspect-video w-full rounded-3xl" />
            <div className="p-6 bg-card rounded-3xl border space-y-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="bg-card rounded-3xl p-6 border space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-9 w-24 rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {videoInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="lg:col-span-4">
            <VideoPreview
              title={videoInfo.title}
              thumbnail={videoInfo.thumbnail}
              duration={videoInfo.duration}
              platform={videoInfo.platform}
            />
          </div>
          <div className="lg:col-span-6">
            <QualityTable info={videoInfo} url={url} />
          </div>
        </div>
      )}
    </div>
  );
}