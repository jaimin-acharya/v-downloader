"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, AlertCircle, Download } from "lucide-react";
import { VideoInfo } from "@/types/video";
import axios from "axios";
import VideoPreview from "@/components/VideoPreview";
import QualityTable from "@/components/QualityTable";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

import { getApiUrl } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function Downloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cookieDialogOpen, setCookieDialogOpen] = useState(false);
  const [cookieText, setCookieText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load cookies from local storage if they exist
    const savedCookies = localStorage.getItem("yt_cookies");
    if (savedCookies) setCookieText(savedCookies);

    const handleFocus = () => {
      if (window.location.hash === "#downloader") {
        inputRef.current?.focus();
      }
    };

    // Initial check
    handleFocus();

    // Listen for hash changes
    window.addEventListener("hashchange", handleFocus);
    return () => window.removeEventListener("hashchange", handleFocus);
  }, []);

  const fetchVideoInfo = async (cookieOverride?: string) => {
    if (!url) return;

    setLoading(true);
    setError(null);
    setVideoInfo(null);

    const cookiesToUse = cookieOverride || cookieText;

    try {
      const response = await axios.post(getApiUrl("/api/info"), {
        url,
        cookies: cookiesToUse
      });
      setVideoInfo(response.data);
      if (cookiesToUse) {
        localStorage.setItem("yt_cookies", cookiesToUse);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to fetch video information.";

      if (message.includes("Sign in") || message.includes("cookies")) {
        setError("YouTube is asking for authentication. Please click the cookie icon below to provide your YouTube cookies.");
        setCookieDialogOpen(true);
      } else {
        setError(message);
      }
      toast.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const saveCookies = () => {
    localStorage.setItem("yt_cookies", cookieText);
    setCookieDialogOpen(false);
    toast.success("Cookies saved! Try downloading again.");
    if (url) fetchVideoInfo(cookieText);
  };

  return (
    <div id="downloader" className="w-full max-w-4xl mx-auto pb-20">
      {/* Cookie Manager Dialog */}
      <Dialog open={cookieDialogOpen} onOpenChange={setCookieDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>YouTube Authentication</DialogTitle>
            <DialogDescription>
              YouTube blocks cloud servers. To bypass this, paste your browser cookies in Netscape format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="# Netscape HTTP Cookie File..."
              className="font-mono text-xs h-64"
              value={cookieText}
              onChange={(e) => setCookieText(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Use the "Get cookies.txt LOCALLY" extension to export your cookies.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={saveCookies} className="w-full">Save and Retry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="text-center space-y-4 md:space-y-6 mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight text-slate-900 dark:text-white px-4">
          Download Videos From <span className="text-primary italic">Any Platform</span> Instantly
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-6">
          Paste a link from YouTube, Instagram, Facebook, X, or TikTok and download instantly.
        </p>

        <div className="relative max-w-2xl mx-auto group px-4">
          <div className="absolute inset-x-4 inset-y-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative flex gap-2 p-1.5 sm:p-2 bg-background border rounded-2xl shadow-2xl">
            <div className="flex-1 flex items-center px-2 sm:px-4">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mr-2 sm:mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Paste video link here..."
                className="w-full bg-transparent border-none focus:ring-0 outline-none h-10 sm:h-12 text-sm sm:text-lg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchVideoInfo()}
              />
            </div>
            <Button
              size="lg"
              className="px-4 sm:px-8 rounded-xl bg-primary hover:from-indigo-700 hover:to-purple-700 h-10 sm:h-12 text-sm sm:text-base font-bold"
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

      {error && (
        <div className="flex items-center gap-3 p-4 mb-8 text-destructive bg-destructive/10 rounded-2xl border border-destructive/20 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

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
