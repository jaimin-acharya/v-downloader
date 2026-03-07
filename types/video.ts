export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  duration_raw: number;
  uploader: string;
  platform: string;
  formats: VideoFormat[];
}

export interface VideoFormat {
  format_id: string;
  format_note: string;
  ext: string;
  vcodec: string;
  acodec: string;
  width?: number;
  height?: number;
  filesize?: number;
  filesize_approx?: number;
  url: string;
}
