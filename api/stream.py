from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import yt_dlp
import os
import subprocess

app = FastAPI()

class DownloadRequest(BaseModel):
    url: str
    formatId: str = 'best'

@app.post("/api/download")
async def download_video(request: DownloadRequest):
    url = request.url
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    def iterfile():
        # Setup yt-dlp to write to stdout
        ydl_opts = {
            'format': request.formatId,
            'outtmpl': '-', # stdout
            'quiet': True,
            'no_warnings': True,
            'noprogress': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # We need to capture the output stream
            # yt-dlp doesn't have a direct "stream to generator" in the library easily
            # But we can use subprocess to pipe it
            cmd = ['python3', '-m', 'yt_dlp', '-f', request.formatId, '-o', '-', url]
            # On Vercel python3 is available
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            while True:
                chunk = process.stdout.read(1024 * 64) # 64kb chunks
                if not chunk:
                    break
                yield chunk
            
            process.stdout.close()
            process.wait()

    return StreamingResponse(
        iterfile(),
        media_type="video/mp4",
        headers={"Content-Disposition": 'attachment; filename="video.mp4"'}
    )
