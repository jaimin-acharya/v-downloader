import { exec } from 'child_process';
import { promisify } from 'util';
import { VideoInfo, VideoFormat } from '../types/video';

const execAsync = promisify(exec);

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  // If we're on Vercel, we attempt to use the Python-based extraction API
  // Vercel doesn't have Python in the Node.js runtime, so we use a separate Python function
  if (process.env.VERCEL) {
    let errorDetail = '';
    try {
      const host = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'v-downloader-black.vercel.app';
      const protocol = host.startsWith('localhost') ? 'http' : 'https';
      const baseUrl = host.startsWith('http') ? host : `${protocol}://${host}`;

      console.log(`Vercel mode: fetching info from ${baseUrl}/api/extract`);

      const response = await fetch(`${baseUrl}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorText = await response.text();
        errorDetail = `API responded with ${response.status}: ${errorText}`;
        console.error('Vercel API error:', errorDetail);
      }
    } catch (error: any) {
      errorDetail = error.message;
      console.error('Vercel extraction fetch failed:', error);
    }

    // On Vercel, we can't fall back to local exec because python isn't installed in Node runtime
    throw new Error(`Cloud extraction failed: ${errorDetail || 'Check Vercel logs'}`);
  }

  try {
    // Local development fallback
    // -j for JSON output, --dump-json to just get info without downloading
    const { stdout } = await execAsync(`python -m yt_dlp -j "${url}"`);
    const data = JSON.parse(stdout);

    const formats: VideoFormat[] = data.formats
      .filter((f: any) => f.vcodec !== 'none' || f.acodec !== 'none')
      .map((f: any) => ({
        format_id: f.format_id,
        format_note: f.format_note || '',
        ext: f.ext,
        vcodec: f.vcodec,
        acodec: f.acodec,
        width: f.width,
        height: f.height,
        filesize: f.filesize,
        filesize_approx: f.filesize_approx,
        url: f.url,
      }));

    return {
      id: data.id,
      title: data.title,
      thumbnail: data.thumbnail,
      duration: formatDuration(data.duration),
      duration_raw: data.duration,
      uploader: data.uploader,
      platform: data.extractor_key,
      formats: formats,
    };
  } catch (error: any) {
    console.error('Error fetching video info:', error);
    const detail = error.stderr || error.message;
    throw new Error(`Failed to fetch video information: ${detail}`);
  }
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
