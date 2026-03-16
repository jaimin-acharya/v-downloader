import os
import sys
import json
import tempfile
import subprocess
import traceback
import yt_dlp
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware


# ─── Auto-update yt-dlp on startup ───────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("INFO: Updating yt-dlp to latest version...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"],
        capture_output=True, text=True
    )
    print(f"INFO: yt-dlp update result: {result.stdout.strip()}")
    yield


app = FastAPI(lifespan=lifespan)


# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # All Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helpers ──────────────────────────────────────────────────────────────────
def format_duration(seconds):
    if not seconds:
        return '0:00'
    try:
        seconds = int(seconds)
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        if h > 0:
            return f"{h}:{m:02d}:{s:02d}"
        return f"{m}:{s:02d}"
    except:
        return '0:00'


def get_cookie_path():
    """Returns server-side cookies.txt path if it exists."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    cookie_path = os.path.join(current_dir, 'cookies.txt')
    return cookie_path if os.path.exists(cookie_path) else None


def write_temp_cookies(client_cookies: str):
    """Writes client cookie string to a temp file and returns the path."""
    tmp = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt')
    tmp.write(client_cookies)
    tmp.close()
    return tmp.name


def parse_error(e: Exception) -> str:
    """Returns a user-friendly error message."""
    msg = str(e)
    if "Sign in to confirm you're not a bot" in msg or "bot" in msg.lower():
        return "YouTube is blocking this server. Please provide fresh cookies from your browser."
    if "age" in msg.lower() or "age-restricted" in msg.lower():
        return "This video is age-restricted. Please provide cookies from a logged-in YouTube account."
    if "private" in msg.lower():
        return "This video is private and cannot be downloaded."
    if "unavailable" in msg.lower():
        return "This video is unavailable or has been removed."
    if "copyright" in msg.lower():
        return "This video is not available due to copyright restrictions."
    if "members only" in msg.lower():
        return "This video is for channel members only."
    return msg


def get_clean_formats(raw_formats: list) -> list:
    """
    Returns clean, deduplicated quality options for the frontend.
    Includes: video+audio combined formats and audio-only.
    """
    seen_heights = set()
    clean = []

    # Sort by height descending
    video_formats = [
        f for f in raw_formats
        if f.get('vcodec') != 'none' and f.get('height')
    ]
    video_formats.sort(key=lambda x: x.get('height', 0), reverse=True)

    for f in video_formats:
        height = f.get('height')
        label = f"{height}p"
        if height not in seen_heights:
            seen_heights.add(height)
            size = f.get('filesize') or f.get('filesize_approx')
            clean.append({
                'format_id': f.get('format_id'),
                'label': label,
                'ext': f.get('ext', 'mp4'),
                'width': f.get('width'),
                'height': height,
                'filesize': size,
                'vcodec': f.get('vcodec'),
                'acodec': f.get('acodec'),
                'has_audio': f.get('acodec') != 'none',
            })

    # Add audio-only option
    audio_formats = [
        f for f in raw_formats
        if f.get('vcodec') == 'none' and f.get('acodec') != 'none'
    ]
    if audio_formats:
        # Pick best audio
        audio_formats.sort(key=lambda x: x.get('abr') or 0, reverse=True)
        best_audio = audio_formats[0]
        size = best_audio.get('filesize') or best_audio.get('filesize_approx')
        clean.append({
            'format_id': best_audio.get('format_id'),
            'label': 'Audio Only',
            'ext': best_audio.get('ext', 'mp3'),
            'width': None,
            'height': None,
            'filesize': size,
            'vcodec': 'none',
            'acodec': best_audio.get('acodec'),
            'has_audio': True,
        })

    return clean


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/download")
async def download(request: Request):
    tmp_path = None
    tmp_video = None

    try:
        data = await request.json()
        url = data.get('url')
        format_id = data.get('formatId', 'best')
        title = data.get('title', 'video')
        client_cookies = data.get('cookies')

        if not url:
            return JSONResponse({'error': 'URL is required'}, status_code=400)

        print(f"DEBUG: Downloading — URL: {url}, format: {format_id}")

        # Resolve cookies
        if client_cookies:
            tmp_path = write_temp_cookies(client_cookies)
            actual_cookie_path = tmp_path
        else:
            actual_cookie_path = get_cookie_path()

        # Sanitize title for filename
        safe_title = "".join(
            c for c in title if c.isalnum() or c in (' ', '-', '_')
        ).strip() or 'video'

        # ── Write to /tmp first (avoids stdout merge issue) ──
        tmp_video = f"/tmp/{safe_title}_{format_id}.mp4"

        # Remove leftover file if exists
        if os.path.exists(tmp_video):
            os.unlink(tmp_video)

        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--user-agent',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/122.0.0.0 Safari/537.36',
            '-f', format_id,
            '--merge-output-format', 'mp4',  # Force mp4 merge
            '-o', tmp_video,                  # Write to /tmp
            '--no-playlist',
            '--no-part',                      # No .part files
            url
        ]

        if actual_cookie_path:
            cmd.extend(['--cookies', actual_cookie_path])

        print(f"DEBUG: Running command: {' '.join(cmd)}")

        # Run and wait for completion
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )

        print(f"DEBUG: yt-dlp stdout: {result.stdout[-500:] if result.stdout else 'none'}")
        print(f"DEBUG: yt-dlp stderr: {result.stderr[-500:] if result.stderr else 'none'}")

        if result.returncode != 0:
            raise Exception(f"yt-dlp failed: {result.stderr[-300:]}")

        if not os.path.exists(tmp_video) or os.path.getsize(tmp_video) == 0:
            raise Exception("Downloaded file is empty or missing")

        file_size = os.path.getsize(tmp_video)
        print(f"DEBUG: File ready: {tmp_video} ({file_size} bytes)")

        # ── Stream the file to client ──
        def stream_file():
            try:
                with open(tmp_video, 'rb') as f:
                    while True:
                        chunk = f.read(1024 * 64)  # 64KB chunks
                        if not chunk:
                            break
                        yield chunk
            finally:
                # Cleanup temp files
                for path in [tmp_video, tmp_path]:
                    if path and os.path.exists(path):
                        try:
                            os.unlink(path)
                        except:
                            pass

        return StreamingResponse(
            stream_file(),
            media_type="video/mp4",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_title}.mp4"',
                "Content-Length": str(file_size),  # Now we know exact size!
                "Access-Control-Expose-Headers": "Content-Disposition, Content-Length",
                "Cache-Control": "no-cache",
            }
        )

    except Exception as e:
        print(f"ERROR in /api/download: {str(e)}")
        # Cleanup on error
        for path in [tmp_video, tmp_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except:
                    pass
        return JSONResponse({'error': parse_error(e)}, status_code=500)    


@app.post("/api/info")
async def get_info(request: Request):
    print(f"REQUEST: {request.method} {request.url}")
    tmp_path = None

    try:
        data = await request.json()
        url = data.get('url')
        client_cookies = data.get('cookies')

        if not url:
            return JSONResponse({'error': 'URL is required'}, status_code=400)

        print(f"DEBUG: Processing URL: {url}")

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'skip_download': True,
            'user_agent': (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/122.0.0.0 Safari/537.36'
            ),
        }

        # Cookie priority: client > server-side file
        if client_cookies:
            print("DEBUG: Using client-provided cookies")
            tmp_path = write_temp_cookies(client_cookies)
            ydl_opts['cookiefile'] = tmp_path
        else:
            server_cookie = get_cookie_path()
            if server_cookie:
                print(f"DEBUG: Using server cookies: {server_cookie}")
                ydl_opts['cookiefile'] = server_cookie
            else:
                print("DEBUG: No cookies available")

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        if not info:
            raise Exception("yt-dlp returned no information")

        raw_formats = info.get('formats', [])
        clean_formats = get_clean_formats(raw_formats)

        return JSONResponse({
            'id': info.get('id'),
            'title': info.get('title'),
            'thumbnail': info.get('thumbnail'),
            'duration': format_duration(info.get('duration')),
            'duration_raw': info.get('duration'),
            'uploader': info.get('uploader'),
            'platform': info.get('extractor_key'),
            'formats': clean_formats,
        })

    except Exception as e:
        print(f"ERROR in /api/info: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse(
            {'error': parse_error(e)},
            status_code=500
        )

    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except:
                pass


@app.post("/api/download")
async def download(request: Request):
    tmp_path = None

    try:
        data = await request.json()
        url = data.get('url')
        format_id = data.get('formatId', 'best')
        title = data.get('title', 'video')
        client_cookies = data.get('cookies')

        if not url:
            return JSONResponse({'error': 'URL is required'}, status_code=400)

        print(f"DEBUG: Downloading — URL: {url}, format: {format_id}, title: {title}")

        # Resolve cookie path
        if client_cookies:
            tmp_path = write_temp_cookies(client_cookies)
            actual_cookie_path = tmp_path
        else:
            actual_cookie_path = get_cookie_path()

        # Build yt-dlp command
        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--user-agent',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/122.0.0.0 Safari/537.36',
            '-f', format_id,
            '-o', '-',  # Output to stdout
            '--no-playlist',
            url
        ]

        if actual_cookie_path:
            cmd.extend(['--cookies', actual_cookie_path])

        # Sanitize title for Content-Disposition header
        safe_title = "".join(
            c for c in title if c.isalnum() or c in (' ', '-', '_')
        ).strip() or 'video'

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            bufsize=1024 * 64
        )

        def stream_video():
            try:
                while True:
                    chunk = process.stdout.read(1024 * 64)
                    if not chunk:
                        break
                    yield chunk
            except Exception as e:
                print(f"STREAM ERROR: {e}")
            finally:
                process.terminate()
                process.wait()
                if tmp_path:
                    try:
                        os.unlink(tmp_path)
                    except:
                        pass

        return StreamingResponse(
            stream_video(),
            media_type="video/mp4",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_title}.mp4"',
                "Access-Control-Expose-Headers": "Content-Disposition, Content-Length",
                "Cache-Control": "no-cache",
            }
        )

    except Exception as e:
        print(f"ERROR in /api/download: {str(e)}")
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except:
                pass
        return JSONResponse({'error': parse_error(e)}, status_code=500)


@app.post("/api/formats")
async def get_formats(request: Request):
    """Lightweight endpoint — returns only clean format list."""
    tmp_path = None

    try:
        data = await request.json()
        url = data.get('url')
        client_cookies = data.get('cookies')

        if not url:
            return JSONResponse({'error': 'URL is required'}, status_code=400)

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
        }

        if client_cookies:
            tmp_path = write_temp_cookies(client_cookies)
            ydl_opts['cookiefile'] = tmp_path
        else:
            server_cookie = get_cookie_path()
            if server_cookie:
                ydl_opts['cookiefile'] = server_cookie

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        return JSONResponse({
            'formats': get_clean_formats(info.get('formats', []))
        })

    except Exception as e:
        return JSONResponse({'error': parse_error(e)}, status_code=500)

    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except:
                pass


# ─── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)