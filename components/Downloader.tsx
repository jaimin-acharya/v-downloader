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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Info, UserCheck, Key, MousePointer2 } from "lucide-react";

export default function Downloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cookieDialogOpen, setCookieDialogOpen] = useState(false);
  const [cookieText, setCookieText] = useState("");
  const [hasCookies, setHasCookies] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check for cookies in URL hash (from bookmarklet)
    const hash = window.location.hash;
    if (hash.startsWith("#cookies=")) {
      try {
        const base64Cookies = hash.split("=")[1];
        const decodedCookies = atob(base64Cookies);
        if (decodedCookies.includes("# Netscape") || decodedCookies.includes("VISITOR_INFO1_LIVE")) {
          localStorage.setItem("yt_cookies", decodedCookies);
          setCookieText(decodedCookies);
          setHasCookies(true);
          toast.success("YouTube session synced successfully!");
          // Clean up URL
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      } catch (e) {
        console.error("Failed to parse cookies from hash", e);
      }
    }

    // Load cookies from local storage if they exist
    const savedCookies = localStorage.getItem("yt_cookies");
    if (savedCookies) {
      setCookieText(savedCookies);
      setHasCookies(true);
    }

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
        setHasCookies(true);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to fetch video information.";

      if (message.includes("Sign in") || message.includes("cookies")) {
        setError("YouTube is blocking this server. Please sync your session using the key icon.");
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
    setHasCookies(true);
    setCookieDialogOpen(false);
    toast.success("Cookies saved! Try downloading again.");
    if (url) fetchVideoInfo(cookieText);
  };

  const bookmarkletCode = `javascript:(function(){
    var cookies = document.cookie;
    var target = window.location.origin + window.location.pathname;
    var netscapeContent = "# Netscape HTTP Cookie File\\n";
    var cookieLines = cookies.split("; ");
    for(var i=0; i<cookieLines.length; i++) {
        var part = cookieLines[i].split("=");
        if(part.length >= 2) {
            netscapeContent += ".youtube.com\\tTRUE\\t/\\tTRUE\\t2147483647\\t" + part[0] + "\\t" + part.slice(1).join("=") + "\\n";
        }
    }
    window.location.href = "${typeof window !== 'undefined' ? window.location.origin : ''}/#cookies=" + btoa(netscapeContent);
  })();`.replace(/\s+/g, ' ');

  return (
    <div id="downloader" className="w-full max-w-4xl mx-auto pb-20">
      {/* Cookie Manager Dialog */}
      <Dialog open={cookieDialogOpen} onOpenChange={setCookieDialogOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-background">
          <div className="h-2 bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600"></div>

          <div className="p-8">
            <DialogHeader className="mb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20">
                    <ShieldCheck className="w-10 h-10 text-red-600" />
                  </div>
                </div>
              </div>
              <DialogTitle className="text-3xl sm:text-4xl font-black text-center tracking-tight">
                Sync YouTube
              </DialogTitle>
              <DialogDescription className="text-center text-lg mt-2 text-muted-foreground">
                Activate high-speed downloads & bypass restriction in one tap.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { step: 1, text: "Drag to Toolbar" },
                  { step: 2, text: "Open YouTube" },
                  { step: 3, text: "Click Bookmark" }
                ].map((item) => (
                  <div key={item.step} className="p-4 bg-muted/30 rounded-3xl border border-muted text-center space-y-2 group hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center mx-auto text-xs font-black border shadow-sm group-hover:scale-110 transition-transform">
                      {item.step}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                <a
                  href={bookmarkletCode}
                  className="relative flex items-center justify-center gap-4 w-full py-6 bg-slate-950 text-white rounded-[1.8rem] font-black text-xl shadow-2xl cursor-move transition-all active:scale-95 group-hover:bg-slate-900"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Hold and DRAG this button to your Bookmarks Bar (Ctrl+Shift+B)!");
                  }}
                >
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <ShieldCheck className="w-6 h-6 text-red-500" />
                  </div>
                  CONNECT YOUTUBE
                </a>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  We only sync your session for the downloader. Your personal data is never stored outside this session.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-6 border-t border-muted/50 flex items-center justify-between">
            <button
              className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              onClick={() => {
                const manual = prompt("Paste your cookies.txt content here:");
                if (manual) {
                  setCookieText(manual);
                  saveCookies();
                }
              }}
            >
              <Key className="w-3 h-3" />
              Manual Sync
            </button>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setCookieDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="text-center space-y-4 md:space-y-6 mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight text-slate-900 dark:text-white px-4">
          Download Videos From <span className="text-primary italic">Any Platform</span> Instantly
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-6">
          Paste a link from YouTube, Instagram, Facebook, X, or TikTok and download instantly.
        </p>

        <div className="flex justify-center items-center gap-2 mb-2">
          {hasCookies ? (
            <div
              className="group flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full border border-green-500/20 cursor-pointer hover:bg-green-500/20 transition-all"
              onClick={() => setCookieDialogOpen(true)}
            >
              <UserCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">YouTube Session Synced</span>
            </div>
          ) : (
            <div
              className="group flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-full border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-all animate-pulse"
              onClick={() => setCookieDialogOpen(true)}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Sync YouTube Session</span>
            </div>
          )}
        </div>

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
