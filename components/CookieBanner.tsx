"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";

interface Props {
  onAccept: (cookies: string) => void;
}

export default function CookieBanner({ onAccept }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner only if cookies not already saved
    const saved = localStorage.getItem("yt_cookies");
    if (!saved) setVisible(true);
  }, []);

  const handleAccept = () => {
    // Read all cookies from the browser
    const raw = document.cookie;

    if (!raw) {
      // No cookies available (browser restriction)
      setVisible(false);
      return;
    }

    // Convert to Netscape format yt-dlp understands
    const domain = window.location.hostname;
    let netscape = "# Netscape HTTP Cookie File\n";
    raw.split("; ").forEach((c) => {
      const idx = c.indexOf("=");
      if (idx > 0) {
        const name = c.substring(0, idx);
        const val = c.substring(idx + 1);
        netscape += `.${domain}\tTRUE\t/\tTRUE\t2147483647\t${name}\t${val}\n`;
      }
    });

    localStorage.setItem("yt_cookies", netscape);
    onAccept(netscape);
    setVisible(false);
  };

  const handleDecline = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-card border rounded-2xl shadow-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">Enable Session Cookies</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allows downloading age-restricted or login-required videos.
              </p>
            </div>
          </div>
          <button
            onClick={handleDecline}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl"
            onClick={handleDecline}
          >
            Decline
          </Button>
          <Button
            size="sm"
            className="flex-1 rounded-xl font-bold"
            onClick={handleAccept}
          >
            Allow Cookies
          </Button>
        </div>
      </div>
    </div>
  );
}