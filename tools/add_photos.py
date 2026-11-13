#!/usr/bin/env python3
"""Copy photos into blog/img/<slug>/ as web-sized JPEGs with all metadata removed.

iPhone photos carry GPS coordinates in EXIF; this strips them (and everything else).
HEIC is supported. Files are numbered after the highest existing NN.jpg.

  uv run --with pillow --with pillow-heif python tools/add_photos.py <slug> <photo> [<photo> ...]
"""
import io
import re
import sys
from pathlib import Path

from PIL import Image, ImageCms, ImageOps

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

MAX_SIDE = 1600
ROOT = Path(__file__).resolve().parent.parent


def to_srgb(im):
    """RGB image in sRGB. iPhone shoots Display P3, so convert before the profile is dropped."""
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im)
    icc = im.info.get("icc_profile")
    if icc:
        try:
            src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            return ImageCms.profileToProfile(im, src, ImageCms.createProfile("sRGB"), outputMode="RGB")
        except ImageCms.PyCMSError:
            pass
    return im.convert("RGB")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    slug, files = sys.argv[1], sys.argv[2:]
    out_dir = ROOT / "blog" / "img" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    nums = [int(m.group(1)) for f in out_dir.glob("*.jpg") if (m := re.fullmatch(r"(\d+)\.jpg", f.name))]
    n = max(nums, default=0)
    for src in files:
        n += 1
        im = ImageOps.exif_transpose(Image.open(src))  # bake in rotation before dropping EXIF
        im = to_srgb(im)
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        # Re-create the image from raw pixels so no EXIF/XMP/ICC metadata survives.
        clean = Image.frombytes("RGB", im.size, im.tobytes())
        dest = out_dir / f"{n:02d}.jpg"
        clean.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
        print(f"{src} -> {dest.relative_to(ROOT)} {clean.size[0]}x{clean.size[1]}")


if __name__ == "__main__":
    main()
