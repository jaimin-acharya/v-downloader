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
            # We want to stream the output of yt-dlp to the client
            ydl_opts = {
                'format': format_id,
                'outtmpl': '-', # stdout
                'quiet': True,
                'no_warnings': True,
            }

            self.send_response(200)
            self.send_header('Content-Type', 'video/mp4')
            self.send_header('Content-Disposition', 'attachment; filename="video.mp4"')
            self.end_headers()

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # This opens a stream and writes to self.wfile
                # In Vercel serverless, this might hit a timeout for long videos
                ydl.download([url])

        except Exception as e:
            if not self.wfile.closed:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
