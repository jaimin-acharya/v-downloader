import json
import os
import subprocess
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs

COOKIE_PATH = '/tmp/yt-cookies.txt'

def prepare_cookies() -> str | None:
    """Write YOUTUBE_COOKIES env var to /tmp and return path, or None."""
    cookies = os.environ.get('YOUTUBE_COOKIES', '').strip()
    if not cookies:
        return None
    try:
        if not os.path.exists(COOKIE_PATH):
            with open(COOKIE_PATH, 'w') as f:
                f.write(cookies)
        return COOKIE_PATH
    except Exception as e:
        print(f'[cookies] Failed to write cookie file: {e}')
        return None


def build_cmd(url: str, format_id: str) -> list[str]:
    cookie_path = prepare_cookies()

    cmd = [
        'python3', '-m', 'yt_dlp',
        '--extractor-args', 'youtube:player_client=android,web',
        '--no-check-certificates',
        '--no-warnings',
        '--merge-output-format', 'mp4',
        '-f', format_id,
        '-o', '-',
    ]

    if cookie_path:
        cmd += ['--cookies', cookie_path]
        print('[yt-dlp] Using cookies from environment')
    else:
        print('[yt-dlp] No cookies found — attempting without (may fail for some videos)')

    cmd.append(url)
    return cmd


class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        process = None
        try:
            content_type = self.headers.get('Content-Type', '')
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)

            data = {}
            if 'application/json' in content_type:
                data = json.loads(post_data)
            else:  # Default to form-urlencoded
                parsed_data = parse_qs(post_data.decode('utf-8'))
                data = {k: v[0] for k, v in parsed_data.items()}

            url = data.get('url')
            format_id = data.get('formatId') or 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
            file_name_from_request = data.get('fileName')
            file_name = f'filename="{file_name_from_request}"' if file_name_from_request else 'filename="video.mp4"'

            if not url:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"error": "URL is required"}')
                return

            cmd = build_cmd(url, format_id)
            print(f'[yt-dlp] Running: {" ".join(cmd)}')

            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=1024 * 64
            )

            # --- Fail fast: check yt-dlp didn't immediately error ---
            # Read a first chunk; if the process died, capture stderr and report
            first_chunk = process.stdout.read(1024 * 64)
            if not first_chunk:
                stderr_output = process.stderr.read().decode('utf-8', errors='replace')
                process.wait()
                print(f'[yt-dlp] Early exit. stderr:\n{stderr_output}')

                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_msg = self._extract_error(stderr_output)
                self.wfile.write(json.dumps({'error': error_msg}).encode())
                return

            # --- All good, start streaming ---
            self.send_response(200)
            self.send_header('Content-Type', 'video/mp4')
            self.send_header('Content-Disposition', f'attachment; {file_name}')
            self.end_headers()

            self.wfile.write(first_chunk)
            self.wfile.flush()

            while True:
                chunk = process.stdout.read(1024 * 64)
                if not chunk:
                    break
                self.wfile.write(chunk)
                self.wfile.flush()

            process.wait()
            if process.returncode != 0:
                stderr_output = process.stderr.read().decode('utf-8', errors='replace')
                print(f'[yt-dlp] Non-zero exit ({process.returncode}):\n{stderr_output}')

        except BrokenPipeError:
            # Client disconnected mid-stream — not an error on our side
            print('[stream] Client disconnected early')

        except Exception as e:
            print(f'[handler] Unexpected error: {e}')
            if not self.wfile.closed:
                try:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': str(e)}).encode())
                except Exception:
                    pass

        finally:
            if process and process.poll() is None:
                process.terminate()
                process.wait()

    def _extract_error(self, stderr: str) -> str:
        """Pull the most useful line from yt-dlp stderr for the client."""
        for line in reversed(stderr.splitlines()):
            line = line.strip()
            if 'ERROR' in line or 'error' in line.lower():
                return line
        return stderr[-300:] if stderr else 'yt-dlp produced no output'

    def log_message(self, format, *args):
        # Suppress default BaseHTTPRequestHandler access logs (noisy on Vercel)
        pass