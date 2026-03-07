import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import yt_dlp

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        url = data.get('url')

        if not url:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'URL is required'}).encode())
            return

        try:
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,
                'skip_download': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                print(f"Extracting info for {url}")
                info = ydl.extract_info(url, download=False)
                
                if not info:
                    raise Exception("yt-dlp returned no information")

                # Process formats to match the expected frontend structure
                formats = []
                raw_formats = info.get('formats', [])
                if not raw_formats:
                    # Fallback if no formats list but single format
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
            print(f"Extraction error: {str(e)}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def format_duration(self, seconds):
        if not seconds:
            return '0:00'
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        
        if h > 0:
            return f"{h}:{m:02d}:{s:02d}"
        return f"{m}:{s:02d}"
