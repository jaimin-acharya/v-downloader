from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import yt_dlp
import json

app = FastAPI()

class VideoRequest(BaseModel):
    url: str

def format_duration(seconds):
    if not seconds:
        return '0:00'
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"

@app.post("/api/info")
async def get_info(request: VideoRequest):
    url = request.url
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'skip_download': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if not info:
                raise Exception("yt-dlp returned no information")

            # Process formats to match the expected frontend structure
            formats = []
            raw_formats = info.get('formats', [])
            if not raw_formats:
                raw_formats = [info]

            for f in raw_formats:
                if f.get('vcodec') != 'none' or f.get('acodec') != 'none':
                    formats.append({
                        'format_id': f.get('format_id'),
                        'format_note': f.get('format_note', ''),
                        'ext': f.get('ext'),
                        'vcodec': f.get('vcodec'),
                        'acodec': f.get('acodec'),
                        'width': f.get('width'),
                        'height': f.get('height'),
                        'filesize': f.get('filesize'),
                        'filesize_approx': f.get('filesize_approx'),
                        'url': f.get('url')
                    })

            return {
                'id': info.get('id'),
                'title': info.get('title'),
                'thumbnail': info.get('thumbnail'),
                'duration': format_duration(info.get('duration')),
                'duration_raw': info.get('duration'),
                'uploader': info.get('uploader'),
                'platform': info.get('extractor_key'),
                'formats': formats
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
