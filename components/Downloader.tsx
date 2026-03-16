"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Search, AlertCircle, Download } from "lucide-react";
import { VideoInfo } from "@/types/video";
import axios from "axios";
import VideoPreview from "@/components/VideoPreview";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiUrl } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck, Info, UserCheck,
  Key, MousePointer2
} from "lucide-react";
import QualityTable from "./QualityTable";

// ─── URL Validation ───────────────────────────────────────────────────────────
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Downloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cookieDialogOpen, setCookieDialogOpen] = useState(false);
  const [cookieText, setCookieText] = useState("");
  const [hasCookies, setHasCookies] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Load cookies on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cookieParam = params.get("cookies");
    const hash = window.location.hash;

    let base64Cookies = "";
    if (cookieParam) base64Cookies = cookieParam;
    else if (hash.startsWith("#cookies=")) base64Cookies = hash.split("=")[1];

    if (base64Cookies) {
      try {
        const decoded = atob(base64Cookies);
        if (decoded.includes("# Netscape") || decoded.length > 100) {
          localStorage.setItem("yt_cookies", decoded);
          setCookieText(decoded);
          setHasCookies(true);
          toast.success("Session synced successfully!");
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch {
        console.error("Failed to decode cookies from URL");
      }
    }

    const saved = localStorage.getItem("yt_cookies");
    if (saved) {
      setCookieText(saved);
      setHasCookies(true);
    }

    // Focus input if hash matches
    const handleFocus = () => {
      if (window.location.hash === "#downloader") {
        inputRef.current?.focus();
      }
    };
    handleFocus();
    window.addEventListener("hashchange", handleFocus);
    return () => window.removeEventListener("hashchange", handleFocus);
  }, []);

  // ─── Fetch video info ──────────────────────────────────────────────────────
  const fetchVideoInfo = async (cookieOverride?: string) => {
    if (!url) return;

    // Validate URL before hitting backend
    if (!isValidUrl(url)) {
      setError("Please enter a valid video URL (e.g. https://youtube.com/watch?v=...)");
      return;
    }

    setLoading(true);
    setError(null);
    setVideoInfo(null);

    const cookiesToUse = cookieOverride ?? cookieText;

    try {
      const response = await axios.post(
        getApiUrl("/api/info"),
        { url, cookies: cookiesToUse || undefined },
        { timeout: 30000 } // 30s timeout
      );

      setVideoInfo(response.data);

      if (cookiesToUse) {
        localStorage.setItem("yt_cookies", cookiesToUse);
        setHasCookies(true);
      }
    } catch (err: any) {
      const message =
        err.code === "ECONNABORTED"
          ? "Request timed out. The server may be starting up — please try again."
          : err.response?.data?.error || "Failed to fetch video information.";

      const needsCookies =
        message.toLowerCase().includes("sign in") ||
        message.toLowerCase().includes("cookies") ||
        message.toLowerCase().includes("bot");

      setError(message);

      if (needsCookies) {
        setCookieDialogOpen(true);
      }

      toast.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── Save cookies ──────────────────────────────────────────────────────────
  const saveCookies = () => {
    if (!cookieText.trim()) {
      toast.error("Please paste your cookies first.");
      return;
    }
    localStorage.setItem("yt_cookies", cookieText);
    setHasCookies(true);
    setCookieDialogOpen(false);
    toast.success("Cookies saved! Retrying...");
    if (url) fetchVideoInfo(cookieText);
  };

  const clearCookies = () => {
    localStorage.removeItem("yt_cookies");
    setCookieText("");
    setHasCookies(false);
    toast.success("Session cleared.");
  };

  // ─── Bookmarklet (works for any site) ─────────────────────────────────────
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const bookmarkletCode = `javascript:(function(){
    var cookies = document.cookie;
    var domain = window.location.hostname;
    var netscape = "# Netscape HTTP Cookie File\\n";
    cookies.split("; ").forEach(function(c){
      var idx = c.indexOf("=");
      if(idx>0){
        var name=c.substring(0,idx);
        var val=c.substring(idx+1);
        netscape += "."+domain+"\\tTRUE\\t/\\tTRUE\\t2147483647\\t"+name+"\\t"+val+"\\n";
      }
    });
    window.location.href="${origin}/?cookies="+encodeURIComponent(btoa(netscape));
  })();`.replace(/\s+/g, " ");

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div id="downloader" className="w-full max-w-4xl mx-auto pb-20">

      {/* Cookie Dialog */}
      <Dialog open={cookieDialogOpen} onOpenChange={setCookieDialogOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Session Sync
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Some platforms block cloud servers. Sync your session to bypass this.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="one-click" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl h-12 bg-muted/50 p-1 mb-6">
              <TabsTrigger
                value="one-click"
                className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <MousePointer2 className="w-4 h-4 mr-2" />
                One-Click Sync
              </TabsTrigger>
              <TabsTrigger
                value="manual"
                className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Key className="w-4 h-4 mr-2" />
                Manual Paste
              </TabsTrigger>
            </TabsList>

            {/* One-click tab */}
            <TabsContent value="one-click" className="space-y-6 py-2">
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl mt-1">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">How it works</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Drag the button below to your <b>Bookmarks Bar</b>.
                      When on YouTube/Instagram/TikTok, click it to sync your session here.
                    </p>
                  </div>
                </div>
                <div className="flex justify-center py-4">
                  <a
                    href={bookmarkletCode}
                    draggable
                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-primary/20 cursor-move select-none"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info("Drag this button to your Bookmarks Bar (Ctrl+Shift+B to show it)");
                    }}
                  >
                    <ShieldCheck className="w-6 h-6" />
                    SYNC SESSION
                  </a>
                </div>
                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                  Drag the button above to your bookmarks bar
                </p>
              </div>
            </TabsContent>

            {/* Manual tab */}
            <TabsContent value="manual" className="space-y-4 py-2">
              <Textarea
                placeholder="# Netscape HTTP Cookie File..."
                className="font-mono text-xs h-64 rounded-2xl border-muted bg-muted/20"
                value={cookieText}
                onChange={(e) => setCookieText(e.target.value)}
              />
              <DialogFooter className="gap-2">
                {hasCookies && (
                  <Button
                    variant="outline"
                    onClick={clearCookies}
                    className="rounded-xl h-12 font-bold"
                  >
                    Clear Session
                  </Button>
                )}
                <Button
                  onClick={saveCookies}
                  className="flex-1 rounded-xl h-12 font-bold text-lg"
                >
                  Save & Retry
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Hero */}
      <div className="text-center space-y-4 md:space-y-6 mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight text-slate-900 dark:text-white px-4">
          Download Videos From{" "}
          <span className="text-primary italic">Any Platform</span> Instantly
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-6">
          Paste a link from YouTube, Instagram, Facebook, X, or TikTok and download instantly.
        </p>

        {/* Cookie status badge */}
        <div className="flex justify-center items-center gap-2 mb-2">
          {hasCookies ? (
            <div
              className="group flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full border border-green-500/20 cursor-pointer hover:bg-green-500/20 transition-all"
              onClick={() => setCookieDialogOpen(true)}
              title="Click to manage session"
            >
              <UserCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Session Synced
              </span>
            </div>
          ) : (
            <div
              className="group flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-full border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-all animate-pulse"
              onClick={() => setCookieDialogOpen(true)}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Sync Session (Optional)
              </span>
            </div>
          )}
        </div>

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
                  setError(null); // Clear error on new input
                }}
                onKeyDown={(e) => e.key === "Enter" && fetchVideoInfo()}
              />
              {/* Clear button */}
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
