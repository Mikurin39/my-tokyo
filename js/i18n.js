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
    try{ const s = localStorage.getItem("mytokyo_lang"); if(s && codes.includes(s)) return s; }catch(e){}
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
    const u = new URL(location.href); u.searchParams.set("lang", l);
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
  window.I18N = {get lang(){ return lang; }, t, tr, apply, set, selector, keepLang, LANGS};
})();
