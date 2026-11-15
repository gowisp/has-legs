#!/usr/bin/env python3
"""Check the Has Legs site in a real browser. Standard library only.

    python check.py

Builds the site into a temporary folder, serves it on this computer only,
opens tests/browser-checks.html in headless Chrome and prints every check as
PASS or FAIL in plain words. It never touches docs/ and sends nothing anywhere.
Needs Google Chrome or Microsoft Edge installed.
"""

import functools
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlencode

import build

ROOT = Path(__file__).resolve().parent
BROWSERS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
]


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def find_browser():
    for candidate in BROWSERS:
        if Path(candidate).is_file():
            return candidate
    for name in ("chrome", "google-chrome", "chromium", "msedge"):
        found = shutil.which(name)
        if found:
            return found
    return None


def main():
    browser = find_browser()
    if not browser:
        sys.exit("Could not find Chrome or Edge on this computer, so the browser checks did not run.")

    site = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
    base = site["base_path"]
    prices = site["prices"]

    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        web_root = Path(tmp) / "web"
        out = web_root / base.strip("/") if base.strip("/") else web_root
        try:
            pages, links = build.build(out)
        except build.BuildError as err:
            sys.exit(f"BUILD FAILED\n  {err}")
        print(f"Build: {pages} pages, {links} links and anchors checked.")
        shutil.copy(ROOT / "tests" / "browser-checks.html", web_root / "_checks.html")

        handler = functools.partial(Quiet, directory=str(web_root))
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        query = urlencode({
            "base": base,
            "email": site["email"],
            "single": prices["single_from"],
            "further": prices["each_further_piece_from"],
            "setmax": prices["set_max_pieces"],
            "cur": prices["currency"],
        })
        url = f"http://127.0.0.1:{server.server_address[1]}/_checks.html?{query}"
        try:
            run = subprocess.run(
                [browser, "--headless=new", "--disable-gpu", f"--user-data-dir={Path(tmp) / 'profile'}",
                 "--window-size=1400,1000", "--virtual-time-budget=90000", "--dump-dom", url],
                capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=300)
        finally:
            server.shutdown()

    found = re.search(r'<pre id="out">(.*?)</pre>', run.stdout, re.S)
    if not found or not found.group(1).startswith("DONE"):
        sys.exit("The browser did not finish the checks. Output began:\n" + run.stdout[:600])
    lines = html.unescape(found.group(1)).splitlines()
    for line in lines[1:]:
        print(line)
    failed = [line for line in lines[1:] if not line.startswith("PASS")]
    passed = len(lines) - 1 - len(failed)
    print(f"\nBrowser checks: {passed} of {len(lines) - 1} passed.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
