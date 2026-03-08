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
    allow_origins=[
        "https://v-downloader-black.vercel.app",
        "https://v-downloader-jaimin-acharyas-projects.vercel.app", # Vercel preview domain
        "http://localhost:3000", # Local for testing
        "*" # Fallback
    ],
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
    print(f"REQUEST RECEIVED: {request.method} {request.url}")
    try:
        data = await request.json()
        url = data.get('url')
        client_cookies = data.get('cookies')
        print(f"DEBUG: Process URL: {url}")
        print(f"DEBUG: Client cookies provided: {bool(client_cookies)}")
        
        if not url:
            return JSONResponse({'error': 'URL is required'}, status_code=400)

        # Get absolute path to cookies.txt in the same directory as main.py
        current_dir = os.path.dirname(os.path.abspath(__file__))
        cookie_path = os.path.join(current_dir, 'cookies.txt')
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'skip_download': True,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        }
        
        # Priority 1: Handle client-side cookies (Netscape format string)
        if client_cookies:
            print("DEBUG: Using client-provided cookies")
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as tmp:
                tmp.write(client_cookies)
                tmp_path = tmp.name
            ydl_opts['cookiefile'] = tmp_path
        # Priority 2: Use server-side local cookies.txt
        elif os.path.exists(cookie_path):
            print(f"DEBUG: Found server cookies at {cookie_path}")
            ydl_opts['cookiefile'] = cookie_path
        else:
            print(f"DEBUG: No cookies found")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
            except Exception as e:
                # If it still fails with YouTube, try to provide a clearer message
                if "Sign in to confirm you're not a bot" in str(e):
                    raise Exception("YouTube is blocking this server. Please ensure your cookies or cookies.txt are valid.")
                raise e
            finally:
                # Cleanup temp cookie file if created
                if client_cookies and 'tmp_path' in locals():
                    try: os.unlink(tmp_path)
                    except: pass
            
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
        client_cookies = data.get('cookies')

        if not url:
            return JSONResponse({'error': 'URL is required'}, status_code=400)

        # Get absolute path to cookies.txt
        current_dir = os.path.dirname(os.path.abspath(__file__))
        cookie_path = os.path.join(current_dir, 'cookies.txt')
        
        # Priority 1: Handle client-side cookies
        tmp_path = None
        if client_cookies:
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as tmp:
                tmp.write(client_cookies)
                tmp_path = tmp.name
            actual_cookie_path = tmp_path
        # Priority 2: Server-side cookies
        elif os.path.exists(cookie_path):
            actual_cookie_path = cookie_path
        else:
            actual_cookie_path = None
        
        # Using python -m yt_dlp is safer as it uses the installed package
        import sys
        cmd = [sys.executable, '-m', 'yt_dlp', 
               '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
               '-f', format_id, '-o', '-', url]
        
        if actual_cookie_path:
            cmd.extend(['--cookies', actual_cookie_path])
        
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
                # Cleanup temp cookie file
                if tmp_path:
                    try: os.unlink(tmp_path)
                    except: pass

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
