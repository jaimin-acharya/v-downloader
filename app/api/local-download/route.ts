import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Write cookies to /tmp once per cold start
function getCookiePath(): string | null {
  const cookies = process.env.YOUTUBE_COOKIES;
  if (!cookies) return null;

  const cookiePath = '/tmp/yt-cookies.txt';
  try {
    // Only write if not already written in this instance
    if (!existsSync(cookiePath)) {
      writeFileSync(cookiePath, cookies, 'utf-8');
    }
    return cookiePath;
  } catch (e) {
    console.error('Failed to write cookies:', e);
    return null;
  }
}

function buildYtDlpArgs(url: string, formatId?: string): string[] {
  const cookiePath = getCookiePath();

  const args = [
    '-m', 'yt_dlp',
    '-o', '-',
    // Use android client to bypass bot detection (no browser needed)
    '--extractor-args', 'youtube:player_client=android,web',
    '--no-check-certificates',
    '--no-warnings',
    // Merge into mp4 container
    '--merge-output-format', 'mp4',
    '-f', formatId || 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
  ];

  // Inject cookies if available
  if (cookiePath) {
    args.push('--cookies', cookiePath);
  }

  args.push(url);
  return args;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData);
    }
    const { url, formatId, filesize, fileName } = body;

    if (!url) {
      return new Response('URL is required', { status: 400 });
    }

    // On Vercel, proxy to /api/stream (your Python route)
    // but pass a flag so the Python route also uses cookies
    if (process.env.VERCEL) {
      const host = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
      const protocol = host?.startsWith('localhost') ? 'http' : 'https';
      const baseUrl = host?.startsWith('http') ? host : `${protocol}://${host}`;

      const response = await fetch(`${baseUrl}/api/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pass cookies flag so Python route can use them too
        body: JSON.stringify({ ...body, useCookies: !!process.env.YOUTUBE_COOKIES }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Stream failed (${response.status}): ${errText}`);
      }

      return new Response(response.body, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${fileName || 'video.mp4'}"`,
          ...(filesize ? { 'Content-Length': filesize.toString() } : {}),
        },
      });
    }

    // Local: spawn yt-dlp directly
    const args = buildYtDlpArgs(url, formatId);
    const proc = spawn('python', args);

    let isClosed = false;
    const stream = new ReadableStream({
      start(controller) {
        proc.stdout.on('data', (chunk) => {
          if (!isClosed) {
            try {
              controller.enqueue(chunk);
            } catch (e) {
              console.error('Enqueue error:', e);
            }
          }
        });

        proc.stdout.on('end', () => {
          if (!isClosed) {
            isClosed = true;
            try { controller.close(); } catch (e) { /* already closed */ }
          }
        });

        proc.stderr.on('data', (data) => {
          const message = data.toString();
          // Log all stderr for debugging, not just ERRORs
          console.error(`[yt-dlp] ${message.trim()}`);
        });

        proc.on('error', (err) => {
          if (!isClosed) {
            isClosed = true;
            controller.error(err);
          }
        });
      },
      cancel() {
        isClosed = true;
        proc.kill();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${fileName || 'video.mp4'}"`,
        ...(filesize ? { 'Content-Length': filesize.toString() } : {}),
      },
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return new Response(error.message, { status: 500 });
  }
}