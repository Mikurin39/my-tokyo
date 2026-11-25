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
SITE = "https://okaeritrip.com"
POSTS_DIR = ROOT / "posts"
BLOG_DIR = ROOT / "blog"

# Order = order in the language dropdown. "en" is the default / x-default.
LANGS = {
    "en": {"label": "English", "html": "en", "og": "en_US", "font": None, "serif": None},
    "ja": {"label": "日本語", "html": "ja", "og": "ja_JP", "font": "Noto+Sans+JP", "serif": "Noto+Serif+JP"},
    "ko": {"label": "한국어", "html": "ko", "og": "ko_KR", "font": "Noto+Sans+KR", "serif": "Noto+Serif+KR"},
    "zh-Hant": {"label": "繁體中文", "html": "zh-Hant", "og": "zh_TW", "font": "Noto+Sans+TC", "serif": "Noto+Serif+TC"},
    "fr": {"label": "Français", "html": "fr", "og": "fr_FR", "font": None, "serif": None},
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
        "from_blog": "Blog", "more": "Read the blog",
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
        "from_blog": "ブログ", "more": "ブログを読む",
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
        "from_blog": "블로그", "more": "블로그 보기",
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
        "from_blog": "部落格", "more": "閱讀部落格",
    },
    "fr": {
        "blog": "Blog", "blog_title": "Blog My Tokyo — Mes adresses préférées à Tokyo",
        "blog_desc": "Restaurants, cafés et parcs de Tokyo, testés et racontés par quelqu'un qui y vit.",
        "blog_lead": "Uniquement des endroits où je vais vraiment. Vraies photos, avis sincères.",
        "home": "Accueil", "tours": "Visites", "book": "Réserver une visite", "lang": "Langue",
        "all_posts": "← Tous les articles", "read": "Lire", "map": "Ouvrir dans Google Maps",
        "place": "Adresse", "area": "Quartier", "empty": "Les premiers articles arrivent bientôt.",
        "cta_h": "Envie d'y aller avec quelqu'un d'ici ?",
        "cta_p": "Je peux vous emmener dans ce genre d'endroits lors d'une visite privée sur mesure.",
        "cta_btn": "Voir les visites", "by": "Mikuri, votre guide à Tokyo",
        "from_blog": "Le blog", "more": "Lire le blog",
    },
}

UI_POST = {
    "en": {"published": "Published", "updated": "Updated", "role": "Local guide in Tokyo", "tip": "My tip",
           "essentials": "The essentials", "access": "Getting there", "price": "Price",
           "good_for": "Best for", "directions": "Directions on Google Maps",
           "bio_h": "Hi, I'm Mikuri",
           "bio_p": "I grew up in Okinawa and moved to Tokyo, where I explored the city one neighborhood at a time. I write about the places I actually go to, and I guide small private tours to them.",
           "bio_link": "Tour with me →", "related": "More from the blog"},
    "ja": {"published": "公開", "updated": "更新", "role": "東京のローカルガイド", "tip": "ひとことメモ",
           "essentials": "お店の基本情報", "access": "アクセス", "price": "予算",
           "good_for": "こんな人に", "directions": "Google マップで道順を見る",
           "bio_h": "こんにちは、Mikuri です",
           "bio_p": "沖縄で生まれ育ち、東京に引っ越してから街をひとつずつ歩いてきました。自分で行ったお店や場所だけを書いていて、そうした場所を案内する少人数のプライベートツアーもしています。",
           "bio_link": "ツアーを見る →", "related": "ほかの記事"},
    "ko": {"published": "게시", "updated": "업데이트", "role": "도쿄 현지 가이드", "tip": "작은 팁",
           "essentials": "기본 정보", "access": "가는 방법", "price": "가격",
           "good_for": "이런 분께", "directions": "Google 지도에서 길찾기",
           "bio_h": "안녕하세요, Mikuri예요",
           "bio_p": "오키나와에서 나고 자라 도쿄로 이사 온 뒤, 동네를 하나씩 걸어 다니며 알아 왔어요. 직접 가 본 곳만 글로 쓰고, 그런 곳을 안내하는 소규모 프라이빗 투어도 하고 있어요.",
           "bio_link": "투어 보기 →", "related": "블로그의 다른 글"},
    "zh-Hant": {"published": "發布", "updated": "更新", "role": "東京在地導遊", "tip": "小提醒",
                "essentials": "基本資訊", "access": "交通", "price": "價格",
                "good_for": "推薦給", "directions": "用 Google 地圖導航",
                "bio_h": "嗨，我是 Mikuri",
                "bio_p": "我在沖繩長大，搬到東京後一區一區地走遍這座城市。這裡只寫我自己去過的店家和地點，我也帶小團的私人行程去這些地方。",
                "bio_link": "查看行程 →", "related": "更多文章"},
    "fr": {"published": "Publié le", "updated": "Mis à jour le", "role": "Guide à Tokyo", "tip": "Mon conseil",
           "essentials": "Infos pratiques", "access": "Comment y aller", "price": "Prix",
           "good_for": "Idéal pour", "directions": "Itinéraire sur Google Maps",
           "bio_h": "Bonjour, moi c'est Mikuri",
           "bio_p": "J'ai grandi à Okinawa, puis Tokyo est devenue ma ville : je l'explore quartier par quartier. Je n'écris que sur les endroits où je vais vraiment, et j'y emmène de petits groupes en visite privée.",
           "bio_link": "Visiter avec moi →", "related": "À lire aussi"},
}
for _l in UI:
    UI[_l].update(UI_POST[_l])

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
    """Tiny markdown subset, line by line: ## heading, - list, > tip, ![caption](file.jpg), paragraphs."""
    out, para, items, tip = [], [], [], []

    def flush():
        if para:
            out.append(f"<p>{'<br>'.join(inline(l) for l in para)}</p>")
            para.clear()
        if items:
            out.append("<ul>" + "".join(f"<li>{inline(i)}</li>" for i in items) + "</ul>")
            items.clear()
        if tip:
            out.append(f'<aside class="tip"><b>{UI[lang]["tip"]}</b><p>{"<br>".join(inline(l) for l in tip)}</p></aside>')
            tip.clear()

    for raw in md.strip().splitlines():
        line = raw.strip()
        img = re.fullmatch(r"!\[(.*?)\]\(([\w.\-]+)\)", line)
        if not line:
            flush()
        elif line.startswith("> "):
            if para or items:
                flush()
            tip.append(line[2:])
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
            if para or tip:
                flush()
            items.append(line[2:])
        else:
            if items or tip:
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
:root{--navy:#1f1c19;--text:#2c2925;--muted:#6c675f;--bg:#f6f3ed;--line:#ddd7cc;--orange:#c2452d;--orange2:#a63a25;--maxw:1060px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',var(--cjk),-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--text);line-height:1.7;font-size:16px;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:var(--orange);text-decoration:none}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 16px}
header{position:sticky;top:0;z-index:50;background:#fff;border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;height:56px;gap:12px}
.logo{display:flex;align-items:center;gap:7px;color:var(--navy);flex-shrink:0}
.logo img{height:52px;width:auto;display:block}
@media(max-width:600px){.logo img{height:44px}}
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
.meta .cat{color:var(--orange);font-weight:600;margin-right:12px}
.post-link h2,.post-link h3{font-family:'Fraunces',var(--cjk-serif),Georgia,serif;font-size:20px;line-height:1.3;color:var(--navy);margin:4px 0 6px}
.post-link:hover h2,.post-link:hover h3{color:var(--orange)}
.post-link p{font-size:16px;line-height:1.7;color:var(--muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.empty{color:var(--muted)}
/* article */
article{max-width:680px;margin:0 auto}
.post-head{max-width:680px;margin:0 auto}
.serif,.post-head h1,.body h2,.ess h2,.bio h2,.related h2,.list-head h1,.post-link h2{font-family:'Fraunces',var(--cjk-serif),Georgia,serif;font-weight:700;letter-spacing:-.005em}
.kicker{font-size:13px;font-weight:600;color:var(--muted);letter-spacing:.02em}
.kicker .cat{color:var(--orange);text-transform:uppercase;letter-spacing:.08em;font-size:12px}
article h1,.post-head h1{font-size:clamp(30px,5vw,44px);color:var(--navy);line-height:1.18;margin:10px 0 14px}
.dek{font-size:19px;line-height:1.55;color:#4a5568;margin-bottom:22px}
.author{display:flex;align-items:center;gap:12px;font-size:14px;color:var(--muted);margin-bottom:26px}
.author img{width:44px;height:44px;border-radius:50%;object-fit:cover}
.author b{color:var(--navy);display:block;font-size:15px}
.cover{max-width:960px;margin:0 auto 34px}
.cover img{width:100%;max-height:640px;object-fit:cover;border-radius:6px}
.body{font-size:17.5px;line-height:1.8}
.body>p:first-child{font-size:19.5px;line-height:1.7;color:var(--navy)}
.body p{margin-bottom:1.2em}
.body h2{font-size:26px;color:var(--navy);line-height:1.3;margin:1.9em 0 .55em}
.body ul{margin:0 0 1.2em 1.2em}
.body li{margin-bottom:.35em}
.body li::marker{color:var(--orange)}
.body strong{color:var(--navy)}
.body a{text-decoration:underline;text-underline-offset:3px}
.body figure{margin:1.8em 0}
.body figure img{border-radius:6px;width:100%;max-height:760px;object-fit:cover}
.body figcaption{font-size:14.5px;font-style:italic;color:var(--muted);margin-top:8px;text-align:center}
.tip{border-left:3px solid var(--orange);background:#fbefe6;padding:14px 18px;margin:1.6em 0;border-radius:0 6px 6px 0}
.tip b{display:block;font-size:12.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--orange2);margin-bottom:4px}
.tip p{margin:0;font-size:16.5px}
.ess{margin:44px 0 0;padding:26px 0;border-top:2px solid var(--navy);border-bottom:1px solid var(--line)}
.ess h2{font-size:22px;color:var(--navy);margin-bottom:14px}
.ess dl{display:grid;grid-template-columns:max-content 1fr;gap:9px 22px;font-size:16px;margin-bottom:18px}
.ess dt{color:var(--muted);font-weight:500}
.ess dd{color:var(--navy)}
.ess dd b{font-weight:700}
.btn-line{display:inline-block;border:1.5px solid var(--navy);color:var(--navy);font-weight:600;font-size:14px;padding:9px 16px;border-radius:7px}
.btn-line:hover{border-color:var(--orange);color:var(--orange)}
.bio{display:grid;grid-template-columns:84px 1fr;gap:18px;align-items:start;margin:36px 0 0;padding:24px;background:#fff;border-radius:8px}
.bio img{width:84px;height:84px;border-radius:50%;object-fit:cover}
.bio h2{font-size:20px;color:var(--navy);margin-bottom:4px}
.bio p{font-size:16px;color:var(--text);margin-bottom:8px;line-height:1.7}
.bio a{font-weight:600;font-size:15px}
.related{max-width:960px;margin:56px auto 0}
.related h2{font-size:24px;color:var(--navy);margin-bottom:18px}
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
  .cover{margin:0 -16px 26px}
  .cover img{border-radius:0;max-height:520px}
  .dek{font-size:17.5px}
  .body{font-size:17px}
  .body>p:first-child{font-size:18px}
  .body h2{font-size:23px}
  .bio{grid-template-columns:60px 1fr;padding:18px;gap:14px}
  .bio img{width:60px;height:60px}
  .ess dl{grid-template-columns:1fr;gap:2px}
  .ess dd{margin-bottom:10px}
}
"""


def head(lang, title, desc, canonical, alternates, og_image, og_type, jsonld, depth):
    meta = LANGS[lang]
    alt_links = "\n".join(
        f'<link rel="alternate" hreflang="{LANGS[l]["html"]}" href="{u}">' for l, u in alternates.items())
    alt_links += f'\n<link rel="alternate" hreflang="x-default" href="{alternates[DEFAULT]}">'
    fams = "family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700"
    cjk, cjk_serif = "sans-serif", "serif"
    if meta["font"]:
        fams += f"&family={meta['font']}:wght@400;500;700&family={meta['serif']}:wght@700"
        cjk = f"'{meta['font'].replace('+', ' ')}'"
        cjk_serif = f"'{meta['serif'].replace('+', ' ')}'"
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
<link rel="icon" type="image/png" sizes="32x32" href="{SITE}/img/icon-32.png">
<link rel="apple-touch-icon" href="{SITE}/img/icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?{fams}&display=swap" rel="stylesheet">
<script type="application/ld+json">{ld}</script>
<style>:root{{--cjk:{cjk};--cjk-serif:{cjk_serif}}}{CSS}</style>
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
    <a href="{home}" class="logo"><img src="{home}img/logo.png" alt="My Tokyo" width="249" height="144"></a>
    <nav class="nav-links">
      <a href="{home}" class="hide-sm">{ui['home']}</a>
      <a href="{home}#tours" class="hide-sm">{ui['tours']}</a>
      <a href="{home}blog/{lang}/" class="hide-sm">{ui['blog']}</a>
      <label class="lang"><span hidden>{ui['lang']}</span>
        <select id="langSel" aria-label="{ui['lang']}" autocomplete="off" onchange="location.href=this.value">{opts}</select>
      </label>
      <script>addEventListener('pageshow',function(){{var s=document.getElementById('langSel');s.value=s.querySelector('[selected]').value}})</script>
      <a href="{home}#tours" class="btn">{ui['book']}</a>
    </nav>
  </div>
</header>
"""


def footer(lang, depth):
    home = "../" * depth
    return f"""<footer>
  <div class="wrap">
    <span>© {date.today().year} My Tokyo · Tokyo, Japan</span>
    <span><a href="{home}">okaeritrip.com</a> · <a href="https://www.instagram.com/mytokyo39/" target="_blank" rel="noopener">Instagram</a></span>
  </div>
</footer>
<script>try{{localStorage.setItem('mytokyo_lang','{lang}')}}catch(e){{}}</script>
</body>
</html>
"""


def post_url(lang, slug=None):
    return f"{SITE}/blog/{lang}/" + (f"{slug}/" if slug else "")


def render_post(p, lang, posts):
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
    area = (place.get("area_i18n") or {}).get(lang) or place.get("area")
    info = t.get("info", {})
    rows = f"<dt>{ui['place']}</dt><dd><b>{esc(place['name'])}</b></dd>"
    if area:
        rows += f"<dt>{ui['area']}</dt><dd>{esc(area)}</dd>"
    for key in ("access", "price", "good_for"):
        if info.get(key):
            rows += f"<dt>{ui[key]}</dt><dd>{inline(info[key])}</dd>"
    map_btn = (f'<a class="btn-line" href="{esc(place["maps_url"])}" target="_blank" rel="noopener">{ui["directions"]}</a>'
               if place.get("maps_url") else "")
    if p.get("updated"):
        when = f'{ui["updated"]} <time datetime="{p["updated"]}">{fmt_date(p["updated"], lang)}</time>'
    else:
        when = f'{ui["published"]} <time datetime="{p["date"]}">{fmt_date(p["date"], lang)}</time>'
    others = [o for o in posts if o["slug"] != slug][:3]
    related = ""
    if others:
        cards = "\n".join(card(o, lang, f"../{o['slug']}/", f"../../img/{o['slug']}/{o['cover']}", "h3") for o in others)
        related = f'<section class="related"><h2>{ui["related"]}</h2><div class="posts">\n{cards}\n</div></section>'
    out = head(lang, f"{t['title']} | My Tokyo", t["description"], post_url(lang, slug), alternates,
               cover_abs, "article", jsonld, 3)
    out += header(lang, switch, 3)
    out += f"""<main>
  <div class="wrap">
    <div class="post-head">
      <a class="crumb" href="../">{ui['all_posts']}</a>
      <div class="kicker"><span class="cat">{cat[lang]}</span>{' · ' + esc(area) if area else ''}</div>
      <h1>{esc(t['title'])}</h1>
      <p class="dek">{esc(t['description'])}</p>
      <div class="author"><img src="../../../img/mikuri.jpg" alt="Mikuri" width="44" height="44"><div><b>Mikuri</b>{ui['role']} · {when}</div></div>
    </div>
    <div class="cover"><img src="{img_prefix}{esc(p['cover'])}" alt="{esc(photo_alt(p, p['cover'], lang))}" fetchpriority="high"></div>
    <article>
      <div class="body">
{render_body(t['body'], p, lang, img_prefix)}
      </div>
      <section class="ess"><h2>{ui['essentials']}</h2><dl>{rows}</dl>{map_btn}</section>
      <aside class="bio"><img src="../../../img/mikuri.jpg" alt="Mikuri" loading="lazy"><div><h2>{ui['bio_h']}</h2><p>{ui['bio_p']}</p><a href="../../../#tours">{ui['bio_link']}</a></div></aside>
    </article>
    {related}
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
            f'<div class="meta"><span class="cat">{cat}</span><time datetime="{p["date"]}">{fmt_date(p["date"], lang)}</time></div>'
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
    """Home page: a sliding row of blog cards (photo, category, title)."""
    if not posts:
        return ""
    cards = "\n".join(
        f'<a class="bcard" href="blog/{DEFAULT}/{p["slug"]}/" data-blog-slug="{p["slug"]}"><span class="bthumb"><img src="blog/img/{p["slug"]}/{p["cover"]}" '
        f'alt="{esc(photo_alt(p, p["cover"], DEFAULT))}" loading="lazy" decoding="async"></span>'
        f'<span class="bcat" data-tr="{esc(json.dumps({l: CATEGORIES[p["category"]][l] for l in LANGS}, ensure_ascii=False))}">{CATEGORIES[p["category"]][DEFAULT]}</span>'
        f'<span class="btitle" data-tr="{esc(json.dumps({l: p["i18n"][l]["title"] for l in LANGS}, ensure_ascii=False))}">{esc(p["i18n"][DEFAULT]["title"])}</span></a>'
        for p in posts[:12])
    return f"""<section id="blog">
  <div class="wrap">
    <div class="sec-head">
      <h2 data-i18n="nav.blog">{UI[DEFAULT]['from_blog']}</h2>
      <a href="blog/" class="sec-link" data-i18n="home.readBlog">{UI[DEFAULT]['more']}</a>
    </div>
    <div class="hcar" data-carousel>
      <button type="button" class="hcar-btn prev" aria-label="Previous posts" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <div class="hcar-track blog-track">
{cards}
      </div>
      <button type="button" class="hcar-btn next" aria-label="More posts" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
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
    nav = '<a href="blog/" data-i18n="nav.blog">Blog</a>' if posts else ""
    text = replace_between(text, "<!--BLOG-NAV-->", "<!--/BLOG-NAV-->", nav)
    text = replace_between(text, "<!--BLOG-FOOT-->", "<!--/BLOG-FOOT-->", nav)
    path.write_text(text, encoding="utf-8")


PAGES_LASTMOD = "2026-11-24"   # change when the home page or tour pages change


def tour_keys():
    """Tour ids in page order, read from js/tours.js (order:[...])."""
    m = re.search(r'order\s*:\s*\[([^\]]*)\]', (ROOT / "js" / "tours.js").read_text(encoding="utf-8"))
    keys = re.findall(r'["\']([^"\']+)["\']', m.group(1)) if m else []
    if not keys:
        sys.exit("tools/build_blog.py: could not read the tour list (order:[...]) from js/tours.js")
    return keys


def write_sitemap(posts):
    urls = []

    def page(path, lastmod, priority):
        """Home and tour pages: the language comes from ?lang= (English has none)."""
        def loc(l):
            q = [x for x in [path.split("?", 1)[1] if "?" in path else "", "" if l == DEFAULT else f"lang={l}"] if x]
            return f"{SITE}/{path.split('?', 1)[0]}" + ("?" + "&amp;".join(q) if q else "")
        alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{l}" href="{loc(l)}"/>' for l in LANGS)
        alts += f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{loc(DEFAULT)}"/>'
        for l in LANGS:
            urls.append(f"  <url>\n    <loc>{loc(l)}</loc>\n    <lastmod>{lastmod}</lastmod>\n    <priority>{priority}</priority>{alts}\n  </url>")

    page("", max([PAGES_LASTMOD] + [p['date'] for p in posts]), "1.0")
    for k in tour_keys():
        page(f"tour.html?t={k}", PAGES_LASTMOD, "0.8")

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
            (pd / "index.html").write_text(render_post(p, l, posts), encoding="utf-8")
    (BLOG_DIR / "index.html").write_text(REDIRECT % {"langs": json.dumps(list(LANGS))}, encoding="utf-8")
    update_home(posts)
    write_sitemap(posts)
    print(f"built {len(posts)} post(s) x {len(LANGS)} languages")


if __name__ == "__main__":
    main()
