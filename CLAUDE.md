# CLAUDE.md — My Tokyo（mikurin39.github.io/my-tokyo）

英語のツアーガイド予約サイト。GitHub Pages で `main` を push すると数十秒で公開される静的サイト（ビルドサーバーなし）。

## ブログ記事を追加する（「この店の記事にして」「ブログに上げて」）

MIKURI がスマホの Claude アプリから、写真・Google マップのリンク・感想（日本語の話し言葉）を送ってくる。それを 5 言語の記事にする。
この手順は **MIKURI の Mac 上で動いている Claude Code セッション**（スマホから操作する場合も含む）を前提にしている。写真の読み込みとプレビューに Mac のファイルが必要なため。

### 1. 材料をそろえる
- **写真**: Claude アプリで添付された写真は `~/.claude/uploads/<セッションID>/` にファイルとして保存され、メッセージにパスが書かれている（2026-11 確認済み）。それを使う。見つからないときは AirDrop で Mac に送ってもらい `~/Downloads` から取る。どの写真か分からないときは推測で進めずに聞く。
- **マップのリンク**: `curl -sIL <短縮URL> | grep -i '^location'` で展開すると、店名と座標が URL に入っている。店名・エリア（新宿、渋谷など）をここから取る。
- **事実の確認**: 営業時間・定休日・値段・予約の要否などは、MIKURI の発言か公式サイト・Google マップの表示で確かめたものだけを書く。確かめられないことは書かない。創作で補わない。

### 2. 写真を入れる
```bash
uv run --with pillow --with pillow-heif python tools/add_photos.py <slug> <写真1> <写真2> ...
```
- `blog/img/<slug>/01.jpg, 02.jpg …` に、長辺1600pxのJPEGで保存される。HEIC も可。
- **位置情報（GPS）などの撮影データはここで必ず消える。** 写真を `blog/img/` に直接コピーしない。
- slug は英小文字とハイフン（例: `fuunji-shinjuku`）。

### 3. 記事ファイルを書く
`posts/<slug>.json`。形は `posts/` にある既存の記事に合わせる。必須項目:
- `slug`（ファイル名と同じ）、`date`（YYYY-MM-DD・訪問日でなく公開日）、`category`
  （`restaurant` `izakaya` `cafe` `sweets` `bar` `park` `shrine` `spot` `shop` のどれか）
- `place`: `name`（ローマ字/英語）、`name_local`（日本語の店名）、`area`、`area_i18n`、`maps_url`（MIKURI がくれたリンクそのまま）
- `cover`（一覧と記事の先頭に出す写真）、`photos[].alt`（写真に何が写っているかの説明。5言語すべて）
- `i18n` に **en / ja / ko / zh-Hant / fr の5言語すべて**: `title`、`description`（検索結果に出る要約。ja・zh-Hant は80〜120字、ko は80〜120字、en・fr は140〜160文字）、`body`
- `i18n.<lang>.info`: 記事末尾「基本情報」欄。`access`（駅から何分など）、`price`（実際に払った額）、`good_for`（どんな人に）。MIKURI が言ったことだけ
- 任意: `updated`（記事を直したらその日付。検索エンジンに更新を伝える）、`draft: true`（ビルドから外す。書きかけの保管用）

本文 `body` で使える書き方: `## 見出し`、`- 箇条書き`、`> ひとことメモ`（囲みのTip。体験から言える具体的な助言だけ）、`**太字**`、`[文字](https://…)`、写真は1行で `![キャプション](02.jpg)`。段落の区切りは空行。

### 4. 文章のルール
- 個人の旅行ブログの語り口: 冒頭は短いフック → その日の体験（誰と・混み具合）→ 料理/飲み物 → 雰囲気 → 値段 → 「行くべき？」の順。短い段落、写真には短いキャプション。
- **その日の体験として書く。** 常連のように書かない、一度の訪問から「いつも静か」と言い切らない、言っていない動機・満足度・評価を足さない。
- 写真に写っているもの（付け合わせなど）は書いてよい。
- **MIKURI の一人称**で、本人が話した感想と体験を中心にする。言っていない感想を足さない。
- 各言語とも、その言語の人が書いたように自然に書く。直訳しない。
  - ja: です・ます調。一文は短く。MIKURI の文体ナレッジ（Obsidian の 00_AI/文体ナレッジ.md）があれば従う。
  - ko: 해요체。zh-Hant: 台湾で使われる繁体字の言い回し。fr: 一人称の気軽な語り（読者への呼びかけは vous）。
- **店名・ブランド名は、どの言語でも公式の表記のまま書く**（例: SCHMATZ をカタカナや한글に直さない）。地名・駅名は各言語のふつうの表記（下北沢 / Shimokitazawa / 시모키타자와）。料理名はその言語で通じる表記にし、必要なら日本語を添える（例: tsukemen (つけ麺)）。
- 「いかがでしたか」「〜を徹底解説」のような決まり文句、絵文字見出し、誇張を使わない。
- 300〜600語程度（日本語なら600〜1,200字）。写真は本文中に1〜4枚。

### 5. ビルドして確認する
```bash
python3 tools/build_blog.py
```
- `blog/<lang>/…` の記事ページ、一覧、トップページの「From the Blog」、`sitemap.xml` が作り直される。生成物は手で直さない（JSONを直して再ビルド）。
- Browser pane（`.claude/launch.json` の `my-tokyo`、port 8899）で、記事を **スマホ幅（375px）と PC 幅** で表示し、言語プルダウンで5言語とも切り替わることを確かめる。

### 6. 公開は MIKURI の OK のあと
1. 記事のスクリーンショット（スマホ幅）と日本語版の本文を `SendUserFile` で送り、「公開していい？」と聞く。
2. OK をもらったら commit して push:
   ```bash
   git add posts blog index.html sitemap.xml tools CLAUDE.md && git commit -m "Blog: <店名>" && git push
   ```
3. 1分ほどして `https://mikurin39.github.io/my-tokyo/blog/en/<slug>/` が開けることを確かめてから、URL を伝える。

記事の修正・削除も同じ流れ（JSON を直す／消す → ビルド → 確認 → OK → push）。写真を消すときは `blog/img/<slug>/` も消す。

## ほかの注意
- このリポジトリの中身はすべてサイトとして公開される（`posts/*.json`、`tools/`、この CLAUDE.md も URL で見える）。個人情報・下書きの愚痴・秘密を書かない。
- `google5c51e649bc627534.html` は Search Console の所有権確認ファイル。消さない。
- トップページ `index.html` の `<!--BLOG-…-->` マーカーの間はビルドが書き換える。手で編集しない。
- 言語を増やすときは `tools/build_blog.py` の `LANGS`・`UI`・`CATEGORIES` に追加して、全記事の `i18n` にもその言語を足す。
