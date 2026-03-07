import json
from http.server import BaseHTTPRequestHandler
import yt_dlp
import sys
import re

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        url = data.get('url')
        format_id = data.get('formatId', 'best')

        if not url:
            self.send_response(400)
            self.end_headers()
            return

        try:
            ydl_opts = {
                'format': format_id,
                'outtmpl': '-', # stdout
                'quiet': True,
                'no_warnings': True,
                'noprogress': True,
            }

            self.send_response(200)
            self.send_header('Content-Type', 'video/mp4')
            self.send_header('Content-Disposition', 'attachment; filename="video.mp4"')
            self.end_headers()

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

        except Exception as e:
            print(f"Streaming error: {str(e)}")
            if not self.wfile.closed:
                # We can't send headers once stream started, but if it failed before:
                # This is tricky for streaming, but good for initial failures
                pass
