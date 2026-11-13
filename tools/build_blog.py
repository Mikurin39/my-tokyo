#!/usr/bin/env python3
"""Build the multilingual blog from posts/*.json.

Writes:
  blog/index.html                 language redirect
  blog/<lang>/index.html          post list per language
  blog/<lang>/<slug>/index.html   one page per post per language
  sitemap.xml                     home + every blog page with hreflang alternates
  index.html                      refreshes the "From the blog" block between BLOG markers

Standard library only (python3 tools/build_blog.py).
"""
import html
import json
import re
import shutil
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://mikurin39.github.io/my-tokyo"
POSTS_DIR = ROOT / "posts"
BLOG_DIR = ROOT / "blog"

# Order = order in the language dropdown. "en" is the default / x-default.
LANGS = {
    "en": {"label": "English", "html": "en", "og": "en_US", "font": None},
    "ja": {"label": "日本語", "html": "ja", "og": "ja_JP", "font": "Noto+Sans+JP"},
    "ko": {"label": "한국어", "html": "ko", "og": "ko_KR", "font": "Noto+Sans+KR"},
    "zh-Hant": {"label": "繁體中文", "html": "zh-Hant", "og": "zh_TW", "font": "Noto+Sans+TC"},
    "fr": {"label": "Français", "html": "fr", "og": "fr_FR", "font": None},
}
DEFAULT = "en"

UI = {
    "en": {
        "blog": "Blog", "blog_title": "My Tokyo Blog — Places I Love in Tokyo",
        "blog_desc": "Restaurants, cafés and parks in Tokyo, visited and written up by a local guide.",
        "blog_lead": "Restaurants, cafés and parks I actually go to. Real photos, honest notes.",
        "home": "Home", "tours": "Tours", "book": "Book a Tour", "lang": "Language",
        "all_posts": "← All posts", "read": "Read", "map": "Open in Google Maps",
        "place": "Place", "area": "Area", "empty": "The first posts are on their way.",
        "cta_h": "Want to go with a local?",
        "cta_p": "I can take you to places like this on a custom private tour.",
        "cta_btn": "See the tours", "by": "By Mikuri, your local guide",
        "from_blog": "From the Blog", "more": "Read the blog →",
    },
    "ja": {
        "blog": "ブログ", "blog_title": "My Tokyo ブログ｜東京の好きなお店と場所",
        "blog_desc": "東京在住のガイドが実際に行ったレストラン・カフェ・公園を紹介します。",
        "blog_lead": "自分で行って、よかったお店や場所だけを書いています。写真も全部自分で撮ったものです。",
        "home": "ホーム", "tours": "ツアー", "book": "ツアーを予約", "lang": "言語",
        "all_posts": "← 記事一覧", "read": "読む", "map": "Google マップで開く",
        "place": "お店・場所", "area": "エリア", "empty": "最初の記事を準備中です。",
        "cta_h": "地元の人と一緒に行ってみませんか？",
        "cta_p": "オーダーメイドのプライベートツアーで、こうした場所をご案内します。",
        "cta_btn": "ツアーを見る", "by": "ガイド Mikuri",
        "from_blog": "ブログ", "more": "ブログを読む →",
    },
    "ko": {
        "blog": "블로그", "blog_title": "My Tokyo 블로그 — 도쿄에서 좋아하는 곳들",
        "blog_desc": "도쿄 현지 가이드가 직접 다녀온 레스토랑, 카페, 공원을 소개합니다.",
        "blog_lead": "제가 직접 가 보고 좋았던 곳만 씁니다. 사진도 모두 직접 찍었어요.",
        "home": "홈", "tours": "투어", "book": "투어 예약", "lang": "언어",
        "all_posts": "← 전체 글", "read": "읽기", "map": "Google 지도에서 열기",
        "place": "장소", "area": "지역", "empty": "첫 글을 준비하고 있어요.",
        "cta_h": "현지인과 함께 가 보고 싶다면",
        "cta_p": "맞춤형 프라이빗 투어로 이런 곳들을 안내해 드려요.",
        "cta_btn": "투어 보기", "by": "현지 가이드 Mikuri",
        "from_blog": "블로그", "more": "블로그 보기 →",
    },
    "zh-Hant": {
        "blog": "部落格", "blog_title": "My Tokyo 部落格｜我喜歡的東京好店與景點",
        "blog_desc": "東京在地導遊親自造訪的餐廳、咖啡廳與公園。",
        "blog_lead": "只寫我自己去過、真心喜歡的地方。照片也都是我親手拍的。",
        "home": "首頁", "tours": "行程", "book": "預約行程", "lang": "語言",
        "all_posts": "← 所有文章", "read": "閱讀", "map": "在 Google 地圖開啟",
        "place": "店家・地點", "area": "區域", "empty": "第一篇文章準備中。",
        "cta_h": "想和在地人一起去嗎？",
        "cta_p": "客製化私人行程，可以帶你去這樣的地方。",
        "cta_btn": "查看行程", "by": "在地導遊 Mikuri",
        "from_blog": "部落格", "more": "閱讀部落格 →",
    },
    "fr": {
        "blog": "Blog", "blog_title": "Blog My Tokyo — Mes adresses préférées à Tokyo",
        "blog_desc": "Restaurants, cafés et parcs de Tokyo, testés et racontés par une guide locale.",
        "blog_lead": "Uniquement des endroits où je vais vraiment. Vraies photos, avis sincères.",
        "home": "Accueil", "tours": "Visites", "book": "Réserver une visite", "lang": "Langue",
        "all_posts": "← Tous les articles", "read": "Lire", "map": "Ouvrir dans Google Maps",
        "place": "Adresse", "area": "Quartier", "empty": "Les premiers articles arrivent bientôt.",
        "cta_h": "Envie d'y aller avec une locale ?",
        "cta_p": "Je peux vous emmener dans ce genre d'endroits lors d'une visite privée sur mesure.",
        "cta_btn": "Voir les visites", "by": "Mikuri, votre guide locale",
        "from_blog": "Le blog", "more": "Lire le blog →",
    },
}

CATEGORIES = {
    "restaurant": {"en": "Restaurant", "ja": "レストラン", "ko": "레스토랑", "zh-Hant": "餐廳", "fr": "Restaurant", "schema": "Restaurant"},
    "izakaya": {"en": "Izakaya", "ja": "居酒屋", "ko": "이자카야", "zh-Hant": "居酒屋", "fr": "Izakaya", "schema": "BarOrPub"},
    "cafe": {"en": "Café", "ja": "カフェ", "ko": "카페", "zh-Hant": "咖啡廳", "fr": "Café", "schema": "CafeOrCoffeeShop"},
    "sweets": {"en": "Sweets", "ja": "スイーツ", "ko": "디저트", "zh-Hant": "甜點", "fr": "Douceurs", "schema": "Bakery"},
    "bar": {"en": "Bar", "ja": "バー", "ko": "바", "zh-Hant": "酒吧", "fr": "Bar", "schema": "BarOrPub"},
    "park": {"en": "Park", "ja": "公園", "ko": "공원", "zh-Hant": "公園", "fr": "Parc", "schema": "Park"},
    "shrine": {"en": "Shrine & Temple", "ja": "神社・お寺", "ko": "신사・절", "zh-Hant": "神社・寺廟", "fr": "Sanctuaire & temple", "schema": "PlaceOfWorship"},
    "spot": {"en": "Spot", "ja": "スポット", "ko": "명소", "zh-Hant": "景點", "fr": "Lieu", "schema": "TouristAttraction"},
    "shop": {"en": "Shop", "ja": "ショップ", "ko": "숍", "zh-Hant": "商店", "fr": "Boutique", "schema": "Store"},
}

MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
             "août", "septembre", "octobre", "novembre", "décembre"]
MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def fmt_date(iso, lang):
    d = date.fromisoformat(iso)
    if lang == "ja" or lang == "zh-Hant":
        return f"{d.year}年{d.month}月{d.day}日"
    if lang == "ko":
        return f"{d.year}년 {d.month}월 {d.day}일"
    if lang == "fr":
        return f"{d.day} {MONTHS_FR[d.month - 1]} {d.year}"
    return f"{MONTHS_EN[d.month - 1]} {d.day}, {d.year}"


def esc(s):
    return html.escape(s or "", quote=True)


def inline(text):
    """Escape, then apply **bold** and [label](https://url)."""
    t = esc(text)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)",
               r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
    return t


def photo_alt(post, file, lang, caption=""):
    """photos[].alt in this language first, then the caption, then English alt, then the title."""
    alt = next((p.get("alt", {}) for p in post.get("photos", []) if p["file"] == file), {})
    return alt.get(lang) or caption or alt.get(DEFAULT) or post["i18n"][lang]["title"]


def render_body(md, post, lang, img_prefix):
    """Tiny markdown subset, line by line: ## heading, - list, ![caption](file.jpg), paragraphs."""
    out, para, items = [], [], []

    def flush():
        if para:
            out.append(f"<p>{'<br>'.join(inline(l) for l in para)}</p>")
            para.clear()
        if items:
            out.append("<ul>" + "".join(f"<li>{inline(i)}</li>" for i in items) + "</ul>")
            items.clear()

    for raw in md.strip().splitlines():
        line = raw.strip()
        img = re.fullmatch(r"!\[(.*?)\]\(([\w.\-]+)\)", line)
        if not line:
            flush()
        elif line.startswith("## "):
            flush()
            out.append(f"<h2>{inline(line[3:])}</h2>")
        elif img:
            flush()
            cap, file = img.groups()
            if not (BLOG_DIR / "img" / post["slug"] / file).exists():
                sys.exit(f"[{post['slug']}] missing photo blog/img/{post['slug']}/{file}")
            fig = (f'<figure><img src="{img_prefix}{esc(file)}" alt="{esc(photo_alt(post, file, lang, cap))}" '
                   f'loading="lazy" decoding="async">')
            if cap:
                fig += f"<figcaption>{inline(cap)}</figcaption>"
            out.append(fig + "</figure>")
        elif line.startswith("- "):
            if para:
                flush()
            items.append(line[2:])
        else:
            if items:
                flush()
            para.append(line)
    flush()
    return "\n".join(out)


def load_posts():
    posts = []
    for f in sorted(POSTS_DIR.glob("*.json")):
        p = json.loads(f.read_text(encoding="utf-8"))
        if p.get("draft"):
            continue
        if p["slug"] != f.stem:
            sys.exit(f"{f.name}: slug '{p['slug']}' must match the file name")
        if p["category"] not in CATEGORIES:
            sys.exit(f"{f.name}: unknown category '{p['category']}' (use one of {', '.join(CATEGORIES)})")
        missing = [l for l in LANGS if l not in p.get("i18n", {})]
        if missing:
            sys.exit(f"{f.name}: missing languages {missing}")
        for l, t in p["i18n"].items():
            for k in ("title", "description", "body"):
                if not t.get(k):
                    sys.exit(f"{f.name}: i18n.{l}.{k} is empty")
        maps = p["place"].get("maps_url", "")
        if maps and not maps.startswith("https://"):
            sys.exit(f"{f.name}: place.maps_url must start with https://")
        if not (BLOG_DIR / "img" / p["slug"] / p["cover"]).exists():
            sys.exit(f"{f.name}: cover photo blog/img/{p['slug']}/{p['cover']} not found")
        posts.append(p)
    posts.sort(key=lambda p: p["date"], reverse=True)
    return posts


CSS = """
:root{--navy:#1c2b4a;--text:#2b3852;--muted:#6b7280;--bg:#f6f3ee;--line:#e8e4dc;--orange:#e8622c;--orange2:#d4551f;--maxw:1060px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',var(--cjk),-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--text);line-height:1.7;font-size:16px;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:var(--orange);text-decoration:none}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 16px}
header{position:sticky;top:0;z-index:50;background:#fff;border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;height:56px;gap:12px}
.logo{display:flex;align-items:center;gap:7px;color:var(--navy);flex-shrink:0}
.logo .tower{font-size:21px}
.logo b{font-size:15.5px;font-weight:800;display:block;line-height:1.15}
.logo small{font-size:9.5px;color:var(--muted);display:block;font-weight:500}
.nav-links{display:flex;gap:18px;align-items:center;font-size:13.5px}
.nav-links a{color:var(--navy);font-weight:500}
.nav-links a:hover{color:var(--orange)}
.btn{display:inline-block;background:var(--orange);color:#fff;font-weight:600;padding:10px 20px;border-radius:7px;font-size:14px}
.btn:hover{background:var(--orange2)}
.nav-links .btn{color:#fff;padding:8px 14px;font-size:13px}
.lang{position:relative;display:flex;align-items:center}
.lang select{appearance:none;-webkit-appearance:none;font:inherit;font-size:13.5px;color:var(--navy);font-weight:500;background:#fff;border:1px solid var(--line);border-radius:7px;padding:7px 28px 7px 10px;cursor:pointer}
.lang::after{content:"";position:absolute;right:11px;top:50%;width:6px;height:6px;border-right:1.5px solid var(--navy);border-bottom:1.5px solid var(--navy);transform:translateY(-70%) rotate(45deg);pointer-events:none}
.lang select:focus-visible{outline:2px solid var(--orange);outline-offset:1px}
main{padding:36px 0 56px}
.crumb{font-size:14px;font-weight:500;color:var(--navy);display:inline-block;margin-bottom:22px}
.crumb:hover{color:var(--orange)}
/* list */
.list-head h1{font-size:30px;color:var(--navy);line-height:1.25;letter-spacing:-.01em;margin-bottom:8px}
.list-head p{color:var(--muted);max-width:560px;margin-bottom:32px}
.posts{display:grid;grid-template-columns:repeat(3,1fr);gap:36px 26px}
.post-link{color:var(--text);display:block}
.post-link .thumb{aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:var(--line);margin-bottom:12px}
.post-link .thumb img{width:100%;height:100%;object-fit:cover;transition:transform .3s}
.post-link:hover .thumb img{transform:scale(1.03)}
.meta{font-size:13px;color:var(--muted);font-weight:500}
.meta .cat{color:var(--orange);font-weight:600}
.post-link h2{font-size:18px;line-height:1.4;color:var(--navy);margin:4px 0 6px}
.post-link:hover h2{color:var(--orange)}
.post-link p{font-size:15px;color:var(--muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.empty{color:var(--muted)}
/* article */
article{max-width:720px;margin:0 auto}
article h1{font-size:clamp(26px,4vw,34px);color:var(--navy);line-height:1.3;letter-spacing:-.01em;margin:8px 0 10px}
.byline{font-size:14px;color:var(--muted);margin-bottom:24px}
.cover{border-radius:10px;overflow:hidden;margin-bottom:30px}
.cover img{width:100%;max-height:520px;object-fit:cover}
.body p{margin-bottom:1.15em}
.body h2{font-size:21px;color:var(--navy);line-height:1.4;margin:1.8em 0 .6em}
.body ul{margin:0 0 1.15em 1.2em}
.body li{margin-bottom:.3em}
.body strong{color:var(--navy)}
.body a{text-decoration:underline;text-underline-offset:3px}
.body figure{margin:1.6em 0}
.body figure img{border-radius:8px;width:100%}
.body figcaption{font-size:14px;color:var(--muted);margin-top:8px}
.place{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:22px 0;margin:36px 0 28px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.place dl{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;font-size:15px}
.place dt{color:var(--muted)}
.place dd{color:var(--navy);font-weight:600}
.btn-line{display:inline-block;border:1.5px solid var(--navy);color:var(--navy);font-weight:600;font-size:14px;padding:9px 16px;border-radius:7px}
.btn-line:hover{border-color:var(--orange);color:var(--orange)}
.cta{background:#fff;border-radius:10px;padding:24px;display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}
.cta b{display:block;color:var(--navy);font-size:17px;margin-bottom:2px}
.cta p{color:var(--muted);font-size:15px}
footer{border-top:1px solid var(--line);padding:22px 0;font-size:13px;color:var(--muted)}
footer .wrap{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
footer a{color:var(--navy)}
@media(max-width:880px){.posts{grid-template-columns:1fr 1fr}.nav-links .hide-sm{display:none}}
@media(max-width:560px){
  .posts{grid-template-columns:1fr;gap:30px}
  .logo small{display:none}
  .nav-links{gap:10px}
  .nav-links .btn{display:none}
  main{padding:24px 0 44px}
  .list-head h1{font-size:25px}
  .cover{margin:0 -16px 24px;border-radius:0}
  .cta{padding:20px}
}
"""


def head(lang, title, desc, canonical, alternates, og_image, og_type, jsonld, depth):
    meta = LANGS[lang]
    alt_links = "\n".join(
        f'<link rel="alternate" hreflang="{LANGS[l]["html"]}" href="{u}">' for l, u in alternates.items())
    alt_links += f'\n<link rel="alternate" hreflang="x-default" href="{alternates[DEFAULT]}">'
    fams = "family=Inter:wght@400;500;600;700;800"
    cjk = "sans-serif"
    if meta["font"]:
        fams += f"&family={meta['font']}:wght@400;500;700"
        cjk = f"'{meta['font'].replace('+', ' ')}'"
    ld = json.dumps(jsonld, ensure_ascii=False).replace("<", "\\u003c")  # no </script> breakout
    return f"""<!DOCTYPE html>
<html lang="{meta['html']}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canonical}">
{alt_links}
<meta property="og:type" content="{og_type}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{og_image}">
<meta property="og:locale" content="{meta['og']}">
<meta property="og:site_name" content="My Tokyo">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🗼</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?{fams}&display=swap" rel="stylesheet">
<script type="application/ld+json">{ld}</script>
<style>:root{{--cjk:{cjk}}}{CSS}</style>
</head>
<body>
"""


def header(lang, switch_urls, depth):
    ui = UI[lang]
    home = "../" * depth
    opts = "".join(
        f'<option value="{u}"{" selected" if l == lang else ""}>{LANGS[l]["label"]}</option>'
        for l, u in switch_urls.items())
    return f"""<header>
  <div class="wrap nav">
    <a href="{home}" class="logo"><span class="tower">🗼</span><span><b>My Tokyo</b><small>Your Local Friend in Tokyo</small></span></a>
    <nav class="nav-links">
      <a href="{home}" class="hide-sm">{ui['home']}</a>
      <a href="{home}#tours" class="hide-sm">{ui['tours']}</a>
      <a href="{home}blog/{lang}/" class="hide-sm">{ui['blog']}</a>
      <label class="lang"><span hidden>{ui['lang']}</span>
        <select id="langSel" aria-label="{ui['lang']}" autocomplete="off" onchange="location.href=this.value">{opts}</select>
      </label>
      <script>addEventListener('pageshow',function(){{var s=document.getElementById('langSel');s.value=s.querySelector('[selected]').value}})</script>
      <a href="{home}#book" class="btn">{ui['book']}</a>
    </nav>
  </div>
</header>
"""


def footer(lang, depth):
    home = "../" * depth
    return f"""<footer>
  <div class="wrap">
    <span>© {date.today().year} My Tokyo · Tokyo, Japan</span>
    <span><a href="{home}">mikurin39.github.io/my-tokyo</a> · <a href="https://www.instagram.com/mytokyo39/" target="_blank" rel="noopener">Instagram</a></span>
  </div>
</footer>
<script>try{{localStorage.setItem('mytokyo_lang','{lang}')}}catch(e){{}}</script>
</body>
</html>
"""


def post_url(lang, slug=None):
    return f"{SITE}/blog/{lang}/" + (f"{slug}/" if slug else "")


def render_post(p, lang):
    t = p["i18n"][lang]
    ui = UI[lang]
    cat = CATEGORIES[p["category"]]
    slug = p["slug"]
    img_prefix = f"../../img/{slug}/"
    alternates = {l: post_url(l, slug) for l in LANGS}
    switch = {l: f"../../{l}/{slug}/" for l in LANGS}
    cover_abs = f"{SITE}/blog/img/{slug}/{p['cover']}"
    place = p["place"]
    place_ld = {"@type": cat["schema"], "name": place["name"]}
    if place.get("maps_url"):
        place_ld["hasMap"] = place["maps_url"]
    if place.get("area"):
        place_ld["address"] = {"@type": "PostalAddress", "addressLocality": place["area"], "addressRegion": "Tokyo", "addressCountry": "JP"}
    jsonld = {
        "@context": "https://schema.org", "@type": "BlogPosting",
        "headline": t["title"], "description": t["description"], "inLanguage": LANGS[lang]["html"],
        "datePublished": p["date"], "dateModified": p.get("updated", p["date"]),
        "image": [cover_abs], "mainEntityOfPage": post_url(lang, slug),
        "author": {"@type": "Person", "name": "Mikuri", "url": f"{SITE}/#about"},
        "publisher": {"@type": "Organization", "name": "My Tokyo", "url": f"{SITE}/"},
        "about": place_ld,
    }
    place_name = esc(place["name"])
    if place.get("name_local") and place["name_local"] != place["name"]:
        place_name += f' <span style="font-weight:500;color:var(--muted)">{esc(place["name_local"])}</span>'
    rows = f"<dt>{ui['place']}</dt><dd>{place_name}</dd>"
    area = (place.get("area_i18n") or {}).get(lang) or place.get("area")
    if area:
        rows += f"<dt>{ui['area']}</dt><dd>{esc(area)}</dd>"
    map_btn = (f'<a class="btn-line" href="{esc(place["maps_url"])}" target="_blank" rel="noopener">{ui["map"]}</a>'
               if place.get("maps_url") else "")
    out = head(lang, f"{t['title']} | My Tokyo", t["description"], post_url(lang, slug), alternates,
               cover_abs, "article", jsonld, 3)
    out += header(lang, switch, 3)
    out += f"""<main>
  <div class="wrap">
    <article>
      <a class="crumb" href="../">{ui['all_posts']}</a>
      <div class="meta"><span class="cat">{cat[lang]}</span> · {esc(area or '')}{' · ' if area else ''}<time datetime="{p['date']}">{fmt_date(p['date'], lang)}</time></div>
      <h1>{esc(t['title'])}</h1>
      <p class="byline">{ui['by']}</p>
      <div class="cover"><img src="{img_prefix}{esc(p['cover'])}" alt="{esc(photo_alt(p, p['cover'], lang))}" fetchpriority="high"></div>
      <div class="body">
{render_body(t['body'], p, lang, img_prefix)}
      </div>
      <div class="place"><dl>{rows}</dl>{map_btn}</div>
      <div class="cta"><div><b>{ui['cta_h']}</b><p>{ui['cta_p']}</p></div><a class="btn" href="../../../#tours">{ui['cta_btn']}</a></div>
    </article>
  </div>
</main>
"""
    out += footer(lang, 3)
    return out


def card(p, lang, href, img_src, heading="h2"):
    t = p["i18n"][lang]
    cat = CATEGORIES[p["category"]][lang]
    return (f'<a class="post-link" href="{href}"><div class="thumb"><img src="{img_src}" '
            f'alt="{esc(photo_alt(p, p["cover"], lang))}" loading="lazy" decoding="async"></div>'
            f'<div class="meta"><span class="cat">{cat}</span> · <time datetime="{p["date"]}">{fmt_date(p["date"], lang)}</time></div>'
            f'<{heading}>{esc(t["title"])}</{heading}><p>{esc(t["description"])}</p></a>')


def render_list(posts, lang):
    ui = UI[lang]
    alternates = {l: post_url(l) for l in LANGS}
    switch = {l: f"../{l}/" for l in LANGS}
    jsonld = {"@context": "https://schema.org", "@type": "Blog", "name": ui["blog_title"],
              "inLanguage": LANGS[lang]["html"], "url": post_url(lang),
              "author": {"@type": "Person", "name": "Mikuri"}}
    og = f"{SITE}/blog/img/{posts[0]['slug']}/{posts[0]['cover']}" if posts else f"{SITE}/og.jpg"
    out = head(lang, ui["blog_title"], ui["blog_desc"], post_url(lang), alternates, og, "website", jsonld, 2)
    out += header(lang, switch, 2)
    if posts:
        cards = "\n".join(card(p, lang, f"{p['slug']}/", f"../img/{p['slug']}/{p['cover']}") for p in posts)
        body = f'<div class="posts">\n{cards}\n</div>'
    else:
        body = f'<p class="empty">{ui["empty"]}</p>'
    out += f"""<main>
  <div class="wrap">
    <div class="list-head"><h1>{ui['blog_title']}</h1><p>{ui['blog_lead']}</p></div>
    {body}
  </div>
</main>
"""
    out += footer(lang, 2)
    return out


REDIRECT = """<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>My Tokyo Blog</title>
<meta name="robots" content="noindex">
<script>
(function(){
  var langs=%(langs)s, pick='en';
  try{var s=localStorage.getItem('mytokyo_lang'); if(s&&langs.indexOf(s)>-1){location.replace(s+'/');return;}}catch(e){}
  var n=(navigator.languages||[navigator.language||'en']);
  for(var i=0;i<n.length;i++){var l=(n[i]||'').toLowerCase();
    if(l.indexOf('zh')===0){pick='zh-Hant';break}
    var b=l.split('-')[0]; if(langs.indexOf(b)>-1){pick=b;break}}
  location.replace(pick+'/');
})();
</script>
<meta http-equiv="refresh" content="2;url=en/">
</head><body><a href="en/">My Tokyo Blog</a></body></html>
"""


def home_block(posts):
    if not posts:
        return ""
    cards = "\n".join(card(p, DEFAULT, f"blog/{DEFAULT}/{p['slug']}/", f"blog/img/{p['slug']}/{p['cover']}", "h3")
                      for p in posts[:3])
    return f"""<section id="blog" style="padding-top:0">
  <style>
  #blog .posts{{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}}
  #blog .post-link{{color:var(--text);display:block}}
  #blog .thumb{{aspect-ratio:4/3;border-radius:8px;overflow:hidden;margin-bottom:10px;background:var(--line)}}
  #blog .thumb img{{width:100%;height:100%;object-fit:cover}}
  #blog .meta{{font-size:12px;color:var(--muted);font-weight:500}}
  #blog .meta .cat{{color:var(--orange);font-weight:600}}
  #blog h3{{font-size:15.5px;color:var(--navy);line-height:1.4;margin:3px 0 4px}}
  #blog .post-link:hover h3{{color:var(--orange)}}
  #blog p{{font-size:13px;color:var(--muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}
  @media(max-width:880px){{#blog .posts{{grid-template-columns:1fr 1fr}}}}
  @media(max-width:520px){{#blog .posts{{grid-template-columns:1fr}}}}
  </style>
  <div class="wrap">
    <div class="sec-head">
      <h2>{UI[DEFAULT]['from_blog']}</h2>
      <a href="blog/" class="sec-link">{UI[DEFAULT]['more']}</a>
    </div>
    <div class="posts">
{cards}
    </div>
  </div>
</section>"""


def replace_between(text, start, end, new):
    pat = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    if not pat.search(text):
        sys.exit(f"index.html: markers {start} / {end} not found")
    return pat.sub(lambda _: f"{start}{new}{end}", text, count=1)


def update_home(posts):
    path = ROOT / "index.html"
    text = path.read_text(encoding="utf-8")
    text = replace_between(text, "<!--BLOG-SECTION-->", "<!--/BLOG-SECTION-->",
                           ("\n" + home_block(posts) + "\n") if posts else "")
    nav = '<a href="blog/">Blog</a>' if posts else ""
    text = replace_between(text, "<!--BLOG-NAV-->", "<!--/BLOG-NAV-->", nav)
    text = replace_between(text, "<!--BLOG-FOOT-->", "<!--/BLOG-FOOT-->", nav)
    path.write_text(text, encoding="utf-8")


def write_sitemap(posts):
    home_lastmod = "2026-08-11"
    urls = [f"""  <url>
    <loc>{SITE}/</loc>
    <lastmod>{max([home_lastmod] + [p['date'] for p in posts])}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>"""]

    def group(loc_fn, lastmod):
        alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{LANGS[l]["html"]}" href="{loc_fn(l)}"/>' for l in LANGS)
        alts += f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{loc_fn(DEFAULT)}"/>'
        for l in LANGS:
            urls.append(f"  <url>\n    <loc>{loc_fn(l)}</loc>\n    <lastmod>{lastmod}</lastmod>{alts}\n  </url>")

    if posts:
        group(lambda l: post_url(l), posts[0]["date"])
        for p in posts:
            group(lambda l, s=p["slug"]: post_url(l, s), p.get("updated", p["date"]))
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + "\n".join(urls) + "\n</urlset>\n", encoding="utf-8")


def main():
    posts = load_posts()
    # Rebuild generated pages from scratch so deleted posts disappear.
    for l in LANGS:
        d = BLOG_DIR / l
        shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True)
        (d / "index.html").write_text(render_list(posts, l), encoding="utf-8")
        for p in posts:
            pd = d / p["slug"]
            pd.mkdir(exist_ok=True)
            (pd / "index.html").write_text(render_post(p, l), encoding="utf-8")
    (BLOG_DIR / "index.html").write_text(REDIRECT % {"langs": json.dumps(list(LANGS))}, encoding="utf-8")
    update_home(posts)
    write_sitemap(posts)
    print(f"built {len(posts)} post(s) x {len(LANGS)} languages")


if __name__ == "__main__":
    main()
