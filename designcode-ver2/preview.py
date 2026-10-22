from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import argparse, webbrowser
parser=argparse.ArgumentParser()
parser.add_argument("--port", type=int, default=0)
parser.add_argument("--no-browser", action="store_true")
args=parser.parse_args()
server=ThreadingHTTPServer(("127.0.0.1",args.port),partial(SimpleHTTPRequestHandler,directory=str(Path(__file__).resolve().parent)))
url=f"http://127.0.0.1:{server.server_port}/"
print(url,flush=True)
if not args.no_browser:webbrowser.open(url)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
