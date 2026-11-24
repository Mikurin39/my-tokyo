/* Language switching for the home page and tour pages.
   Text: [data-i18n] textContent, [data-i18n-html] innerHTML (our own strings only),
   [data-i18n-ph] placeholder, [data-i18n-aria] aria-label. Strings live in js/i18n-strings.js.
   The choice is shared with the blog (localStorage "mytokyo_lang"). */
(function(){
  const LANGS = [["en","English"],["ja","日本語"],["fr","Français"],["zh-Hant","繁體中文"],["ko","한국어"]];
  const codes = LANGS.map(l => l[0]);
  const STR = window.I18N_STRINGS || {en:{}};
  function pick(){
    const q = new URLSearchParams(location.search).get("lang");
    if(q && codes.includes(q)) return q;
    // a language chosen earlier: put it in the address too, so the address always says which language the page is in
    try{ const s = localStorage.getItem("mytokyo_lang"); if(s && s !== "en" && codes.includes(s)){ const u = new URL(location.href); u.searchParams.set("lang", s); history.replaceState(history.state, "", u.toString()); return s; } }catch(e){}
    return "en";
  }
  let lang = pick();
  function t(key, vars){
    let s = (STR[lang] && STR[lang][key]) ?? (STR.en && STR.en[key]) ?? key;
    if(vars) Object.keys(vars).forEach(k => { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }
  /* pick the current language from an object like {en:..., ja:...} */
  function tr(obj){ return obj ? (obj[lang] ?? obj.en) : obj; }
  function apply(root){
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    root.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    root.querySelectorAll("[data-tr]").forEach(el => { try{ const o = JSON.parse(el.dataset.tr); if(o[lang]) el.textContent = o[lang]; }catch(e){} });
    root.querySelectorAll("[data-blog-slug]").forEach(a => { a.href = "blog/" + lang + "/" + a.dataset.blogSlug + "/"; });
    document.documentElement.lang = lang;
  }
  function set(l){
    if(!codes.includes(l)) return;
    try{ localStorage.setItem("mytokyo_lang", l); }catch(e){}
    const u = new URL(location.href); if(l === "en") u.searchParams.delete("lang"); else u.searchParams.set("lang", l);
    location.replace(u.toString());   // reload so every script renders in the new language
  }
  function selector(){
    return `<label class="lang-sel"><span class="sr">${t("ui.language")}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>
      <select onchange="I18N.set(this.value)">${LANGS.map(([c,n]) => `<option value="${c}" ${c===lang?"selected":""}>${n}</option>`).join("")}</select></label>`;
  }
  /* add ?lang= to links between our own pages so the language follows the visitor */
  function keepLang(href){
    if(lang === "en" || !href || /^(https?:|mailto:|tel:|#)/.test(href)) return href;
    const [path, hash] = href.split("#"); return path + (path.includes("?") ? "&" : "?") + "lang=" + encodeURIComponent(lang) + (hash !== undefined ? "#" + hash : "");
  }
  /* page title, description, canonical and the other language versions, for search engines and link previews.
     path is relative to the site root, e.g. "" for the home page or "tour.html?t=shibuya". */
  function head(o){
    const site = ((window.CONFIG && window.CONFIG.SITE_URL) || location.origin).replace(/\/$/, "") + "/";
    const url = l => { const [p, q] = (o.path || "").split("?"), sp = new URLSearchParams(q || ""); if(l !== "en") sp.set("lang", l); const qs = sp.toString(); return site + p + (qs ? "?" + qs : ""); };
    const meta = (attr, key, val) => { let m = document.head.querySelector(`meta[${attr}="${key}"]`); if(!m){ m = document.createElement("meta"); m.setAttribute(attr, key); document.head.appendChild(m); } m.setAttribute("content", val); };
    const link = (rel, href, hl) => { const l = document.createElement("link"); l.rel = rel; l.href = href; if(hl) l.hreflang = hl; l.dataset.seo = "1"; document.head.appendChild(l); };
    document.head.querySelectorAll("link[data-seo], link[rel=canonical], link[rel=alternate][hreflang]").forEach(x => x.remove());
    if(o.title){ document.title = o.title; meta("property", "og:title", o.title); }
    if(o.desc){ meta("name", "description", o.desc); meta("property", "og:description", o.desc); }
    if(o.image) meta("property", "og:image", site + o.image);
    meta("property", "og:url", url(lang));
    meta("property", "og:locale", {en:"en_US", ja:"ja_JP", fr:"fr_FR", "zh-Hant":"zh_TW", ko:"ko_KR"}[lang]);
    link("canonical", url(lang));
    codes.forEach(c => link("alternate", url(c), c));
    link("alternate", url("en"), "x-default");
  }
  window.I18N = {get lang(){ return lang; }, t, tr, apply, set, selector, keepLang, head, LANGS};
})();
