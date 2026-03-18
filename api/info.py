import json
import os
import time
from http.server import BaseHTTPRequestHandler
import yt_dlp
import traceback

COOKIE_PATH = '/tmp/yt-cookies.txt'

def get_ydl_opts() -> dict:
    """Return yt-dlp options dictionary based on environment variables."""
    opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
    }

    browser_cookie = os.environ.get('YOUTUBE_COOKIES_BROWSER')
    if browser_cookie:
        print(f'[yt-dlp] Using cookies from browser: {browser_cookie}')
        opts['cookies_from_browser'] = (browser_cookie,)
        return opts

    env_cookies = os.environ.get('YOUTUBE_COOKIES', '').strip()
    if env_cookies:
        try:
            # Re-write cookie file periodically
            if not os.path.exists(COOKIE_PATH) or os.path.getmtime(COOKIE_PATH) < (time.time() - 60):
                # Convert CRLF → LF (yt-dlp on Linux requires LF; CRLF causes HTTP 400)
                content = env_cookies.replace('\\n', '\n').replace('\r\n', '\n').replace('\r', '\n')
                with open(COOKIE_PATH, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(content)
            print('[yt-dlp] Using cookies from environment variable')
            opts['cookiefile'] = COOKIE_PATH
            return opts
        except Exception as e:
            print(f'[cookies] Failed to write cookie file: {e}')

    print('[yt-dlp] No cookies found — attempting without (may fail for some videos)')
    return opts


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            if not post_data:
                 self.send_response(400)
                 self.end_headers()
                 self.wfile.write(b'{"error": "Empty request body"}')
                 return

            data = json.loads(post_data)
            url = data.get('url')

            if not url:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'URL is required'}).encode())
                return

            ydl_opts = get_ydl_opts()
            
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
                    'duration': self.format_duration(info.get('duration')),
                    'duration_raw': info.get('duration'),
                    'uploader': info.get('uploader'),
                    'platform': info.get('extractor_key'),
                    'formats': formats
                }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode())

        except Exception as e:
            print(f"ERROR: {str(e)}")
            print(traceback.format_exc())
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e), 'trace': traceback.format_exc()}).encode())

    def format_duration(self, seconds):
        if not seconds: return '0:00'
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        if h > 0: return f"{h}:{m:02d}:{s:02d}"
        return f"{m}:{s:02d}"
