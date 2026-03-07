import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

export async function POST(req: NextRequest) {
  try {
    const { url, formatId, filesize } = await req.json();

    if (!url) {
      return new Response('URL is required', { status: 400 });
    }

    const args = [
      '-m', 'yt_dlp',
      '-o', '-', // Output to stdout
      '-f', formatId || 'best',
      url
    ];

    const proc = spawn('python', args);

    const stream = new ReadableStream({
      start(controller) {
        proc.stdout.on('data', (chunk) => controller.enqueue(chunk));
        proc.stdout.on('end', () => controller.close());
        proc.stderr.on('data', (data) => console.log(`yt-dlp stderr: ${data}`));
        proc.on('error', (err) => controller.error(err));
      },
      cancel() {
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
    return new Response(error.message, { status: 500 });
  }
}
