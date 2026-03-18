import os
import sys
import subprocess
import traceback
import time
import yt_dlp
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# ─── Cookie management ───────────────────────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
COOKIE_FILE = os.path.join(BACKEND_DIR, 'cookies.txt')
TMP_COOKIE_FILE = '/tmp/yt-cookies.txt'


def _ensure_lf_newlines(src: str, dest: str) -> bool:
    """
    Copy cookie file from src to dest, converting CRLF → LF.
    yt-dlp on Linux requires LF newlines; CRLF causes HTTP 400.
    Returns True if a valid cookie file was written.
    """
    try:
        with open(src, 'r', encoding='utf-8') as f:
            content = f.read()
        if not content.strip():
            return False
        # Convert CRLF → LF
        content = content.replace('\r\n', '\n').replace('\r', '\n')
        with open(dest, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f'[cookies] Failed to process cookie file: {e}')
        return False


def get_cookie_opts() -> dict:
    """
    Returns yt-dlp cookie options.
    Priority: 1) cookies.txt in backend dir  2) YOUTUBE_COOKIES env var
    """
    # 1) Check for cookies.txt bundled with the app
    if os.path.exists(COOKIE_FILE) and os.path.getsize(COOKIE_FILE) > 0:
        # Re-process periodically (handles updates on redeploy)
        needs_refresh = (
            not os.path.exists(TMP_COOKIE_FILE)
            or os.path.getmtime(TMP_COOKIE_FILE) < os.path.getmtime(COOKIE_FILE)
        )
        if needs_refresh:
            if _ensure_lf_newlines(COOKIE_FILE, TMP_COOKIE_FILE):
                print(f'[cookies] Loaded cookies from {COOKIE_FILE} → {TMP_COOKIE_FILE}')
        if os.path.exists(TMP_COOKIE_FILE):
            return {'cookiefile': TMP_COOKIE_FILE}

    # 2) Fallback: YOUTUBE_COOKIES environment variable (Netscape format string)
    env_cookies = os.environ.get('YOUTUBE_COOKIES', '').strip()
    if env_cookies:
        try:
            content = env_cookies.replace('\\n', '\n').replace('\r\n', '\n').replace('\r', '\n')
            with open(TMP_COOKIE_FILE, 'w', encoding='utf-8', newline='\n') as f:
                f.write(content)
            print('[cookies] Loaded cookies from YOUTUBE_COOKIES env var')
            return {'cookiefile': TMP_COOKIE_FILE}
        except Exception as e:
            print(f'[cookies] Failed to write env cookies: {e}')

    print('[cookies] No cookies found — some videos may fail')
    return {}


# ─── CORS ─────────────────────────────────────────────────────────────────────
# Get allowed origins from environment variable (comma-separated origins)
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=os.environ.get("ALLOW_ORIGIN_REGEX", r"https://.*\.vercel\.app"),
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


def parse_error(e: Exception) -> str:
    """Returns a user-friendly error message."""
    msg = str(e)
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
    tmp_video = None

    try:
        data = await request.json()
        url = data.get('url')
        format_id = data.get('formatId', 'best')
        title = data.get('title', 'video')

        if not url:
            return JSONResponse({'error': 'URL is required'}, status_code=400)

        print(f"DEBUG: Downloading — URL: {url}, format: {format_id}")

        # Sanitize title for filename
        safe_title = "".join(
            c for c in title if c.isalnum() or c in (' ', '-', '_')
        ).strip() or 'video'

        # ── Write to /tmp first (avoids stdout merge issue) ──
        tmp_video = f"/tmp/{safe_title}_{format_id}.mp4"

        # Remove leftover file if exists
        if os.path.exists(tmp_video):
            os.unlink(tmp_video)

        # Build cookie args for the CLI command
        cookie_opts = get_cookie_opts()
        cookie_args = []
        if 'cookiefile' in cookie_opts:
            cookie_args = ['--cookies', cookie_opts['cookiefile']]

        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--user-agent',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/122.0.0.0 Safari/537.36',
            '--extractor-args', 'youtube:player_client=tv_embedded,web',
            *cookie_args,
            '-f', format_id,
            '--merge-output-format', 'mp4',
            '-o', tmp_video,
            '--no-playlist',
            '--no-part',
            url
        ]

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
                        chunk = f.read(1024 * 64)
                        if not chunk:
                            break
                        yield chunk
            finally:
                if tmp_video and os.path.exists(tmp_video):
                    try:
                        os.unlink(tmp_video)
                    except:
                        pass

        return StreamingResponse(
            stream_file(),
            media_type="video/mp4",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_title}.mp4"',
                "Content-Length": str(file_size),
                "Access-Control-Expose-Headers": "Content-Disposition, Content-Length",
                "Cache-Control": "no-cache",
            }
        )

    except Exception as e:
        print(f"ERROR in /api/download: {str(e)}")
        if tmp_video and os.path.exists(tmp_video):
            try:
                os.unlink(tmp_video)
            except:
                pass
        return JSONResponse({'error': parse_error(e)}, status_code=500)    


@app.post("/api/info")
async def get_info(request: Request):
    print(f"REQUEST: {request.method} {request.url}")

    try:
        data = await request.json()
        url = data.get('url')

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
            'extractor_args': {
                'youtube': {'player_client': ['tv_embedded', 'web']}
            },
            **get_cookie_opts(),
        }

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


@app.post("/api/formats")
async def get_formats(request: Request):
    """Lightweight endpoint — returns only clean format list."""

    try:
        data = await request.json()
        url = data.get('url')

        if not url:
            return JSONResponse({'error': 'URL is required'}, status_code=400)

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'extractor_args': {
                'youtube': {'player_client': ['tv_embedded', 'web']}
            },
            **get_cookie_opts(),
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        return JSONResponse({
            'formats': get_clean_formats(info.get('formats', []))
        })

    except Exception as e:
        return JSONResponse({'error': parse_error(e)}, status_code=500)


# ─── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)