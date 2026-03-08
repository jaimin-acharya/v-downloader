import os
import json
import yt_dlp
import subprocess
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://v-downloader-black.vercel.app"], # In production, replace with your Vercel URL or specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_duration(seconds):
    if not seconds: return '0:00'
    try:
        seconds = int(seconds)
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        if h > 0: return f"{h}:{m:02d}:{s:02d}"
        return f"{m}:{s:02d}"
    except:
        return '0:00'

@app.post("/api/info")
async def get_info(request: Request):
    try:
        data = await request.json()
        url = data.get('url')
        if not url:
            return JSONResponse({'error': 'URL is required'}, status_code=400)

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

            # Process formats
            formats = []
            raw_formats = info.get('formats', [])
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

            response_data = {
                'id': info.get('id'),
                'title': info.get('title'),
                'thumbnail': info.get('thumbnail'),
                'duration': format_duration(info.get('duration')),
                'duration_raw': info.get('duration'),
                'uploader': info.get('uploader'),
                'platform': info.get('extractor_key'),
                'formats': formats
            }
            return response_data

    except Exception as e:
        import traceback
        print(f"ERROR: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse({'error': str(e), 'trace': traceback.format_exc()}, status_code=500)

@app.post("/api/download")
async def download(request: Request):
    try:
        data = await request.json()
        url = data.get('url')
        format_id = data.get('formatId', 'best')

        if not url:
            return JSONResponse({'error': 'URL is required'}, status_code=400)

        # Using yt-dlp to pipe output directly to the response
        cmd = ['yt-dlp', '-f', format_id, '-o', '-', url]
        
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            bufsize=1024*64
        )

        def iterfile():
            try:
                while True:
                    chunk = process.stdout.read(1024*64)
                    if not chunk:
                        break
                    yield chunk
            finally:
                process.terminate()
                process.wait()

        return StreamingResponse(
            iterfile(), 
            media_type="video/mp4",
            headers={
                "Content-Disposition": 'attachment; filename="video.mp4"',
                "Access-Control-Expose-Headers": "Content-Length",
            }
        )

    except Exception as e:
        print(f"Download ERROR: {str(e)}")
        return JSONResponse({'error': str(e)}, status_code=500)

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
