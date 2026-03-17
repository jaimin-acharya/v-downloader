import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import os from "os";
import path from "path";
import { writeFileSync } from "fs";

// ─── Cookie helper ─────────────────────────────────────────────────────────
function getCookiePath(cookies: string): string {
  const tmpDir = os.tmpdir();
  const cookiePath = path.join(tmpDir, "yt-cookies.txt");

  try {
    writeFileSync(cookiePath, cookies, "utf-8");
    return cookiePath;
  } catch (e) {
    console.error("Failed to write cookies:", e);
    throw new Error("Could not write cookie file");
  }
}

// ─── yt-dlp args builder ───────────────────────────────────────────────────
function buildYtDlpArgs(
  url: string,
  formatId: string,
  cookiePath?: string
): string[] {
  const args = [
    "--user-agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "-f", `${formatId}/bestvideo+bestaudio/best`,
    "--merge-output-format", "mp4",
    "--no-playlist",
    "--no-part",
    "-o", "-",
  ];

  if (cookiePath) {
    args.push("--cookies", cookiePath);
  }

  args.push(url);
  return args;
}

// ─── POST handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { url, formatId = "best", title = "video", cookies } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let cookiePath: string | undefined;
    if (cookies) {
      try {
        cookiePath = getCookiePath(cookies);
      } catch {
        console.warn("Continuing without cookies");
      }
    }

    const args = buildYtDlpArgs(url, formatId, cookiePath);
    console.log("DEBUG: yt-dlp args:", args.join(" "));

    const safeTitle = title.replace(/[^a-zA-Z0-9 _\-()]/g, "").trim() || "video";

    const stream = new ReadableStream({
      start(controller) {
        let isClosed = false;

        const safeClose = () => {
          if (!isClosed) {
            isClosed = true;
            controller.close();
          }
        };

        const safeError = (err: Error) => {
          if (!isClosed) {
            isClosed = true;
            controller.error(err);
          }
        };

        const ytDlp = spawn("yt-dlp", args);

        ytDlp.stdout.on("data", (chunk: Buffer) => {
          if (!isClosed) {
            controller.enqueue(chunk);
          }
        });

        ytDlp.stderr.on("data", (data: Buffer) => {
          console.error("[yt-dlp]", data.toString());
        });

        ytDlp.on("close", (code) => {
          if (code !== 0) {
            console.error(`yt-dlp exited with code ${code}`);
          }
          safeClose();
        });

        ytDlp.on("error", (err) => {
          console.error("yt-dlp spawn error:", err);
          safeError(err);
        });
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${safeTitle}.mp4"`,
        "Access-Control-Expose-Headers": "Content-Disposition",
        "Cache-Control": "no-cache",
      },
    });

  } catch (err: any) {
    console.error("Download route error:", err);
    return NextResponse.json(
      { error: err.message || "Download failed" },
      { status: 500 }
    );
  }
}