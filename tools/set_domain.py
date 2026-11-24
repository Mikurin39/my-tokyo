"""Move the site to its own domain (or back).

  python3 tools/set_domain.py mytokyotours.com        # site lives at https://mytokyotours.com/
  python3 tools/set_domain.py --github                # back to https://mikurin39.github.io/my-tokyo/

Rewrites the site address everywhere it is written (config, home page, robots.txt, blog builder,
booking script, CLAUDE.md), writes or removes the CNAME file GitHub Pages reads, and rebuilds the
blog and sitemap. Afterwards: commit, push, then set the custom domain and "Enforce HTTPS" in the
repository's Settings > Pages, and point the domain's DNS at GitHub Pages.
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GITHUB = "https://mikurin39.github.io/my-tokyo"
FILES = ["js/config.js", "index.html", "robots.txt", "tools/build_blog.py", "gas/Code.gs", "CLAUDE.md"]


def current():
    m = re.search(r'SITE_URL:\s*"([^"]+)"', (ROOT / "js/config.js").read_text(encoding="utf-8"))
    return m.group(1).rstrip("/")


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    arg = sys.argv[1].strip().lower()
    if arg == "--github":
        new = GITHUB
    else:
        if not re.fullmatch(r"[a-z0-9-]+(\.[a-z0-9-]+)+", arg):
            sys.exit(f"Not a domain name: {arg}  (write it like mytokyotours.com, without https://)")
        new = "https://" + arg
    old = current()
    bare_old, bare_new = old.split("://", 1)[1], new.split("://", 1)[1]
    for f in FILES:
        p = ROOT / f
        s = p.read_text(encoding="utf-8")
        t = s.replace(old, new).replace(bare_old, bare_new)
        if t != s:
            p.write_text(t, encoding="utf-8")
            print("updated", f)
    cname = ROOT / "CNAME"
    if new == GITHUB:
        cname.unlink(missing_ok=True)
        print("removed CNAME")
    else:
        cname.write_text(bare_new + "\n", encoding="utf-8")
        print("wrote CNAME:", bare_new)
    subprocess.run([sys.executable, str(ROOT / "tools/build_blog.py")], check=True)
    # nothing generated may still point at the other address
    other = GITHUB if new != GITHUB else None
    if other:
        left = [str(p.relative_to(ROOT)) for p in ROOT.rglob("*") if p.is_file() and p.suffix in (".html", ".xml", ".txt", ".js")
                and ".git" not in p.parts and p.name != "set_domain.py" and other in p.read_text(encoding="utf-8", errors="ignore")]
        if left:
            sys.exit("Old address still found in: " + ", ".join(left))
    print("Now the site address is", new + "/")


if __name__ == "__main__":
    main()
