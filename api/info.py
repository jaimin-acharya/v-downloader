import json
from http.server import BaseHTTPRequestHandler
import yt_dlp
import traceback

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
