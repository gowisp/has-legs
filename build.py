#!/usr/bin/env python3
"""Build the Has Legs site. Standard library only, nothing to install.

    python build.py              build src/ into docs/ (what GitHub Pages serves)
    python build.py --out DIR    build somewhere else, for a local preview

The facts that change (briefs address, web address) live in site.json.
Pages live in src/pages, shared pieces in src/partials, and everything in
src/static is copied to assets/.

The build stops with a plain message if a page uses a value that does not
exist, a link or anchor points nowhere, an id is used twice on a page, a
long dash slips into the copy, or a promise the studio has dropped comes back.
"""

import argparse
import hashlib
import json
import re
import shutil
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"

INCLUDE = re.compile(r"\{\{>\s*([\w./-]+)\s*\}\}")
VAR = re.compile(r"\{\{\s*([\w.]+)\s*\}\}")
FRONT = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n", re.S)
LONG_DASHES = {"—": "em dash", "–": "en dash"}

# Things the site used to say that are no longer true (see ../PROCESS.md).
# The build stops if one of them creeps back into a page.
RETIRED = {
    "24 hour": "a 24-hour turnaround is no longer promised",
    "24-hour": "a 24-hour turnaround is no longer promised",
    "pool of designers": "the pipeline builds and a designer directs",
    "can't start without": "a brand with no guidelines can still start",
    "one round of changes": "changes now come as one list, alongside free corrections",
}


class BuildError(Exception):
    pass


def lookup(ctx, dotted, where):
    cur = ctx
    for part in dotted.split("."):
        if not isinstance(cur, dict) or part not in cur:
            raise BuildError(f"{where}: no value called '{dotted}'")
        cur = cur[part]
    return str(cur)


def render(text, ctx, where, trail=()):
    def include(match):
        name = match.group(1)
        if name in trail:
            raise BuildError(f"{where}: partial '{name}' includes itself")
        path = SRC / "partials" / name
        if not path.is_file():
            raise BuildError(f"{where}: missing partial '{name}'")
        return render(path.read_text(encoding="utf-8").strip("\n"), ctx, name, trail + (name,))

    text = INCLUDE.sub(include, text)
    return VAR.sub(lambda m: lookup(ctx, m.group(1), where), text)


def read_page(path):
    raw = path.read_text(encoding="utf-8")
    match = FRONT.match(raw)
    if not match:
        raise BuildError(f"{path.name}: page must start with a --- settings block")
    meta = {}
    for line in match.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()
    for needed in ("title", "description", "path"):
        if needed not in meta:
            raise BuildError(f"{path.name}: settings block needs '{needed}'")
    return meta, raw[match.end():]


def asset_version():
    digest = hashlib.sha1()
    for path in sorted((SRC / "static").rglob("*")):
        if path.suffix in {".css", ".js"}:
            digest.update(path.read_bytes())
    return digest.hexdigest()[:8]


class Collector(HTMLParser):
    """Gathers the links, ids and visible text of one built page."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.ids = [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        for key in ("href", "src"):
            value = attrs.get(key)
            if value is not None and tag != "base":
                self.links.append(value)


def check(out, base_path, site_url):
    problems, link_count = [], 0
    pages = {}
    for path in sorted(out.rglob("*.html")):
        text = path.read_text(encoding="utf-8")
        collector = Collector()
        collector.feed(text)
        pages[path] = collector
        rel = path.relative_to(out).as_posix()
        if "{{" in text:
            problems.append(f"{rel}: unfilled {{{{ }}}} placeholder")
        lowered = text.lower()
        for phrase, why in RETIRED.items():
            if phrase in lowered:
                problems.append(f"{rel}: says '{phrase}', but {why}")
        seen = set()
        for ident in collector.ids:
            if ident in seen:
                problems.append(f"{rel}: id '{ident}' is used twice")
            seen.add(ident)

    for path in sorted(out.rglob("*")):
        if path.suffix in {".html", ".css", ".js", ".txt", ".svg", ".json"}:
            text = path.read_text(encoding="utf-8")
            for char, label in LONG_DASHES.items():
                if char in text:
                    line = text[: text.index(char)].count("\n") + 1
                    problems.append(f"{path.relative_to(out).as_posix()}: {label} on line {line}")

    for path, collector in pages.items():
        rel = path.relative_to(out).as_posix()
        for link in collector.links:
            if link.startswith(("mailto:", "tel:", "data:", "javascript:")):
                continue
            if link.startswith(site_url):
                link = base_path + link[len(site_url):]
            if link.startswith(("http://", "https://", "//")):
                continue
            link_count += 1
            target, _, fragment = link.partition("#")
            target = target.split("?", 1)[0]
            if target.startswith(base_path):
                dest = out / target[len(base_path):]
            elif target.startswith("/"):
                problems.append(f"{rel}: link '{link}' leaves the site folder")
                continue
            elif target == "":
                dest = path
            else:
                dest = (path.parent / target).resolve()
            if target.endswith("/") or dest.is_dir():
                dest = dest / "index.html"
            if not dest.is_file():
                problems.append(f"{rel}: link '{link}' points to nothing")
                continue
            if fragment and dest.suffix == ".html":
                dest = dest.resolve()
                found = pages.get(dest) or next((c for p, c in pages.items() if p.resolve() == dest), None)
                if found is not None and fragment not in found.ids:
                    problems.append(f"{rel}: link '{link}' points to a missing anchor")
    return problems, link_count


def build(out):
    site = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))

    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    shutil.copytree(SRC / "static", out / "assets")
    (out / ".nojekyll").write_text("", encoding="utf-8")

    layout = (SRC / "layout.html").read_text(encoding="utf-8")
    version = asset_version()
    robots = '<meta name="robots" content="noindex, nofollow">' if site.get("hide_from_search") else ""

    built = 0
    for page_path in sorted((SRC / "pages").glob("*.html")):
        meta, body = read_page(page_path)
        rel = meta["path"]
        if rel.endswith(".html"):
            out_file = out / rel
            root = site["base_path"]
            url = site["url"] + rel
        else:
            out_file = out / rel / "index.html"
            root = "../" * rel.strip("/").count("/") + ("../" if rel.strip("/") else "")
            url = site["url"] + rel
        ctx = {
            "site": {**{k: v for k, v in site.items() if not isinstance(v, dict)}, "robots": robots},
            "root": root,
            "home": root or "./",
            "v": version,
        }
        # Settings such as the description may use values too, for example the briefs address.
        meta = {key: render(value, ctx, page_path.name) for key, value in meta.items()}
        ctx["page"] = {"og_title": meta["title"], "scripts": "", "body_class": "", **meta, "url": url}
        scripts = [s.strip() for s in meta.get("scripts", "").split(",") if s.strip()]
        ctx["page"]["scripts"] = "\n".join(
            f'<script src="{root}assets/js/{name}?v={version}" defer></script>' for name in scripts
        )
        ctx["content"] = render(body, ctx, page_path.name).strip("\n")
        html = render(layout, ctx, "layout.html")
        nav = meta.get("nav")
        if nav:
            html = html.replace(f'data-nav="{nav}"', f'data-nav="{nav}" aria-current="page"')
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(html, encoding="utf-8", newline="\n")
        built += 1

    problems, link_count = check(out, site["base_path"], site["url"])
    if problems:
        raise BuildError("\n  ".join(["The site was built, but these need fixing:"] + problems))
    return built, link_count


def main():
    parser = argparse.ArgumentParser(description="Build the Has Legs site.")
    parser.add_argument("--out", default=str(ROOT / "docs"), help="folder to build into")
    args = parser.parse_args()
    out = Path(args.out).resolve()
    if out == ROOT or ROOT.is_relative_to(out) or SRC == out or SRC in out.parents:
        sys.exit("Refusing to build into the site's own source folder.")
    try:
        built, link_count = build(out)
    except BuildError as err:
        sys.exit(f"BUILD FAILED\n  {err}")
    print(f"Built {built} pages into {out}")
    print(f"Checked {link_count} links and anchors, ids, dashes and dropped promises: all good.")


if __name__ == "__main__":
    main()
