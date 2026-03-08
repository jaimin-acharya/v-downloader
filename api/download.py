import json
from http.server import BaseHTTPRequestHandler
import yt_dlp
import subprocess
import sys

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            url = data.get('url')
            format_id = data.get('formatId', 'best')

            if not url:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error": "URL is required"}')
                return

            self.send_response(200)
            self.send_header('Content-Type', 'video/mp4')
            self.send_header('Content-Disposition', 'attachment; filename="video.mp4"')
            self.end_headers()

            # Using subprocess to pipe yt-dlp output directly to the response
            # 'python3 -m yt_dlp' is standard on Vercel
            cmd = ['python3', '-m', 'yt_dlp', '-f', format_id, '-o', '-', url]
            
            process = subprocess.Popen(
                cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                bufsize=1024*64
            )
            
            try:
                while True:
                    chunk = process.stdout.read(1024*64)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    self.wfile.flush()
            finally:
                process.terminate()
                process.wait()

        except Exception as e:
            # Note: We can't send headers here if we already started streaming
            print(f"Download ERROR: {str(e)}")
            if not self.wfile_closed:
                try:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': str(e)}).encode())
                except:
                    pass

    @property
    def wfile_closed(self):
        return self.wfile.closed
