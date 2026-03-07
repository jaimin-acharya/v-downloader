import { exec } from 'child_process';
import { promisify } from 'util';
import { VideoInfo, VideoFormat } from '../types/video';

const execAsync = promisify(exec);

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  try {
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
