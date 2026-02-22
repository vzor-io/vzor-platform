#!/usr/bin/env python3
"""Edge TTS streaming HTTP server — GET /tts?text=..."""
import asyncio, sys, threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import edge_tts

loop = asyncio.new_event_loop()
def run_loop():
    asyncio.set_event_loop(loop)
    loop.run_forever()
threading.Thread(target=run_loop, daemon=True).start()

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        text = q.get('text', [''])[0]
        voice = q.get('voice', ['ru-RU-DmitryNeural'])[0]
        if not text or len(text) > 2000:
            self.send_response(400)
            self.end_headers()
            return
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Transfer-Encoding', 'chunked')
            self.end_headers()
            future = asyncio.run_coroutine_threadsafe(self.stream_tts(text, voice), loop)
            future.result(timeout=30)
        except Exception as e:
            pass

    async def stream_tts(self, text, voice):
        comm = edge_tts.Communicate(text, voice)
        async for chunk in comm.stream():
            if chunk['type'] == 'audio':
                data = chunk['data']
                # chunked encoding
                self.wfile.write(f'{len(data):X}\r\n'.encode())
                self.wfile.write(data)
                self.wfile.write(b'\r\n')
                self.wfile.flush()
        # end chunk
        self.wfile.write(b'0\r\n\r\n')
        self.wfile.flush()

    def log_message(self, fmt, *args):
        pass

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 18795
    srv = HTTPServer(('0.0.0.0', port), Handler)
    print(f'TTS streaming server on :{port}', flush=True)
    srv.serve_forever()
