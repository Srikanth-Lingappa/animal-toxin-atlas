#!/usr/bin/env python3
"""Build the single-file tool (index.html) from its sources.

    src/index.html              the page skeleton; {{include path}} lines pull in the files below
    src/css/*.css               the styles, one file per area
    src/html/*.html             the markup, one file per tab plus header and footer
    src/js/*.js                 the behaviour, one file per section, joined in the order src/index.html lists them
    src/assets/world-map.svg    the base map of the Clinical Importance tab
    data/animal-toxin-atlas-data.json  the dataset (records plus lookup lists)

Every {{include ...}} is replaced by the file's contents (includes can be nested, and can appear mid-line), then the data
placeholder is filled in. The data is compressed (gzip, fixed timestamp so the output is reproducible) and embedded as base64
in <script id="app-data">; the page decompresses it in the browser with DecompressionStream.

Usage:  python scripts/build_html.py [--out index.html]
"""
import argparse, base64, gzip, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PLACEHOLDER = "__ATLAS_DATA__"
INCLUDE = re.compile(r"\{\{include ([^}]+)\}\}")


def expand(text, base, depth=0):
    """Replace every {{include path}} (path relative to src/) with that file's contents."""
    if depth > 5:
        sys.exit("includes nested too deeply")

    def sub(m):
        path = base / m.group(1).strip()
        if not path.is_file():
            sys.exit(f"missing include: {path}")
        return expand(path.read_text(encoding="utf-8"), base, depth + 1)

    return INCLUDE.sub(sub, text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", default=ROOT / "src" / "index.html")
    ap.add_argument("--data", default=ROOT / "data" / "animal-toxin-atlas-data.json")
    ap.add_argument("--out", default=ROOT / "index.html")
    a = ap.parse_args()

    template_path = pathlib.Path(a.template)
    template = expand(template_path.read_text(encoding="utf-8"), template_path.parent)
    if template.count(PLACEHOLDER) != 1:
        sys.exit(f"template must contain {PLACEHOLDER} exactly once (it lives in src/index.html)")
    data = json.loads(pathlib.Path(a.data).read_text(encoding="utf-8"))
    raw = json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    packed = gzip.compress(raw, compresslevel=9, mtime=0)
    html = template.replace(PLACEHOLDER, base64.b64encode(packed).decode("ascii"))
    pathlib.Path(a.out).write_text(html, encoding="utf-8")
    print(f"wrote {a.out}: {len(data['entries'])} records, {len(html)/1e6:.2f} MB")


if __name__ == "__main__":
    main()
