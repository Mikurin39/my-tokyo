"""Download Wikimedia Commons photos for the ranking section.

Usage:
  python3 tools/fetch_commons.py <list.json>

<list.json> is a JSON array of {"slug": "...", "file_page": "https://commons.wikimedia.org/wiki/File:..."}.
Each photo is saved as img/rank/<slug>.jpg (800px wide, JPEG, metadata stripped), and
img/rank/credits.json is updated with author / license / source page for the footer credits.
Needs Pillow: uv run --with pillow python tools/fetch_commons.py list.json
"""
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "img" / "rank"
UA = "MyTokyoSiteBuilder/1.0 (static site photo credits)"
API = "https://commons.wikimedia.org/w/api.php"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def strip_html(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


def info(file_page):
    title = urllib.parse.unquote(file_page.split("/wiki/", 1)[1]).replace("_", " ")
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "titles": title, "prop": "imageinfo",
        "iiprop": "url|extmetadata", "iiurlwidth": "800",
    })
    data = json.loads(get(f"{API}?{q}"))
    page = next(iter(data["query"]["pages"].values()))
    if "imageinfo" not in page:
        raise ValueError(f"not found on Commons: {title}")
    ii = page["imageinfo"][0]
    meta = ii.get("extmetadata", {})
    lic = strip_html(meta.get("LicenseShortName", {}).get("value"))
    if not re.search(r"CC0|CC BY|Public domain|PD", lic, re.I) or re.search(r"\bNC\b|\bND\b", lic):
        raise ValueError(f"license not allowed: {lic} ({title})")
    return {
        "thumb": ii.get("thumburl") or ii["url"],
        "author": re.sub(r"\s+from\s.*$", "", strip_html(meta.get("Artist", {}).get("value"))) or "unknown",
        "license": lic,
        "page": ii.get("descriptionurl", file_page),
    }


def main():
    items = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    cred_path = OUT / "credits.json"
    credits = json.loads(cred_path.read_text(encoding="utf-8")) if cred_path.exists() else {}
    failed = []
    for it in items:
        slug = it["slug"]
        try:
            m = info(it["file_page"])
            im = Image.open(io.BytesIO(get(m["thumb"]))).convert("RGB")
            if im.width > 800:
                im = im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS)
            im.save(OUT / f"{slug}.jpg", "JPEG", quality=82, optimize=True)  # no EXIF kept
            credits[slug] = {"author": m["author"], "license": m["license"], "page": m["page"]}
            print(f"ok   {slug}  {m['license']}  {m['author'][:40]}")
        except Exception as e:  # keep going, report at the end
            failed.append(slug)
            print(f"FAIL {slug}: {e}")
        time.sleep(4)
    cred_path.write_text(json.dumps(credits, ensure_ascii=False, indent=1), encoding="utf-8")
    if failed:
        print("failed:", ", ".join(failed))


if __name__ == "__main__":
    main()
