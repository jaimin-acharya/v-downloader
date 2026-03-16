"use client";

import { VideoFormat, VideoInfo } from "@/types/video";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Download, Music, Video,
  Zap, Timer, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useState, useRef, useEffect, JSX } from "react";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";
import React from "react";

interface Props {
  info: VideoInfo;
  url: string;
}

interface DownloadState {
  formatId: string;
  progress: number;        // 0–100
  speed: string;           // e.g. "1.2 MB/s"
  eta: string;             // e.g. "00:32"
  loaded: number;          // bytes downloaded so far
  total: number;           // total bytes (0 if unknown)
  status: "downloading" | "done" | "error";
  errorMsg?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "Unknown";
  if (bytes >= 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  if (bytes >= 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / 1024).toFixed(0) + " KB";
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1024 * 1024)
    return (bytesPerSec / (1024 * 1024)).toFixed(1) + " MB/s";
  return (bytesPerSec / 1024).toFixed(0) + " KB/s";
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9 _\-().]/g, "").trim() || "video";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function QualityTable({ info, url }: Props): React.ReactNode {
  const [dlState, setDlState] = useState<DownloadState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const cancelDownload = () => {
    abortRef.current?.abort();
    setDlState(null);
    toast.info("Download cancelled.");
  };

  const handleDownload = async (format: VideoFormat) => {
    const isAudioOnly = format.vcodec === "none";
    const savedCookies =
      typeof window !== "undefined"
        ? localStorage.getItem("yt_cookies") ?? undefined
        : undefined;

    const formatId = format.format_id;

    setDlState({
      formatId: format.format_id,
      progress: 0,
      speed: "",
      eta: "",
      loaded: 0,
      total: format.filesize || format.filesize_approx || 0,
      status: "downloading",
    });

    try {
      abortRef.current = new AbortController();
      toast.info("Starting download...");

      const res = await fetch(getApiUrl("/api/download"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          formatId,
          title: info.title,
          cookies: savedCookies,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Download failed");

      const reader = res.body?.getReader();
      const contentLengthHeader = res.headers.get("Content-Length");
      const contentLength = contentLengthHeader ? Number(contentLengthHeader) : (format.filesize || format.filesize_approx || 0);

      if (!reader) throw new Error("Could not start stream");

      let receivedLength = 0;
      let chunks = [];
      let startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (contentLength && contentLength > 0) {
          const currentProgress = (receivedLength / contentLength) * 100;
          const elapsedTime = (Date.now() - startTime) / 1000;
          const currentSpeed = elapsedTime > 0 ? receivedLength / elapsedTime : 0;

          const remainingBytes = contentLength - receivedLength;
          const remainingTime = currentSpeed > 0 ? remainingBytes / currentSpeed : 0;

          setDlState(prev => prev ? {
            ...prev,
            progress: Math.min(currentProgress, 99.9),
            speed: formatSpeed(currentSpeed),
            eta: formatEta(remainingTime),
            loaded: receivedLength,
            total: contentLength
          } : prev);
        } else {
          // indeterminate progress
          const elapsedTime = (Date.now() - startTime) / 1000;
          const currentSpeed = elapsedTime > 0 ? receivedLength / elapsedTime : 0;

          setDlState(prev => prev ? {
            ...prev,
            progress: -1,
            speed: formatSpeed(currentSpeed),
            eta: "--:--",
            loaded: receivedLength,
            total: 0
          } : prev);
        }
      }

      const blob = new Blob(chunks);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${sanitizeFilename(info.title)}.${format.ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);

      setDlState(prev => prev ? {
        ...prev,
        progress: 100,
        status: "done",
      } : prev);
      toast.success("Download complete!");

    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Handled by cancelDownload usually
      } else {
        toast.error("Failed to download video. Please try again.");
        setDlState(prev => prev ? {
          ...prev,
          status: "error",
          errorMsg: err.message || "Failed to download",
        } : prev);
      }
    } finally {
      setTimeout(() => {
        setDlState(prev => prev && prev.status === "done" ? null : prev);
      }, 5000);
    }
  };
  // Use clean formats from new backend (label field)
  const filteredFormats = info.formats
    .filter((f) => f.vcodec !== "none" || f.acodec !== "none")
    .sort((a, b) => (b.height || 0) - (a.height || 0))
    .slice(0, 10);

  const isDownloading =
    dlState?.status === "downloading";
  const isDone =
    dlState?.status === "done";
  const isError =
    dlState?.status === "error";

  return (
    <div className="space-y-6">

      {/* ── Download Progress Card ── */}
      {dlState && (
        <div className="bg-card rounded-3xl p-6 shadow-2xl border-none animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              {isDone && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {isDownloading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
              {isError && <AlertCircle className="w-5 h-5 text-destructive" />}
              {isDone
                ? "Download Complete"
                : isError
                  ? "Download Failed"
                  : "Downloading..."}
            </h3>
            {isDownloading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelDownload}
                className="text-muted-foreground hover:text-destructive"
              >
                Cancel
              </Button>
            )}
            {(isDone || isError) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDlState(null)}
                className="text-muted-foreground"
              >
                Dismiss
              </Button>
            )}
          </div>

          {isError ? (
            <p className="text-sm text-destructive">{dlState.errorMsg}</p>
          ) : (
            <>
              <Progress
                value={dlState.progress < 0 ? undefined : dlState.progress}
                className="h-3 mb-4"
              />
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                    Progress
                  </span>
                  <span className="text-sm font-mono">
                    {dlState.progress < 0
                      ? `${formatSize(dlState.loaded)}`
                      : `${dlState.progress.toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                    Speed
                  </span>
                  <span className="text-sm font-mono flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {isDone ? "---" : dlState.speed}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                    ETA
                  </span>
                  <span className="text-sm font-mono flex items-center gap-1">
                    <Timer className="w-3 h-3 text-blue-500" />
                    {isDone ? "---" : dlState.eta}
                  </span>
                </div>
              </div>
              {dlState.total > 0 && (
                <p className="text-xs text-muted-foreground mt-3 text-right font-mono">
                  {formatSize(dlState.loaded)} / {formatSize(dlState.total)}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Format Table ── */}
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl border-none">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Download Options
        </h3>
        <div className="overflow-x-auto -mx-2 sm:-mx-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-muted">
                <TableHead className="w-[45%]">Quality</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFormats.map((format) => {
                const isThisDownloading =
                  dlState?.formatId === format.format_id &&
                  isDownloading;

                // Support both old (format_note) and new (label) backend fields
                const qualityLabel =
                  (format as any).label ||
                  format.format_note ||
                  (format.height ? `${format.height}p` : "Audio");

                const isAudio = format.vcodec === "none";

                return (
                  <TableRow
                    key={format.format_id}
                    className="group transition-colors hover:bg-muted/50 border-muted"
                  >
                    <TableCell className="font-medium p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={`p-1.5 sm:p-2 rounded-lg ${!isAudio
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                            : "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                            }`}
                        >
                          {!isAudio ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <Music className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm sm:text-base truncate">
                            {qualityLabel}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase font-mono">
                            {!isAudio ? "Video + Audio" : "Audio Only"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                        {format.ext}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                      {formatSize(
                        (format as any).filesize ||
                        (format as any).filesize_approx
                      )}
                    </TableCell>
                    <TableCell className="text-right p-3 sm:p-4">
                      <Button
                        size="sm"
                        className="rounded-xl group-hover:scale-105 transition-transform font-bold"
                        onClick={() => handleDownload(format)}
                        disabled={isDownloading}
                      >
                        {isThisDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Download</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
