import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, formatId, filesize } = body;

    if (!url) {
      return new Response('URL is required', { status: 400 });
    }

    // If on Vercel, we must use our Python helper as Node lacks Python/yt-dlp
    if (process.env.VERCEL) {
      const host = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
      const protocol = host?.startsWith('localhost') ? 'http' : 'https';
      const baseUrl = host?.startsWith('http') ? host : `${protocol}://${host}`;

      const response = await fetch(`${baseUrl}/api/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Python stream failed with status ${response.status}`);
      }

      return new Response(response.body, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': 'attachment; filename="video.mp4"',
          ...(filesize ? { 'Content-Length': filesize.toString() } : {}),
        },
      });
    }

    const args = [
      '-m', 'yt_dlp',
      '-o', '-', // Output to stdout
      '-f', formatId || 'best',
      url
    ];

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
            try {
              controller.close();
            } catch (e) {
              console.error('Close error:', e);
            }
          }
        });

        proc.stderr.on('data', (data) => {
          const message = data.toString();
          if (message.includes('ERROR:')) {
            console.error(`yt-dlp error: ${message}`);
          }
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

    const headers: Record<string, string> = {
      'Content-Type': 'video/mp4',
      'Content-Disposition': 'attachment; filename="video.mp4"',
    };

    if (filesize) {
      headers['Content-Length'] = filesize.toString();
    }

    return new Response(stream, { headers });
  } catch (error: any) {
    console.error('Download error:', error);
    return new Response(error.message, { status: 500 });
  }
}
