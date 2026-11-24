/* Tokyo Top 10 ranking + spot detail + favorites + trip planner.
   Data: window.SPOTS from js/spots.js (built by tools/build_spots.py).
   Nothing typed here is sent anywhere: plan, favorites and answers stay in this browser (localStorage). */
(function(){
"use strict";
const DATA = window.SPOTS || {genres:[], spots:{}};
const S = DATA.spots;
const CONTACT = (window.CONFIG && window.CONFIG.CONTACT_EMAIL) || "mytokyo39@gmail.com";
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const L = (key, fallback) => { if(!window.I18N) return fallback; const v = I18N.t(key); return v === key ? fallback : v; };
/* UI text for this file lives in js/explore-strings.js under "x." keys */
const X = (k, vars) => window.I18N ? I18N.t("x." + k, vars) : k;
const LANG = window.I18N ? I18N.lang : "en";
const LOCALE = {en:"en-GB", ja:"ja-JP", fr:"fr-FR", "zh-Hant":"zh-TW", ko:"ko-KR"}[LANG] || "en-GB";
const weekday = (d, style) => d.toLocaleDateString(LOCALE, {weekday: style || "long"});
// translated spot text (name, about, hours ...) from js/spots-<lang>.js, laid over the English
const SPOT_TR = window.SPOTS_I18N || {};
const SPOT_EN = {};   // English hours and closed days, which the route planner reads
Object.keys(S).forEach(id => { SPOT_EN[id] = {hours: S[id].hours, closed: S[id].closed, parking: S[id].parking}; S[id].name_en = S[id].name; if(SPOT_TR[id]) Object.assign(S[id], SPOT_TR[id]); });

/* ---------- icons ---------- */
const P = {
  all:'<circle cx="6" cy="6" r="1.3"/><circle cx="12" cy="6" r="1.3"/><circle cx="18" cy="6" r="1.3"/><circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/><circle cx="6" cy="18" r="1.3"/><circle cx="12" cy="18" r="1.3"/><circle cx="18" cy="18" r="1.3"/>',
  nature:'<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/>',
  history:'<path d="M3 6c6 1 12 1 18 0"/><path d="M5 10h14"/><path d="M7 7v13M17 7v13"/><path d="M12 7v3"/>',
  stay:'<path d="M3 19V6"/><path d="M3 15h18v4"/><path d="M3 12h7v3"/><path d="M10 11h8a3 3 0 0 1 3 3v1"/>',
  food:'<path d="M7 3v18"/><path d="M4 3v5a3 3 0 0 0 6 0V3"/><path d="M17 21V3c-2 1-3 4-3 8h3"/>',
  cafe:'<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/>',
  shop:'<path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
  onsen:'<path d="M4 15c0 3 3.6 5 8 5s8-2 8-5"/><path d="M8 12c-1-1.5 1-2.5 0-4s1-2.5 0-4"/><path d="M12 12c-1-1.5 1-2.5 0-4s1-2.5 0-4"/><path d="M16 12c-1-1.5 1-2.5 0-4s1-2.5 0-4"/>',
  sport:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l4 2.9-1.5 4.6h-5L8 10.4z"/><path d="M12 3.5v4M16 10.4l4-1.3M14.5 15l2.5 3.4M9.5 15L7 18.4M8 10.4L4 9.1"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  left:'<path d="M15 5l-7 7 7 7"/>', right:'<path d="M9 5l7 7-7 7"/>',
  up:'<path d="M6 15l6-6 6 6"/>', down:'<path d="M6 9l6 6 6-6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', check:'<path d="M5 12l5 5 9-10"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  pause:'<path d="M8 5v14M16 5v14"/>', play:'<path d="M7 5l12 7-12 7z"/>',
  /* plain black line pictures for the trip questions */
  k_solo:'<path d="M3 18v-5l3.5-5 3 2.2c1 .7 2 1 3.2 1.2L18 13a3.5 3.5 0 0 1 3 3.4V18z"/><path d="M3 18h18M8 10.5l1.2-1.6M10.5 12l1.2-1.6"/>',
  k_friends:'<circle cx="8" cy="7.5" r="2.5"/><circle cx="16" cy="7.5" r="2.5"/><path d="M3.5 20c0-3.8 2-6 4.5-6s4.5 2.2 4.5 6M11.5 20c0-3.8 2-6 4.5-6s4.5 2.2 4.5 6"/>',
  k_family:'<path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  k_relax:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  k_learn:'<path d="M2 9.5L12 5l10 4.5L12 14z"/><path d="M6 11.3V16c3.3 2.4 8.7 2.4 12 0v-4.7"/><path d="M22 9.5V15"/>',
  k_seasonal:'<circle cx="12" cy="12" r="1.6"/><path d="M12 10.4c-2.4-1.6-2.6-4.6-.2-7 .1 0 .3 0 .4.1 2.2 2.3 2 5.3-.2 6.9z"/><path d="M12 10.4c-2.4-1.6-2.6-4.6-.2-7 .1 0 .3 0 .4.1 2.2 2.3 2 5.3-.2 6.9z" transform="rotate(72 12 12)"/><path d="M12 10.4c-2.4-1.6-2.6-4.6-.2-7 .1 0 .3 0 .4.1 2.2 2.3 2 5.3-.2 6.9z" transform="rotate(144 12 12)"/><path d="M12 10.4c-2.4-1.6-2.6-4.6-.2-7 .1 0 .3 0 .4.1 2.2 2.3 2 5.3-.2 6.9z" transform="rotate(216 12 12)"/><path d="M12 10.4c-2.4-1.6-2.6-4.6-.2-7 .1 0 .3 0 .4.1 2.2 2.3 2 5.3-.2 6.9z" transform="rotate(288 12 12)"/>',
  k_unique:'<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  k_nature:'<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/>',
  k_history:'<path d="M3 6c6 1 12 1 18 0"/><path d="M5 10h14"/><path d="M7 7v13M17 7v13"/><path d="M12 7v3"/>',
  k_art:'<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.9 0-1-.9-1.5-.9-2.5s.9-1.6 2-1.6h1.9A4 4 0 0 0 21 11c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7" r="1.1"/><circle cx="15" cy="7.3" r="1.1"/>',
  k_onsen:'<path d="M4 15c0 3 3.6 5 8 5s8-2 8-5"/><path d="M8 12c-1-1.5 1-2.5 0-4s1-2.5 0-4"/><path d="M12 12c-1-1.5 1-2.5 0-4s1-2.5 0-4"/><path d="M16 12c-1-1.5 1-2.5 0-4s1-2.5 0-4"/>',
  k_beauty:'<path d="M8.5 21h7v-8h-7z"/><path d="M9.5 13V8.5L14.5 4v9"/>',
  k_active:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l4 2.9-1.5 4.6h-5L8 10.4z"/><path d="M12 3.5v4M16 10.4l4-1.3M14.5 15l2.5 3.4M9.5 15L7 18.4M8 10.4L4 9.1"/>',
  k_hiking:'<path d="M2 20L9 8l4 6 3-4 6 10z"/><path d="M7.2 11l1.8 1.2 1.6-1"/>',
  k_food:'<circle cx="12.5" cy="12" r="5"/><path d="M3 4v4a1.6 1.6 0 0 0 3.2 0V4M4.6 9.6V20"/><path d="M21.5 20V4c-1.5 1-2.5 3-2.5 6.5h2.5"/>',
  k_cooking:'<path d="M7 14a3.8 3.8 0 0 1-.6-7.5A4.5 4.5 0 0 1 12 3.2a4.5 4.5 0 0 1 5.6 3.3A3.8 3.8 0 0 1 17 14"/><path d="M7 13v7h10v-7M7 17h10"/>',
  k_shopping:'<path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
  k_music:'<path d="M9 18V5.5L20 3.5v12.5"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/><path d="M9 9l11-2"/>',
  k_photo:'<path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/>',
  k_drive:'<path d="M5 17H3v-5l2.5-5h13l2.5 5v5h-2"/><path d="M9.5 17h5M3 12h18"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>',
  k_reading:'<path d="M12 6.5C10 5 7 4.5 3 4.5v13c4 0 7 .5 9 2 2-1.5 5-2 9-2v-13c-4 0-7 .5-9 2z"/><path d="M12 6.5v13"/>',
  k_date:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17h2"/>',
  k_tbd:'<path d="M4 4.5h16v11H10l-5 4.5v-4.5H4z"/><path d="M8.5 10h.01M12 10h.01M15.5 10h.01" stroke-width="2.6"/>',
  k_walk:'<circle cx="13" cy="4.5" r="2"/><path d="M10.5 21l1.8-5.5 2.7 2.5v3M8 12.5l2.2-4 3.8.8 2 3.2M10.2 8.5l2.1 7"/>',
  k_train:'<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14M9 17l-3 4M15 17l3 4"/><path d="M9 13.5h.01M15 13.5h.01" stroke-width="2.4"/>'
};
const ico = (k, extra="") => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${P[k]||""}</svg>`;
const crown = c => `<svg viewBox="0 0 48 44" aria-hidden="true"><path d="M5 13l9 9 10-16 10 16 9-9-3.5 27h-31z" fill="${c}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="5" cy="12" r="3" fill="${c}" stroke="#fff" stroke-width="1.5"/><circle cx="24" cy="5" r="3" fill="${c}" stroke="#fff" stroke-width="1.5"/><circle cx="43" cy="12" r="3" fill="${c}" stroke="#fff" stroke-width="1.5"/></svg>`;
const MEDAL = ["var(--gold)", "var(--silver)", "var(--bronze)"];

const genreOf = id => DATA.genres.find(g => g.key !== "all" && g.ids.includes(id));
// no photo yet: a simple drawing of the genre instead of an empty box
const img = (s, cls="") => { if(s && s.img) return `<img src="${esc(s.img)}" alt="" loading="lazy" ${cls}>`;
  const id = s && Object.keys(S).find(k => S[k] === s), g = id && genreOf(id);
  return `<span class="ph" aria-hidden="true">${ico(g ? g.key : "all")}</span>`; };

/* ---------- state ---------- */
let plan = store.get("mt_plan", []).filter(id => S[id]);
let favs = store.get("mt_favs", []).filter(id => S[id]);
const savePlan = () => { store.set("mt_plan", plan); updateCounts(); };
const saveFavs = () => { store.set("mt_favs", favs); updateCounts(); };
function togglePlan(id){ plan = plan.includes(id) ? plan.filter(x=>x!==id) : plan.concat(id); savePlan(); toast(X(plan.includes(id) ? "toastAdded" : "toastRemoved")); return plan.includes(id); }
function toggleFav(id){ favs = favs.includes(id) ? favs.filter(x=>x!==id) : favs.concat(id); saveFavs(); toast(X(favs.includes(id) ? "favAdded" : "favRemoved")); return favs.includes(id); }

let toastT;
function toast(msg){
  let t = $("#mtToast"); if(!t){ t = document.createElement("div"); t.id = "mtToast"; t.className = "toast"; t.setAttribute("role","status"); }
  const host = [...document.querySelectorAll("dialog[open]")].pop() || document.body; if(t.parentNode !== host) host.appendChild(t);
  t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove("on"), 1800);
}

/* ---------- ranking ---------- */
let cur = DATA.genres.length ? DATA.genres[0].key : null;
const tabs = $("#gTabs"), grid = $("#rankGrid"), panel = $("#rankPanel");
function buildTabs(){
  tabs.innerHTML = DATA.genres.map(g => `<button type="button" class="gtab" role="tab" id="gt-${g.key}" aria-controls="rankPanel">${ico(g.key)}<span>${esc(L("genre."+g.key, g.label))}</span></button>`).join("") + '<span class="gtab-bar" id="gBar" aria-hidden="true"></span>';
  tabs.querySelectorAll(".gtab").forEach((b,i) => b.addEventListener("click", () => pick(DATA.genres[i].key)));
  tabs.addEventListener("keydown", e => {
    const i = DATA.genres.findIndex(g=>g.key===cur), n = DATA.genres.length; let j;
    if(e.key==="ArrowRight") j=(i+1)%n; else if(e.key==="ArrowLeft") j=(i-1+n)%n; else if(e.key==="Home") j=0; else if(e.key==="End") j=n-1; else return;
    e.preventDefault(); pick(DATA.genres[j].key, true);
  });
  tabs.addEventListener("scroll", arrows, {passive:true});
  $("#gPrev").addEventListener("click", () => tabs.scrollBy({left:-tabs.clientWidth*.7}));
  $("#gNext").addEventListener("click", () => tabs.scrollBy({left: tabs.clientWidth*.7}));
  addEventListener("resize", () => { moveBar(); arrows(); });
}
function arrows(){
  const p = $("#gPrev"), n = $("#gNext");
  p.hidden = tabs.scrollLeft < 8; n.hidden = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 8;
}
function moveBar(){
  const b = $("#gt-"+cur), barEl = $("#gBar"); if(!b || !barEl) return;
  barEl.style.width = b.offsetWidth + "px"; barEl.style.transform = `translateX(${b.offsetLeft}px)`;
}
function pick(key, focus){
  const from = DATA.genres.findIndex(g=>g.key===cur), to = DATA.genres.findIndex(g=>g.key===key);
  if(key === cur){ if(focus) $("#gt-"+key).focus(); return; }
  cur = key; paintTabs(); renderGrid(to >= from ? "in-right" : "in-left");
  const b = $("#gt-"+key);
  b.scrollIntoView({block:"nearest", inline:"center", behavior: reduced ? "auto" : "smooth"});
  if(focus) b.focus();
}
function paintTabs(){
  DATA.genres.forEach(g => { const b = $("#gt-"+g.key), on = g.key===cur; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
  panel.setAttribute("aria-labelledby", "gt-"+cur); moveBar();
}
function renderGrid(anim){
  const g = DATA.genres.find(x=>x.key===cur); if(!g) return;
  $("#rankNote").textContent = L(g.key === "all" ? "genre.note.all" : "genre.note.other", g.note || "");
  grid.innerHTML = g.ids.map((id,i) => { const s = S[id]; if(!s) return "";
    const badge = i < 3 ? `<span class="rank-badge">${crown(MEDAL[i])}<b>${i+1}</b></span>` : `<span class="rank-badge plain"><b>${i+1}</b></span>`;
    return `<li class="rcard">${badge}<button type="button" data-id="${esc(id)}" aria-label="${esc(X("rankAria", {n: i+1, name: s.name}))}"><span class="pic">${img(s)}${s.stock ? `<span class="img-only">${X("imgOnly")}</span>` : ""}</span><span class="nm">${esc(s.name)}</span></button></li>`;
  }).join("");
  grid.querySelectorAll("button[data-id]").forEach(b => b.addEventListener("click", () => { pickMode = false; openSpot(b.dataset.id); }));
  if(anim && !reduced){ grid.classList.remove("in-right","in-left"); void grid.offsetWidth; grid.classList.add(anim); }
}
// swipe left/right on the grid to change genre (phones)
(function(){
  let x0=null, y0=null;
  grid && grid.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, {passive:true});
  grid && grid.addEventListener("touchend", e => {
    if(x0===null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if(Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)*1.5) return;
    const i = DATA.genres.findIndex(g=>g.key===cur), j = i + (dx < 0 ? 1 : -1);
    if(j >= 0 && j < DATA.genres.length) pick(DATA.genres[j].key);
  }, {passive:true});
})();

/* ---------- full-screen pages with a back button ----------
   Every page is pushed onto browser history, so the Back button (ours or the browser's) returns to the previous one. */
let page = null;
const stack = []; let pos = 0;   // pages, and which one is showing (forward history keeps working)
function dialog(view, title){
  if(!page){
    page = document.createElement("dialog"); page.id = "mtPage"; page.className = "xd"; page.setAttribute("aria-labelledby", "mtPageT");
    page.innerHTML = `<div class="xd-top"><button type="button" class="xd-back" aria-label="${X("back")}">${ico("left")}<span>${X("back")}</span></button><h2 id="mtPageT"></h2><button type="button" class="xd-x" aria-label="${X("close")}">${ico("x")}</button></div><div class="xd-body"></div><div class="xd-foot" hidden></div>`;
    page.querySelector(".xd-back").addEventListener("click", () => history.back());
    page.querySelector(".xd-x").addEventListener("click", closeAll);
    page.addEventListener("cancel", e => { e.preventDefault(); history.back(); });
    document.body.appendChild(page);
  }
  page.dataset.view = view;
  page.querySelector("h2").textContent = title;
  return page;
}
function show(d){ if(!d.open) d.showModal(); }
const scrolls = [];
function remember(){ if(!page || !pos) return; const b = page.querySelector(".xd-body"); scrolls[pos-1] = {y: b.scrollTop, rows: [...b.querySelectorAll(".res-row")].map(r => r.scrollLeft), focus: document.activeElement && document.activeElement.dataset && (document.activeElement.dataset.open || document.activeElement.dataset.add)}; }
function restore(){ const sc = scrolls[pos-1]; if(!sc) return; const b = page.querySelector(".xd-body"); b.scrollTop = sc.y; b.querySelectorAll(".res-row").forEach((r,i) => { if(sc.rows[i] != null) r.scrollLeft = sc.rows[i]; }); const f = sc.focus && b.querySelector(`[data-open="${sc.focus}"], [data-add="${sc.focus}"]`); if(f) f.focus({preventScroll:true}); }
function push(render){
  remember(); stack.length = pos; stack.push(render); scrolls.length = pos; pos = stack.length; history.pushState({mt: pos}, "");
  render(); if(page){ show(page); page.querySelector(".xd-body").scrollTop = 0; }
}
function closeAll(){ pickMode = false; if(pos) history.go(-pos); else if(page && page.open) page.close(); }
addEventListener("popstate", e => {
  const n = (e.state && e.state.mt) || 0;
  pos = Math.min(n, stack.length);
  if(pos){ stack[pos-1](); show(page); page.querySelector(".xd-body").scrollTop = 0; restore(); }
  else if(page && page.open) page.close();
});
function foot(d, html){ const f = d.querySelector(".xd-foot"); f.hidden = !html; f.innerHTML = html || ""; return f; }

/* ---------- spot detail ---------- */
function checkedDate(){ const d = new Date("1 " + (DATA.checked || "")); return isNaN(d) ? (DATA.checked || "") : d.toLocaleDateString(LOCALE, {year:"numeric", month:"long"}); }
function mapsSearch(s){ return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((s.name_ja || s.name_en) + " " + (s.address || "")); }
function openSpot(id){ if(S[id]) push(() => renderSpot(id)); }
function renderSpot(id){
  const s = S[id]; if(!s) return;
  const g = genreOf(id), d = dialog("spot", s.name);
  const row = (k, v) => v ? `<li><span class="k">${k}</span><span class="v">${v}</span></li>` : "";
  const access = s.station ? (s.walk_min != null ? esc(X("walkMin", {station: s.station, n: s.walk_min})) : esc(s.station)) : "";
  const parking = [s.parking, s.car].filter(Boolean).map(esc).join("\n");
  const web = s.website ? `<a href="${esc(s.website)}" target="_blank" rel="noopener">${esc(s.website.replace(/^https?:\/\//,"").replace(/\/$/,""))}</a>` : "";
  const ig = s.instagram ? `<a href="${esc(s.instagram)}" target="_blank" rel="noopener">${esc(s.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//,"@").replace(/\/$/,""))}</a>` : "";
  const map = (s.lat && s.lng) ? `<div class="sd-map"><iframe title="${esc(X("mapOf", {name: s.name}))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${s.lat},${s.lng}&z=16&hl=${LANG === "zh-Hant" ? "zh-TW" : LANG}&output=embed"></iframe></div>` : "";
  const reviews = (s.reviews||[]).map(r => `<div class="rv"><p>${esc(r.text)}</p><div class="who">${esc(r.name)}${r.date?", "+esc(r.date):""}</div></div>`).join("");
  foot(d, "");
  d.querySelector(".xd-body").innerHTML = `<div class="sd-page"><div class="sd-main">
    <div class="sd-hero">${s.img ? `<img src="${esc(s.img)}" alt="${esc(s.name)}">${s.stock ? `<span class="img-only">${X("imgOnly")}</span>` : ""}` : `<div class="sd-ph">${img(s)}</div>`}</div>
    ${s.credit ? `<div class="credit-line">${X("photoBy")} <a href="${esc(s.credit.page)}" target="_blank" rel="noopener">${esc(s.credit.author)}</a>, ${s.credit.license_url ? `<a href="${esc(s.credit.license_url)}" target="_blank" rel="noopener">${esc(s.credit.license)}</a>` : esc(s.credit.license)}</div>` : ""}
    <div class="sd-in">
      <div class="sd-meta"><span>${esc(s.area||"")}</span>${g ? `<span>${esc(L("genre."+g.key, g.label))}</span>` : ""}</div>
      <h3>${esc(s.name)}</h3>
      ${s.name_ja && s.name_ja !== s.name ? `<div class="sd-ja" lang="ja">${esc(s.name_ja)}</div>` : ""}
      <p class="sd-about">${esc(s.about || s.desc || "")}</p>
      <ul class="sd-facts">
        ${row(X("fAddress"), s.address ? esc(s.address) + map + `<a href="${esc(mapsSearch(s))}" target="_blank" rel="noopener">${X("viewMaps")}</a>` : "")}
        ${row(X("fPhone"), s.phone ? `<a href="tel:${esc(s.phone.replace(/[^0-9+]/g,""))}">${esc(s.phone)}</a>` : "")}
        ${row(X("fHours"), esc(s.hours))}
        ${row(X("fClosed"), esc(s.closed))}
        ${row(X("fPrice"), esc(s.price))}
        ${row(X("fAccess"), access)}
        ${row(X("fParking"), parking)}
        ${row(X("fWebsite"), web)}
        ${row("Instagram", ig)}
      </ul>
      <p class="sd-note">${esc(X("checked", {d: checkedDate()}))}</p>
      <section class="sd-reviews" aria-labelledby="rvh">
        <h4 id="rvh">${X("reviews")}</h4>
        ${reviews || `<p class="rv-empty">${X("rvEmpty")}</p>`}
        <button type="button" class="btn small ghost" data-act="rv">${X("rvWrite")}</button>
        <form class="rv-form" hidden>
          <div><label for="rvName">${X("rvName")}</label><input id="rvName" maxlength="40" autocomplete="nickname"></div>
          <div><label for="rvText">${X("rvText")}</label><textarea id="rvText" maxlength="1200" required></textarea></div>
          <small>${esc(X("rvHelp", {email: CONTACT}))}</small>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button type="submit" class="btn small">${X("rvOpen")}</button><button type="button" class="btn small ghost" data-act="rvcopy">${X("rvCopy")}</button></div>
        </form>
      </section>
    </div></div>
    <aside class="sd-side" aria-label="${X("planFav")}"><div class="sd-card">
      <button type="button" class="btn" data-act="plan">${X(pickMode ? "chooseThis" : "addPlan")}</button>
      <button type="button" class="btn ghost btn-fav" data-act="fav">${ico("heart")}<span>${X("fav")}</span></button>
    </div></aside></div>`;
  const pb = d.querySelector('[data-act="plan"]'), fb = d.querySelector('[data-act="fav"]');
  const paint = () => { fb.setAttribute("aria-pressed", favs.includes(id)); fb.querySelector("span").textContent = X(favs.includes(id) ? "favSaved" : "fav"); };
  // adding a spot starts the questions; the spot stays in the plan as the first pick
  pb.addEventListener("click", () => { if(!plan.includes(id)){ plan = [id].concat(plan); savePlan(); } firstPick = id; openWizard(); });
  fb.addEventListener("click", () => { toggleFav(id); paint(); refreshOpenViews(); });
  paint();
  const form = d.querySelector(".rv-form");
  d.querySelector('[data-act="rv"]').addEventListener("click", e => { form.hidden = false; e.currentTarget.hidden = true; $("#rvText").focus(); });
  d.querySelector('[data-act="rvcopy"]').addEventListener("click", () => {
    const txt = `To: ${CONTACT}\nSubject: Review: ${s.name}\n\nName: ${$("#rvName").value}\n\n${$("#rvText").value}`;
    if(navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast(X("rvCopied")), () => prompt(X("rvPrompt"), txt)); else prompt(X("rvPrompt"), txt);
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const body = `Spot: ${s.name}\nName: ${$("#rvName").value}\n\n${$("#rvText").value}`;
    location.href = `mailto:${CONTACT}?subject=${encodeURIComponent("Review: " + s.name)}&body=${encodeURIComponent(body)}`;
  });
  show(d);
}
let firstPick = null;

/* ---------- start from the home "Create your Tokyo trip" button: choose one place first ---------- */
let pickG = DATA.genres.length ? DATA.genres[0].key : null, pickQ = "", pickMode = false;
function openPick(){ push(() => { pickMode = true; renderPick(); }); }
function renderPick(focusSel){
  const d = dialog("pick", X("pickTitle")), body = d.querySelector(".xd-body");
  const g = DATA.genres.find(x => x.key === pickG) || DATA.genres[0];
  foot(d, "");
  body.innerHTML = `<div class="pick">
    <h3 tabindex="-1">${X("pickH")}</h3>
    <div class="pick-card">
      <label class="pick-search"><span class="sr">${X("pickSearch")}</span><input id="pickQ" type="search" value="${esc(pickQ)}" placeholder="${esc(X("pickPh"))}" autocomplete="off"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></label>
      <div class="pick-tabs" role="tablist" aria-label="${X("pickTabs")}">${DATA.genres.map(x => `<button type="button" role="tab" class="pick-tab" data-pg="${x.key}" aria-selected="${x.key === g.key}">${esc(L("genre." + x.key, x.label))}</button>`).join("")}</div>
      <ol class="pick-list" id="pickList"></ol>
    </div>
  </div>`;
  paintPick();
  body.querySelectorAll("[data-pg]").forEach(b => b.addEventListener("click", () => { pickG = b.dataset.pg; pickQ = ""; renderPick(`[data-pg="${b.dataset.pg}"]`); }));
  $("#pickQ").addEventListener("input", e => { pickQ = e.target.value; paintPick(); });
  show(d);
  const f = focusSel && body.querySelector(focusSel);
  if(f){ f.focus(); if(f.scrollIntoView) f.scrollIntoView({block:"nearest", inline:"center"}); } else body.querySelector("h3").focus();
}
function paintPick(){
  const box = $("#pickList"); if(!box) return;
  const g = DATA.genres.find(x => x.key === pickG) || DATA.genres[0], q = pickQ.trim().toLowerCase();
  // typing searches every spot; otherwise the genre's ranking
  const list = q ? Object.keys(S).filter(id => [S[id].name, S[id].name_en, S[id].name_ja, S[id].area].some(v => v && String(v).toLowerCase().includes(q))) : g.ids;
  box.innerHTML = list.length ? list.map((id, i) => { const s = S[id]; if(!s) return "";
    const badge = q ? "" : i < 3 ? `<span class="pk-rank">${crown(MEDAL[i])}<b>${i+1}</b></span>` : `<span class="pk-rank plain"><b>${i+1}</b></span>`;
    return `<li><button type="button" data-id="${esc(id)}">${badge}<span class="pk-pic">${img(s)}</span><span class="pk-nm">${esc(s.name)}</span></button></li>`; }).join("")
    : `<li class="empty">${X("pickNone")}</li>`;
  box.querySelectorAll("[data-id]").forEach(b => b.addEventListener("click", () => openSpot(b.dataset.id)));
}
/* ---------- floating buttons + drawer ---------- */
const fab = document.createElement("div"); fab.className = "fab";
fab.innerHTML = `<button type="button" id="fabFav" aria-label="${X("favorites")}">${ico("heart")}<span class="cnt" id="cntFav">0</span></button><button type="button" class="main" id="fabPlan">${ico("list")}<span>${X("tripPlan")}</span><span class="cnt" id="cntPlan">0</span></button>`;
document.body.appendChild(fab);
const drawer = document.createElement("dialog"); drawer.className = "drawer"; drawer.setAttribute("aria-labelledby","drawerT");
drawer.innerHTML = `<div class="xd-top"><h2 id="drawerT">${X("yourTrip")}</h2><button type="button" class="xd-x" aria-label="${X("close")}">${ico("x")}</button></div>
  <div class="drawer-tabs" role="tablist"><button type="button" role="tab" data-t="plan">${X("tripPlan")}</button><button type="button" role="tab" data-t="fav">${X("favorites")}</button></div>
  <div class="drawer-body"></div><div class="drawer-foot"></div>`;
document.body.appendChild(drawer);
let dTab = "plan";
function openDrawer(t){ dTab = t || dTab; renderDrawer(); if(!drawer.open) drawer.showModal(); drawer.querySelector(".xd-x").focus(); }
function closeDrawer(){ if(drawer.open) drawer.close(); }
$("#fabPlan").addEventListener("click", () => openDrawer("plan"));
$("#fabFav").addEventListener("click", () => openDrawer("fav"));
drawer.addEventListener("click", e => { if(e.target === drawer) closeDrawer(); });
drawer.querySelector(".xd-x").addEventListener("click", closeDrawer);
drawer.querySelectorAll(".drawer-tabs button").forEach(b => b.addEventListener("click", () => { dTab = b.dataset.t; renderDrawer(); }));
function updateCounts(){ $("#cntPlan").textContent = plan.length; $("#cntFav").textContent = favs.length; if(drawer.open) renderDrawer(); }
function miniRow(id, actions){
  const s = S[id];
  return `<div class="mini">${img(s)}<div><div class="t"><button type="button" data-open="${esc(id)}">${esc(s.name)}</button></div><div class="s">${esc(s.area||"")}</div></div><div style="display:flex;gap:6px">${actions}</div></div>`;
}
function renderDrawer(){
  drawer.querySelectorAll(".drawer-tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.t === dTab));
  const body = drawer.querySelector(".drawer-body"), f = drawer.querySelector(".drawer-foot");
  if(dTab === "plan"){
    body.innerHTML = plan.length ? plan.map(id => miniRow(id, `<button type="button" class="icon-btn" data-rm="${esc(id)}" aria-label="${esc(X("remove", {name: S[id].name}))}">${ico("x")}</button>`)).join("")
      : `<p class="empty">${X("emptyPlan")}</p>`;
    f.innerHTML = `<button type="button" class="btn" id="dBuild" ${plan.length?"":"disabled"}>${X("reviewBuild")}</button><button type="button" class="btn ghost" id="dWizard">${X("getRec")}</button>`;
    $("#dBuild").addEventListener("click", () => { closeDrawer(); openConfirm(); });
  } else {
    body.innerHTML = favs.length ? favs.map(id => miniRow(id, `<button type="button" class="icon-btn ${plan.includes(id)?"on":""}" data-add="${esc(id)}" aria-pressed="${plan.includes(id)}" aria-label="${esc(X("addTo", {name: S[id].name}))}">${ico(plan.includes(id)?"check":"plus")}</button><button type="button" class="icon-btn" data-unfav="${esc(id)}" aria-label="${esc(X("rmFav", {name: S[id].name}))}">${ico("x")}</button>`)).join("")
      : `<p class="empty">${X("emptyFav")}</p>`;
    f.innerHTML = `<button type="button" class="btn ghost" id="dWizard">${X("getRec")}</button>`;
  }
  $("#dWizard").addEventListener("click", () => { closeDrawer(); openWizard(); });
  body.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openSpot(b.dataset.open)));
  body.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => { plan = plan.filter(x=>x!==b.dataset.rm); savePlan(); }));
  body.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => togglePlan(b.dataset.add)));
  body.querySelectorAll("[data-unfav]").forEach(b => b.addEventListener("click", () => { favs = favs.filter(x=>x!==b.dataset.unfav); saveFavs(); }));
}

/* ---------- wizard ---------- */
/* same 21 keywords, in the same order, as the Nara planner the owner asked us to follow */
const KEYWORDS = ["solo","friends","family","relax","learn","seasonal","unique","nature","history","art","onsen","beauty","active","hiking","food","cooking","shopping","music","photo","drive","reading"];
const KW_TAGS = {cooking:["food"]};   // no cooking class in the list yet, so food places stand in
let W = Object.assign({year:"", gender:"", kw:[], when:"", date:"", nights:0, mode:""}, store.get("mt_wz", {}));
if(W.mode === "walk") W.mode = "train";   // walking and trains are now one choice
W.kw = (W.kw || []).filter(k => KEYWORDS.includes(k));
let wStep = 0;
const STEPS = ["about","kw","when","mode"];
const RESULTS_STEP = STEPS.length + 1;
function stepTitle(n){ return X("step", {n, m: RESULTS_STEP}); }
function openWizard(){ pickMode = false; wLastStep = -1; push(() => { wStep = 0; renderWizard(); }); }
function wNext(){ store.set("mt_wz", W); if(wStep < STEPS.length-1){ const k = wStep+1; push(() => { wStep = k; renderWizard(); }); } else push(renderResults); }
const optBtn = (attr, k, on, icons, label) => `<button type="button" class="opt" aria-pressed="${on}" ${attr}="${k}"><span class="opt-ic">${icons.map(i => ico(i)).join("")}</span><span>${label}</span></button>`;
function renderWizard(){
  const d = dialog("wizard", stepTitle(wStep+1)), body = d.querySelector(".xd-body"), step = STEPS[wStep];
  const prog = `<div class="wz-prog"><i style="width:${(wStep+1)/RESULTS_STEP*100}%"></i></div>`;
  let h = "", ok = true;
  if(W.date && W.date < todayTokyo()){ W.date = ""; if(W.when === "date") W.when = ""; }
  if(step === "about"){
    const y = new Date().getFullYear(); let opts = `<option value="">${X("yearChoose")}</option><option value="skip" ${W.year==="skip"?"selected":""}>${X("preferNot")}</option>`;
    for(let i=y-10;i>=y-100;i--) opts += `<option value="${i}" ${String(i)===String(W.year)?"selected":""}>${LANG === "ja" || LANG === "zh-Hant" ? i + "年" : LANG === "ko" ? i + "년" : i}</option>`;
    h = `<h3>${X("aboutH")}</h3><p class="sub">${X("aboutSub")}</p>
      <div class="wz-field"><label for="wzYear">${X("yearQ")}</label><select id="wzYear">${opts}</select></div>
      <div class="wz-field"><span class="lbl" id="gL">${X("genderQ")}</span><div class="chips" role="group" aria-labelledby="gL">${["female","male","none"].map(k=>`<button type="button" class="chip" aria-pressed="${W.gender===k}" data-g="${k}">${X(k === "none" ? "preferNot" : k)}</button>`).join("")}</div></div>`;
    ok = !!W.year;
  } else if(step === "kw"){
    h = `<h3>${X("kwH")}</h3><p class="sub">${X("kwSub")} <span class="kw-n" id="kwN">${W.kw.length} / 3</span></p><div class="chips kw">${KEYWORDS.map(k => { const on = W.kw.includes(k), nth = W.kw.indexOf(k) + 1;
      return `<button type="button" class="chip" aria-pressed="${on}" data-k="${k}" ${!on && W.kw.length>=3 ? "disabled" : ""}>${ico("k_" + k)}<span>${X("kw." + k)}</span>${on ? `<b class="kw-ord" aria-hidden="true">${nth}</b>` : ""}</button>`; }).join("")}</div>`;
    ok = W.kw.length > 0;
  } else if(step === "when"){
    h = `<h3>${X("whenH")}</h3><div class="wz-field"><div class="opts" role="group" aria-label="${X("travelDate")}">${optBtn("data-w", "date", W.when==="date", ["k_date"], X("pickDate"))}${optBtn("data-w", "tbd", W.when==="tbd", ["k_tbd"], X("tbd"))}</div><div id="wzCal"></div></div>
      <div class="wz-field"><span class="lbl" id="nl">${X("howLong")}</span><div class="chips" role="group" aria-labelledby="nl">${[[0,"dayTrip"],[1,"night1"],[2,"night2"]].map(([k,l])=>`<button type="button" class="chip" aria-pressed="${W.nights===k}" data-n="${k}">${X(l)}</button>`).join("")}</div></div>`;
    ok = W.when === "tbd" || (W.when === "date" && !!W.date);
  } else if(step === "mode"){
    h = `<h3>${X("modeH")}</h3><div class="opts" role="group" aria-label="${X("around")}">${optBtn("data-m", "train", W.mode==="train", ["k_walk","k_train"], X("modeTrain"))}${optBtn("data-m", "car", W.mode==="car", ["k_drive"], X("modeCar"))}</div>`;
    ok = !!W.mode;
  }
  body.innerHTML = prog + `<div class="wz wz-q">${h}</div>`;
  const h3 = body.querySelector("h3"); h3.tabIndex = -1;
  foot(d, `<button type="button" class="btn" id="wzNext" ${ok?"":"disabled"}>${X(wStep===STEPS.length-1 ? "showPicks" : "next")}</button>`);
  $("#wzNext").addEventListener("click", wNext);
  const sel = $("#wzYear"); if(sel) sel.addEventListener("change", () => { W.year = sel.value; refocus("#wzYear"); renderWizard(); });
  body.querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => { W.gender = W.gender === b.dataset.g ? "" : b.dataset.g; refocus(`[data-g="${b.dataset.g}"]`); renderWizard(); }));
  body.querySelectorAll("[data-k]").forEach(b => b.addEventListener("click", () => { const k = b.dataset.k; W.kw = W.kw.includes(k) ? W.kw.filter(x=>x!==k) : W.kw.concat(k).slice(0,3); refocus(`[data-k="${k}"]`); renderWizard(); }));
  body.querySelectorAll("[data-w]").forEach(b => b.addEventListener("click", () => { W.when = b.dataset.w; if(W.when==="tbd") W.date=""; refocus(`[data-w="${W.when}"]`); renderWizard(); }));
  body.querySelectorAll("[data-n]").forEach(b => b.addEventListener("click", () => { W.nights = +b.dataset.n; refocus(`[data-n="${W.nights}"]`); renderWizard(); }));
  body.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { W.mode = b.dataset.m; refocus(`[data-m="${W.mode}"]`); renderWizard(); }));
  if(step === "when" && W.when === "date") renderWcal();
  const keep = wFocus && body.querySelector(wFocus); wFocus = null;
  if(keep) keep.focus(); else if(wLastStep !== wStep) h3.focus();
  wLastStep = wStep;
}
let wFocus = null, wLastStep = -1;
function refocus(sel){ wFocus = sel; }
/* dates follow Tokyo time, wherever the visitor is */
function todayTokyo(){ return new Date().toLocaleDateString("en-CA", {timeZone:"Asia/Tokyo"}); }
let calMonth = null;
function renderWcal(){
  const box = $("#wzCal"); if(!box) return;
  const t0 = todayTokyo(), today = new Date(t0 + "T00:00");
  if(!calMonth){ const b = W.date ? new Date(W.date+"T00:00") : today; calMonth = new Date(b.getFullYear(), b.getMonth(), 1); }
  const y = calMonth.getFullYear(), m = calMonth.getMonth(), first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
  const iso = dt => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  let cells = [0,1,2,3,4,5,6].map(i => `<span class="dw" aria-hidden="true">${weekday(new Date(2023,0,1+i), "narrow")}</span>`).join("");
  for(let i=0;i<first;i++) cells += "<span></span>";
  for(let dd=1; dd<=days; dd++){
    const dt = new Date(y,m,dd), v = iso(dt), past = v < t0;
    cells += `<button type="button" data-d="${v}" ${past?"disabled":""} aria-pressed="${W.date===v}" aria-label="${dt.toLocaleDateString(LOCALE, {weekday:"long", year:"numeric", month:"long", day:"numeric"})}">${dd}</button>`;
  }
  const canPrev = new Date(y,m,1) > new Date(today.getFullYear(), today.getMonth(), 1);
  box.innerHTML = `<div class="wcal"><div class="wcal-head"><button type="button" class="icon-btn" id="cPrev" aria-label="${X("prevMonth")}" ${canPrev?"":"disabled"}>${ico("left")}</button><span aria-live="polite">${calMonth.toLocaleDateString(LOCALE,{month:"long", year:"numeric"})}</span><button type="button" class="icon-btn" id="cNext" aria-label="${X("nextMonth")}">${ico("right")}</button></div><div class="wcal-grid">${cells}</div></div>`;
  $("#cPrev").addEventListener("click", () => { calMonth = new Date(y, m-1, 1); renderWcal(); $("#cPrev").focus(); });
  $("#cNext").addEventListener("click", () => { calMonth = new Date(y, m+1, 1); renderWcal(); $("#cNext").focus(); });
  box.querySelectorAll("[data-d]").forEach(b => b.addEventListener("click", () => { W.date = b.dataset.d; refocus(`#wzCal [data-d="${W.date}"]`); renderWizard(); }));
}

/* recommendation score: keyword match first, then the ranking position, then small nudges */
function score(id){
  const s = S[id], tags = s.tags || []; let sc = 0;
  W.kw.forEach((k, i) => { if((KW_TAGS[k] || [k]).some(t => tags.includes(t))) sc += 3 - i*.4; });   // first choice counts most
  DATA.genres.forEach(g => { if(g.key==="all") return; const i = g.ids.indexOf(id); if(i>=0) sc += (10-i)/10; });
  if(DATA.genres[0] && DATA.genres[0].ids.includes(id)) sc += .5;
  const age = W.year && W.year !== "skip" ? new Date().getFullYear() - (+W.year) : null;
  if(age !== null && age < 30 && (tags.includes("photo") || tags.includes("unique"))) sc += .4;
  if(age !== null && age >= 60 && (tags.includes("relax") || tags.includes("history"))) sc += .4;
  if(W.mode === "car" && SPOT_EN[id].parking && !/^no\b/i.test(SPOT_EN[id].parking)) sc += .5;
  if(W.mode === "train" && s.walk_min != null && s.walk_min <= 5) sc += .3;
  if(W.date){ const mo = +W.date.slice(5,7); if((mo===3||mo===4||mo===11||mo===12) && (tags.includes("seasonal")||tags.includes("nature"))) sc += .5; }
  return sc;
}
const ids = Object.keys(S);
const isStay = id => (DATA.genres.find(g=>g.key==="stay")||{ids:[]}).ids.includes(id);
function bucket(id){ const s = S[id]; if(isStay(id)) return "stay"; if(s.meal === "lunch") return "lunch"; if(s.meal === "dinner") return "dinner"; if(s.meal === "both") return "both"; if(s.meal === "cafe") return "cafe"; return "sight"; }
function top(filter, n){ return ids.filter(filter).sort((a,b)=>score(b)-score(a)).slice(0,n); }
/* lunch or dinner: remembered from the list a place was added from */
let slots = store.get("mt_slots", {});
function mealOf(id){ const b = bucket(id); if(b === "dinner") return "D"; if(b === "lunch" || b === "cafe") return "L"; if(b === "both") return slots[id] === "D" ? "D" : "L"; return null; }
/* ---------- results: picks on the left, the plan card on the right ---------- */
const tripDays = () => (W.nights || 0) + 1;
const tripLabel = n => X(n === 0 ? "dayTrip" : "nightsDays", {n, d: n + 1});
const PER = {sight:3, L:1, D:1};          // suggested per day
let shown = {};                           // how many cards each section shows
const SECS = [
  {key:"sight", title:"secSight", icon:"history", filter: id => bucket(id)==="sight", slot:""},
  {key:"L", title:"secL", icon:"food", filter: id => ["lunch","both","cafe"].includes(bucket(id)), slot:"L"},
  {key:"D", title:"secD", icon:"food", filter: id => ["dinner","both"].includes(bucket(id)), slot:"D"},
  {key:"stay", title:"secStay", icon:"stay", filter: id => bucket(id)==="stay", slot:""}
];
function countIn(key){ return plan.filter(id => key === "stay" ? isStay(id) : key === "sight" ? bucket(id)==="sight" : mealOf(id) === key).length; }
function needs(){
  const n = tripDays(), out = [];
  if(W.nights > 0) out.push({req:true, label:X("needStay"), left: countIn("stay") ? 0 : 1});
  out.push({req:false, label:X("needSight"), left: Math.max(0, PER.sight*n - countIn("sight"))});
  out.push({req:false, label:X("needL"), left: Math.max(0, PER.L*n - countIn("L"))});
  out.push({req:false, label:X("needD"), left: Math.max(0, PER.D*n - countIn("D"))});
  return out;
}
/* distance on each card: from the first spot in the plan, or from Tokyo Station while the plan is empty */
const distBase = () => plan.length ? pt(plan[0]) : PLACES.tokyo;
function fmtKm(k){ return k < 1 ? `${Math.max(1, Math.round(k*10))*100} m` : `${k < 10 ? k.toFixed(1) : Math.round(k)} km`; }
function distOf(id){ return plan[0] === id ? "" : fmtKm(km(distBase(), pt(id))); }
function renderResults(){
  const d = dialog("results", stepTitle(RESULTS_STEP)), body = d.querySelector(".xd-body");
  foot(d, "");
  const secs = SECS.filter(x => x.key !== "stay" || W.nights > 0);
  body.innerHTML = `<div class="res-page">
    <div class="res-main">
      <div class="res-head"><h3 tabindex="-1">${X("recH")}</h3><p class="sub">${X("recSub", {plus: `<span class="plus-dot" aria-hidden="true">${ico("plus")}</span>`})}</p>
      <p class="res-note" id="resNote"></p></div>
      ${secs.map(x => `<section class="res-sec" data-sec="${x.key}"><h4>${ico(x.icon)}${X(x.title)}</h4><div class="res-row" role="list"></div></section>`).join("")}
    </div>
    <aside class="res-side" aria-labelledby="rpT"><div class="plan-card" id="planCard"></div></aside>
  </div>`;
  secs.forEach(x => paintRow(x));
  paintPlanCard();
  show(d); body.querySelector("h3").focus();
}
function paintRow(x, keepFocus){
  const sec = page.querySelector(`[data-sec="${x.key}"]`); if(!sec) return;
  const note = $("#resNote"); if(note) note.textContent = plan.length ? X("distFirst", {name: S[plan[0]].name}) : X("distTokyo");
  const all = top(id => x.filter(id) && !plan.includes(id), 99), n = shown[x.key] || 6, list = all.slice(0, n);
  const row = sec.querySelector(".res-row"), keepX = row.scrollLeft;
  row.innerHTML = list.length ? list.map(id => { const s = S[id], dist = distOf(id);
    return `<div class="res-card ${s.img ? "" : "noimg"}" role="listitem" data-card="${esc(id)}">
      <button type="button" class="pic" data-open="${esc(id)}" aria-label="${esc(X("details", {name: s.name}))}">${img(s).replace(' loading="lazy"','')}<span class="cap"><b>${esc(s.name)}</b>${dist ? `<small>${dist}</small>` : ""}</span>${s.stock ? `<span class="img-only">${X("imgOnly")}</span>` : ""}</button>
      <button type="button" class="add" data-add="${esc(id)}" data-slot="${x.slot}" aria-label="${esc(X("addTo", {name: s.name}))}">${ico("plus")}</button>
    </div>`; }).join("")
    // "show more" sits at the end of the row, where you land after swiping right
    + (all.length > n ? `<div class="res-more-tile" role="listitem"><button type="button" class="res-more" data-more="${x.key}"><span class="rm-c">${ico("right")}</span><span>${X("more")}</span></button></div>` : "")
    : `<p class="empty">${X("allAdded")}</p>`;
  row.scrollLeft = keepX;
  row.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openSpot(b.dataset.open)));
  row.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => addFromCard(b)));
  const mb = row.querySelector("[data-more]");
  if(mb) mb.addEventListener("click", () => { shown[x.key] = n + 6; paintRow(x, n); });
  if(typeof keepFocus === "number"){ const c = row.children[keepFocus]; const f = c && c.querySelector(".pic"); if(f){ f.focus({preventScroll:true}); c.scrollIntoView({behavior: reduced ? "auto" : "smooth", block:"nearest", inline:"start"}); } }
}
function addFromCard(b){
  if(plan.includes(b.dataset.add)) return;
  page.querySelectorAll(`[data-add="${b.dataset.add}"]`).forEach(x => x.disabled = true);
  const id = b.dataset.add, card = b.closest(".res-card"), from = card.querySelector("img, .ph");
  if(b.dataset.slot){ slots[id] = b.dataset.slot; store.set("mt_slots", slots); }
  if(!plan.includes(id)){ plan = plan.concat(id); savePlan(); }
  const target = $("#planStack") || $("#planCard");
  const done = () => {
    paintPlanCard(true);
    const x = SECS.find(y => y.key === (isStay(id) ? "stay" : bucket(id)==="sight" ? "sight" : b.dataset.slot || mealOf(id)));
    const next = card.nextElementSibling || card.previousElementSibling;
    const nextId = next && next.dataset.card;
    SECS.forEach(y => paintRow(y));
    const f = (nextId && page.querySelector(`[data-card="${nextId}"] .add`)) || $("#planGo"); f && f.focus();
    toast(X("addedToast", {name: S[id].name}));
  };
  if(reduced || !from || !target || !from.animate){ done(); return; }
  // fly a copy of the photo into the plan card
  const a = from.getBoundingClientRect(), z = target.getBoundingClientRect();
  const fly = from.cloneNode(true); fly.className = "fly"; fly.removeAttribute("loading");
  Object.assign(fly.style, {left: a.left+"px", top: a.top+"px", width: a.width+"px", height: a.height+"px"});
  page.appendChild(fly);
  card.classList.add("leaving");
  const dx = z.left + z.width/2 - (a.left + a.width/2), dy = z.top + z.height/2 - (a.top + a.height/2), sc = Math.max(.18, Math.min(z.width / a.width, .5));
  fly.animate([{transform:"translate(0,0) scale(1)", opacity:1}, {transform:`translate(${dx*.55}px,${dy*.55 - 60}px) scale(${(1+sc)/2}) rotate(-6deg)`, opacity:1, offset:.6}, {transform:`translate(${dx}px,${dy}px) scale(${sc}) rotate(4deg)`, opacity:.2}],
    {duration:650, easing:"cubic-bezier(.45,.05,.3,1)"}).onfinish = () => { fly.remove(); done(); };
}
function paintPlanCard(bump){
  const box = $("#planCard"); if(!box) return;
  const n = tripDays(), pics = plan.filter(id => S[id].img).slice(-3).reverse();
  const list = needs(), sights = plan.filter(id => !isStay(id)).length;
  box.innerHTML = `<button type="button" class="pc-expand" id="pcToggle" aria-expanded="false" aria-controls="pcList" aria-label="${X("pcToggle")}">${ico("list")}</button>
    <div class="pc-stack" id="planStack" aria-hidden="true">${pics.length ? pics.map((id,i) => `<img src="${esc(S[id].img)}" alt="" class="s${i}">`).join("") : `<span class="pc-empty"></span>`}</div>
    <h3 id="rpT">${X("pcTitle")}</h3>
    <p class="pc-sum">${tripLabel(W.nights)} · ${X(plan.length === 1 ? "spot1" : "spotN", {n: plan.length})}</p>
    <ul class="pc-needs">${list.map(x => `<li><span class="tag ${x.req?"req":""}">${X(x.req ? "req" : "sug")}</span>${x.label} ${x.left ? `<b>${X("moreN", {n: x.left})}</b>` : `<b class="ok">${ico("check")}${X("done")}</b>`}</li>`).join("")}</ul>
    <div class="pc-list" id="pcList" hidden>${plan.length ? plan.map(id => miniRow(id, `<button type="button" class="icon-btn" data-rp="${esc(id)}" aria-label="${esc(X("rmPlan", {name: S[id].name}))}">${ico("x")}</button>`)).join("") : `<p class="empty">${X("nothingYet")}</p>`}</div>
    <button type="button" class="btn pc-go" id="planGo" ${plan.length?"":"disabled"}>${X("goCheck")}</button>`;
  if(bump && !reduced){ const st = $("#planStack"); st && st.animate([{transform:"scale(1)"},{transform:"scale(1.12)"},{transform:"scale(1)"}], {duration:350, easing:"ease-out"}); }
  const tg = $("#pcToggle"), pl = $("#pcList");
  tg.addEventListener("click", () => { const open = pl.hidden; pl.hidden = !open; tg.setAttribute("aria-expanded", open); });
  pl.querySelectorAll("[data-rp]").forEach(b => b.addEventListener("click", () => { plan = plan.filter(x => x !== b.dataset.rp); savePlan(); paintPlanCard(); $("#pcToggle").click(); SECS.forEach(y => paintRow(y)); $("#pcToggle").focus(); }));
  pl.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openSpot(b.dataset.open)));
  $("#planGo").addEventListener("click", openConfirm);
}
function refreshOpenViews(){ if(page && page.open && page.dataset.view === "results"){ paintPlanCard(); SECS.forEach(y => paintRow(y)); } }

/* ---------- confirm + itinerary ---------- */
const PLACES = {
  tokyo:["Tokyo Station",35.6812,139.7671], shinjuku:["Shinjuku Station",35.6896,139.7006], shibuya:["Shibuya Station",35.6580,139.7016],
  ueno:["Ueno Station",35.7138,139.7773], asakusa:["Asakusa Station",35.7110,139.7964], ginza:["Ginza Station",35.6717,139.7650],
  haneda:["Haneda Airport",35.5494,139.7798], narita:["Narita Airport",35.7720,140.3929]
};
Object.keys(PLACES).forEach(k => { const v = X("pl." + k); if(v !== "x.pl." + k) PLACES[k][0] = v; });
let T = Object.assign({start:"tokyo", end:"tokyo", time:"auto", days:null}, store.get("mt_trip", {}));
T.shared = false;
const saveT = () => { const {shared, ...rest} = T; if(!shared) store.set("mt_trip", rest); };
function nightsNow(){ return W.nights || 0; }
function openConfirm(){ push(() => renderConfirm()); }
function renderConfirm(focusSel){
  const d = dialog("confirm", X("checkH")), body = d.querySelector(".xd-body");
  const n = nightsNow(), sights = plan.filter(id => !isStay(id)), stays = plan.filter(isStay);
  const opt = sel => Object.entries(PLACES).map(([k,[l]]) => `<option value="${k}" ${k===sel?"selected":""}>${esc(l)}</option>`).join("") + (stays.length && n > 0 ? `<option value="hotel" ${sel==="hotel"?"selected":""}>${X("hotelOpt")}</option>` : "");
  let times = `<option value="auto" ${T.time==="auto"?"selected":""}>${X("auto")}</option>`;
  for(let h=6; h<=14; h++) for(const mm of ["00","30"]){ const v = `${h}:${mm}`; times += `<option value="${v}" ${T.time===v?"selected":""}>${v}</option>`; }
  const warn = n===0 && stays.length ? `<p class="sd-note">${X("dayHotelsOut")}</p>` : n > 0 && !stays.length ? `<p class="it-warn">${X("needHotel", {n})}</p>` : stays.length > n ? `<p class="sd-note">${X("oneHotel", {n})}</p>` : n > 1 && stays.length < n ? `<p class="sd-note">${esc(X("remainNights", {name: S[stays[stays.length-1]].name}))}</p>` : "";
  body.innerHTML = `<div class="wz wz-q">
    <h3 tabindex="-1">${tripLabel(n)} · ${X(sights.length === 1 ? "spot1" : "spotN", {n: sights.length})}</h3>
    <p class="sub">${X("cfSub")}</p>
    <div class="wz-field"><span class="lbl" id="lenL">${X("tripLen")}</span><div class="chips" role="group" aria-labelledby="lenL">${[[0,"dayTrip"],[1,"night1"],[2,"night2"]].map(([k,l])=>`<button type="button" class="chip" aria-pressed="${n===k}" data-n="${k}">${X(l)}</button>`).join("")}</div></div>
    ${warn}
    <div id="cfList" class="cf-list">${plan.map(id => miniRow(id, `<button type="button" class="icon-btn" data-rm="${esc(id)}" aria-label="${esc(X("remove", {name: S[id].name}))}">${ico("x")}</button>`)).join("") || `<p class="empty">${X("planEmpty")}</p>`}</div>
    <div class="wz-field" style="margin-top:18px"><label for="cfTime">${X("startTime")}</label><select id="cfTime">${times}</select></div>
    <div class="wz-field"><label for="cfStart">${X("startPt")}</label><select id="cfStart">${opt(T.start)}</select></div>
    <div class="wz-field"><label for="cfEnd">${X("endPt")}</label><select id="cfEnd">${opt(T.end)}</select></div>
    <div class="wz-field"><span class="lbl" id="mdL">${X("around")}</span><div class="chips" role="group" aria-labelledby="mdL">${[["train","modeTrain"],["car","modeCar"]].map(([k,l])=>`<button type="button" class="chip" aria-pressed="${(W.mode||"train")===k}" data-m="${k}">${X(l)}</button>`).join("")}</div></div>
  </div>`;
  foot(d, `<button type="button" class="btn ghost" id="cfAdd">${X("addMore")}</button><button type="button" class="btn" id="cfGo" ${sights.length && !(n > 0 && !stays.length) ? "" : "disabled"}>${X("create")}</button>`);
  const keep = () => { T.time = $("#cfTime").value; T.start = $("#cfStart").value; T.end = $("#cfEnd").value; saveT(); };
  ["#cfTime","#cfStart","#cfEnd"].forEach(s => $(s).addEventListener("change", keep));
  body.querySelectorAll("[data-rm]").forEach((b, i) => b.addEventListener("click", () => { plan = plan.filter(x=>x!==b.dataset.rm); savePlan(); const nx = plan[i] || plan[i-1]; renderConfirm(nx ? `[data-rm="${nx}"]` : "#cfAdd"); }));
  body.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openSpot(b.dataset.open)));
  body.querySelectorAll("[data-n]").forEach(b => b.addEventListener("click", () => { W.nights = +b.dataset.n; store.set("mt_wz", W); if(W.nights===0 && (T.start==="hotel"||T.end==="hotel")){ T.start = T.start==="hotel"?"tokyo":T.start; T.end = T.end==="hotel"?"tokyo":T.end; saveT(); } renderConfirm(`[data-n="${W.nights}"]`); }));
  body.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { W.mode = b.dataset.m; store.set("mt_wz", W); renderConfirm(`[data-m="${W.mode}"]`); }));
  $("#cfAdd").addEventListener("click", () => { if(!W.year || !W.kw.length || !W.when || !W.mode) openWizard(); else push(renderResults); });
  $("#cfGo").addEventListener("click", () => {
    keep(); T.mode = W.mode || "train"; T.date = W.when === "date" ? W.date : ""; T.shared = false;
    T.days = arrange(plan, nightsNow()); T.orig = T.days.map(d => d.slice()); saveT(); push(() => renderItinerary());
  });
  show(d);
  const f = focusSel && body.querySelector(focusSel) || (focusSel && $(focusSel)); (f || body.querySelector("h3")).focus();
}
const R = d => d*Math.PI/180;
function km(a, b){ const dLat = R(b[1]-a[1]), dLng = R(b[2]-a[2]); const h = Math.sin(dLat/2)**2 + Math.cos(R(a[1]))*Math.cos(R(b[1]))*Math.sin(dLng/2)**2; return 12742*Math.asin(Math.sqrt(h)); }
function pt(id){ const s = S[id]; return [s.name, s.lat, s.lng]; }
function place(key, days, last){ if(key === "hotel"){ const hs = (days||[]).flat().filter(isStay), h = last ? hs[hs.length-1] : hs[0]; if(h) return pt(h); key = "tokyo"; } return PLACES[key] || PLACES.tokyo; }
function travel(a, b, mode){
  const k = km(a, b); let m, by = mode === "car" ? "byCar" : "byTrain";
  if(mode === "walk") { m = k*1.3/4.5*60; by = "byFoot"; }
  else if(mode === "car") m = 8 + k*1.4/22*60;
  else if(k < 1){ m = k*1.3/4.5*60; by = "byFoot"; }
  else m = 12 + k*1.3/28*60;
  return {min: Math.max(5, Math.round(m/5)*5), km: k, by};
}
function nearestOrder(list, from){
  const out = [], rest = list.slice(); let at = from;
  while(rest.length){ let bi = 0, bd = Infinity; rest.forEach((id,i)=>{ const dd = km(at, pt(id)); if(dd < bd){ bd = dd; bi = i; } }); at = pt(rest[bi]); out.push(rest.splice(bi,1)[0]); }
  return out;
}

/* ----- opening hours, in minutes from midnight (past midnight = more than 1440) -----
   Read from the first "9:00-17:00" in the hours text. Places whose text is unclear or has
   two sessions are written out here by hand. null = no fixed hours we can plan around. */
const OPEN = {
  "fuunji-shinjuku":[[660,900],[1020,1260]], "koganeyu-kinshicho":[[360,540],[660,1470]],
  "golden-gai":[[1200,1560]], "omoide-yokocho":[[1020,1380]], "meiji-jingu":[[400,960]],
  "toraya-akasaka":[[660,1050]], "zojoji-temple":[[540,1020]], "asakusa-kagetsudo":[[600,960]],
  "fuglen-tokyo":[[420,1320]], "senso-ji":[[390,1020]]
};
function windowsOf(id){
  if(OPEN[id]) return OPEN[id];
  const h = String(SPOT_EN[id] && SPOT_EN[id].hours || "");
  if(/24 hours|always open|any time|open all day/i.test(h)) return [[0, 2880]];
  const m = h.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/); if(!m) return null;
  const o = (+m[1])*60 + (+m[2]); let c = (+m[3])*60 + (+m[4]); if(c <= o) c += 1440;
  return [[o, c]];
}
const DOW_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function maybeClosed(id, date){ if(!date) return false; const c = (SPOT_EN[id] && SPOT_EN[id].closed || "").replace(/\([^)]*\)/g, ""); if(/^\s*(open daily|open (all|year)|no regular)/i.test(c)) return false; const w = DOW_EN[date.getDay()]; return new RegExp("\\b" + w + "s?\\b", "i").test(c) || new RegExp("\\b" + w.slice(0,3) + "\\b").test(c); }
const LUNCH = [690, 840], DINNER = [1050, 1260];   // lunch 11:30-14:00, dinner 17:30-21:00
const stayMin = id => S[id].duration_min || (mealOf(id) ? 60 : 90);

/* walk through one day in a given order: when we arrive, wait for opening, eat at meal times.
   cost = travel minutes + waiting + heavy penalties for arriving closed, late meals, very late nights. */
function simDay(order, origin, end, t0, date, mode){
  let at = origin, t = t0, cost = 0, nL = 0, nD = 0; const stops = [];
  order.forEach(id => {
    const mv = travel(at, pt(id), mode); t += mv.min; cost += mv.min; at = pt(id);
    if(isStay(id)){ stops.push({id, arrive:t, move:mv, meal:null, wait:0}); return; }
    const meal = mealOf(id), dur = stayMin(id), win = windowsOf(id);
    let start = t;
    if(meal === "L" && bucket(id) !== "cafe"){ start = Math.max(start, LUNCH[0]); nL++; }
    if(meal === "D"){ start = Math.max(start, DINNER[0]); nD++; }
    let closed = false, tight = null;
    if(win){
      // the first opening window we can still use for at least half the visit
      const w = win.find(w => w[1] - Math.max(start, w[0]) >= Math.min(dur, 60) * .75);
      if(w) start = Math.max(start, w[0]); else closed = true;
      if(w && start + dur > w[1]){ cost += (start + dur - w[1]) * 4; tight = w[1]; }
    }
    if(closed) cost += 400;
    if(maybeClosed(id, date)) cost += 400;
    const wait = start - t; cost += wait * .6;
    if(meal === "L" && bucket(id) !== "cafe" && start > LUNCH[1]) cost += (start - LUNCH[1]) * 2;
    if(meal === "D" && start > DINNER[1]) cost += (start - DINNER[1]) * 2;
    stops.push({id, arrive:start, move:mv, meal, wait, closed, tight});
    t = start + dur;
  });
  cost += Math.max(0, nL - 1) * 300 + Math.max(0, nD - 1) * 300;
  let endMove = null;
  if(end && km(at, end) > 0.05){ endMove = travel(at, end, mode); t += endMove.min; cost += endMove.min; }
  cost += Math.max(0, t - 22*60) * 3;
  return {stops, t, cost, endMove};
}
/* best order inside one day. Up to 7 stops: try every order. More: improve by moving one stop at a time. */
function bestOrder(list, ctx){
  const stays = list.filter(isStay), rest = list.filter(id => !isStay(id));
  const cost = o => simDay(o.concat(stays), ctx.origin, ctx.end, ctx.t0, ctx.date, ctx.mode).cost;
  if(rest.length <= 1) return {order: rest.concat(stays), cost: cost(rest)};
  let best = nearestOrder(rest, ctx.origin), bc = cost(best);
  if(rest.length <= 7 && ctx.exact){
    const perm = (arr, k) => { if(k === arr.length){ const c = cost(arr); if(c < bc){ bc = c; best = arr.slice(); } return; }
      for(let i = k; i < arr.length; i++){ [arr[k], arr[i]] = [arr[i], arr[k]]; perm(arr, k+1); [arr[k], arr[i]] = [arr[i], arr[k]]; } };
    perm(rest.slice(), 0);
  } else {
    for(let again = true, guard = 0; again && guard < 20; guard++){
      again = false;
      for(let i = 0; i < best.length; i++) for(let j = 0; j < best.length; j++){ if(i === j) continue;
        const o = best.slice(); const [x] = o.splice(i, 1); o.splice(j, 0, x); const c = cost(o);
        if(c < bc - .01){ bc = c; best = o; again = true; } }
    }
  }
  return {order: best.concat(stays), cost: bc};
}
function dayCtx(days, di, exact){
  const mode = T.mode || W.mode || "train", t0 = mins(T.time === "auto" ? "9:00" : T.time);
  const prevStay = di > 0 ? days[di-1].find(isStay) : null;
  return {origin: prevStay ? pt(prevStay) : place(T.start, days), end: di === days.length-1 ? place(T.end, days, true) : null,
    t0: di > 0 ? Math.max(t0, 540) : t0, date: dayDate(di), mode, exact};
}
function planCost(days, exact){ return days.reduce((sum, dy, di) => sum + bestOrder(dy, dayCtx(days, di, exact)).cost + (dy.some(id => !isStay(id)) ? 0 : 250), 0); }

/* split spots into days, then keep moving single stops between days while it makes the trip shorter or fits opening hours better */
function arrange(list, nights){
  const nd = nights + 1, picked = list.filter(isStay).slice(0, nights), stays = picked.length ? Array.from({length: nights}, (_, i) => picked[Math.min(i, picked.length-1)]) : [];
  const spots = list.filter(id => !isStay(id));
  const start = place(T.start === "hotel" ? "tokyo" : T.start), ordered = nearestOrder(spots, start);
  const cuts = ordered.slice(1).map((id, i) => ({i: i+1, d: km(pt(ordered[i]), pt(id))}))
    .sort((a,b) => b.d - a.d).slice(0, nd-1).map(c => c.i).sort((a,b) => a-b);
  let days = []; let from = 0;
  cuts.concat(ordered.length).forEach(c => { days.push(ordered.slice(from, c)); from = c; });
  while(days.length < nd) days.push([]);
  stays.forEach((id, i) => days[Math.min(i, nd-2)].push(id));
  if(nd > 1){
    let cur = planCost(days, false);
    for(let pass = 0; pass < 4; pass++){
      let moved = false;
      for(let a = 0; a < nd; a++) for(const id of days[a].filter(x => !isStay(x))) for(let b = 0; b < nd; b++){
        if(a === b || !days[a].includes(id)) continue;
        const trial = days.map(d => d.slice()); trial[a] = trial[a].filter(x => x !== id);
        const hs = trial[b].filter(isStay); trial[b] = trial[b].filter(x => !isStay(x)).concat(id, hs);
        const c = planCost(trial, false); if(c < cur - 1){ cur = c; days = trial; moved = true; }
      }
      if(!moved) break;
    }
  }
  return days.map((dy, di) => bestOrder(dy, dayCtx(days, di, true)).order);
}
function mins(t){ const [h,m] = t.split(":").map(Number); return h*60+m; }
const clock = m => `${Math.floor(m/60) % 24}:${String(m%60).padStart(2,"0")}`;
const hhmm = m => m >= 1440 ? X("nextDay", {t: clock(m)}) : clock(m);
function dayDate(di){ if(!T.date) return null; const d = new Date(T.date+"T00:00"); d.setDate(d.getDate()+di); return d; }
function timeline(days){
  return days.map((dy, di) => {
    const c = dayCtx(days, di), r = simDay(dy, c.origin, c.end, c.t0, c.date, c.mode);
    return {stops: r.stops, origin: c.origin, start: c.t0, end: c.end, endMove: r.endMove, endAt: r.endMove ? r.t : null, date: c.date};
  });
}
let leafletLoading = null;
function loadLeaflet(){
  if(window.L) return Promise.resolve();
  if(leafletLoading) return leafletLoading;
  leafletLoading = new Promise((res, rej) => {
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(css);
    const js = document.createElement("script"); js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; js.onload = res; js.onerror = rej; document.head.appendChild(js);
  });
  return leafletLoading;
}
function gmapsDir(tl){
  const o = `${tl.origin[1]},${tl.origin[2]}`;
  const seq = [o].concat(tl.stops.map(s => `${S[s.id].lat},${S[s.id].lng}`), tl.end ? [`${tl.end[1]},${tl.end[2]}`] : []).filter((p, i, a) => i === 0 || p !== a[i-1]);
  if(seq.length < 2) return null;
  const dest = seq[seq.length-1], way = seq.slice(1, -1);
  const mode = {walk:"walking", car:"driving", train:"transit"}[T.mode || "train"];
  return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${dest}${way.length?"&waypoints="+encodeURIComponent(way.join("|")):""}&travelmode=${mode}`;
}
let showTimer = null, map = null, mapGen = 0, editing = false;
function openItinerary(){ push(() => renderItinerary()); }
function renderItinerary(focusSel){
  const d = dialog("itinerary", X("pcTitle")), body = d.querySelector(".xd-body");
  const keepTop = focusSel ? body.scrollTop : 0;
  const days = T.days || [], tls = timeline(days), all = days.flat(), withImg = all.filter(id=>S[id].img);
  const moveTxt = mv => X("moveMin", {n: mv.min, by: X(mv.by)});
  let n = 0;
  body.innerHTML = `<div class="it">
    ${T.shared ? `<p class="sd-note">${X("shared")}</p>` : ""}
    ${withImg.length ? `<div class="show" id="slides" aria-roledescription="slideshow" aria-label="${X("slides")}">${withImg.map((id,i)=>`<figure class="${i===0?"on":""}" ${i===0?"":'aria-hidden="true"'}><img src="${esc(S[id].img)}" alt=""><figcaption>${esc(S[id].name)}</figcaption></figure>`).join("")}
      <div class="ctl"><button type="button" id="slPrev" aria-label="${X("prevPhoto")}">${ico("left")}</button><button type="button" id="slP"></button><button type="button" id="slNext" aria-label="${X("nextPhoto")}">${ico("right")}</button></div></div>` : ""}
    <p class="sd-note it-how">${X("orderNote")}</p>
    <div class="it-map" id="itMap" role="img" aria-label="${X("mapAria")}"></div>
    ${tls.map((tl, di) => {
      const dt = tl.date, link = gmapsDir(tl);
      return `${days.length>1 || dt ? `<h4 class="it-day">${days.length>1 ? X("dayN", {n: di+1}) : ""}${dt?`${days.length>1?" · ":""}${dt.toLocaleDateString(LOCALE,{weekday:"short", day:"numeric", month:"short"})}`:""}</h4>`:""}
      <p class="it-ends">${esc(X("start", {place: tl.origin[0], time: hhmm(tl.start)}))}</p>
      ${tl.stops.length ? "" : `<p class="empty">${X("nothingDay")}</p>`}
      <ol class="it-list">${tl.stops.map((st, si) => { n++; const warn = [], stay = isStay(st.id);
        if(!stay && st.arrive >= 24*60) warn.push(X("wMidnight"));
        else if(st.closed) warn.push(esc(X("wClosed", {h: S[st.id].hours})));
        else if(!stay && !st.meal && st.arrive >= 21*60 && (windowsOf(st.id) || [[0]])[0][0] < 17*60) warn.push(X("wLate"));
        else if(st.tight && st.tight - st.arrive < stayMin(st.id) - 15) warn.push(esc(X("tight", {t: clock(st.tight)})));
        if(maybeClosed(st.id, dt)) warn.push(esc(X("wDow", {day: weekday(dt)})));
        const note = !stay && st.wait >= 15 && !st.meal ? `<div class="it-info">${esc(X("wOpen", {t: hhmm(st.arrive)}))}</div>` : "";
        const mealTxt = st.meal === "L" ? X("tagL") : st.meal === "D" ? X("tagD") : "";
        return `<li>
        <div class="it-move">${moveTxt(st.move)}</div>
        <div class="it-stop"><span class="it-time"><span class="it-n">${n}</span>${stay ? X("night") : hhmm(st.arrive)}</span>${img(S[st.id])}
          <div><div class="t"><button type="button" data-open="${esc(st.id)}">${esc(S[st.id].name)}</button></div><div class="s">${esc(S[st.id].area||"")}${mealTxt ? " · " + mealTxt : ""}</div>${note}${warn.map(w=>`<div class="it-warn">${w}</div>`).join("")}</div>
          <div class="it-edit" ${editing?"":"hidden"}>
            <button type="button" class="icon-btn" data-mv="${di},${si},-1" data-k="up-${esc(st.id)}" aria-label="${esc(X("moveEarlier", {name: S[st.id].name}))}" ${si===0&&di===0?"disabled":""}>${ico("up")}</button>
            <button type="button" class="icon-btn" data-mv="${di},${si},1" data-k="down-${esc(st.id)}" aria-label="${esc(X("moveLater", {name: S[st.id].name}))}" ${si===tl.stops.length-1&&di===days.length-1?"disabled":""}>${ico("down")}</button>
            <button type="button" class="icon-btn" data-del="${di},${si}" aria-label="${esc(X("remove", {name: S[st.id].name}))}">${ico("x")}</button>
          </div>
        </div></li>`; }).join("")}</ol>
      ${tl.end ? `<div class="it-move">${tl.endMove ? moveTxt(tl.endMove) : ""}</div><p class="it-ends">${esc(tl.endAt ? X("finishAt", {place: tl.end[0], time: hhmm(tl.endAt)}) : X("finish", {place: tl.end[0]}))}</p>` : ""}
      ${link ? `<p style="margin:10px 0 0"><a href="${esc(link)}" target="_blank" rel="noopener">${days.length > 1 ? X("openDayRoute", {n: di+1}) : X("openRoute")}</a></p>` : ""}`;
    }).join("")}
    <p class="sd-note">${X("estNote")}</p>
    <div class="it-tools it-tools-end"><button type="button" class="btn small ghost" id="itShare">${X("share")}</button>${T.shared ? "" : `<button type="button" class="btn small ghost" id="itEdit" aria-pressed="${editing}">${X(editing ? "doneEdit" : "edit")}</button><button type="button" class="btn small ghost" id="itAuto">${X("reorder")}</button>`}</div>
  </div>`;
  foot(d, `<button type="button" class="btn ghost" id="itBack">${X(T.shared ? "copyToMine" : "change")}</button><button type="button" class="btn" id="itBook">${X("book")}</button>`);
  $("#itBack").addEventListener("click", () => {
    if(T.shared){
      if(!confirm(X("replaceConfirm"))) return;
      plan = all.slice(); savePlan(); store.set("mt_slots", slots);
      W.nights = Math.max(0, days.length-1); W.mode = T.mode; if(T.date){ W.when = "date"; W.date = T.date; } store.set("mt_wz", W);
      T.shared = false; saveT(); renderItinerary(); toast(X("copied")); return;
    }
    openConfirm();
  });
  const ab = $("#itAuto"); if(ab) ab.addEventListener("click", () => {
    const now = T.days.flat(), orig = (T.orig || []).map(d => d.filter(id => now.includes(id)));
    // spots removed since are left out; if nothing usable is stored, work the order out again
    T.days = orig.length && orig.flat().length === now.length ? orig : arrange(now, Math.max(0, T.days.length - 1));
    saveT(); renderItinerary("#itAuto"); toast(X("reordered")); });
  $("#itBook").addEventListener("click", () => { location.href = window.I18N ? I18N.keepLang("tour.html?t=custom") : "tour.html?t=custom"; });
  body.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openSpot(b.dataset.open)));
  const eb = $("#itEdit"); if(eb) eb.addEventListener("click", () => { editing = !editing; renderItinerary("#itEdit"); });
  body.querySelectorAll("[data-mv]").forEach(b => b.addEventListener("click", () => {
    const [di, si, dir] = b.dataset.mv.split(",").map(Number), dy = T.days[di], id = dy[si];
    if(dir < 0 && si === 0){ dy.splice(si,1); T.days[di-1].push(id); }
    else if(dir > 0 && si === dy.length-1){ dy.splice(si,1); T.days[di+1].unshift(id); }
    else { dy.splice(si,1); dy.splice(si+dir, 0, id); }
    saveT(); renderItinerary(`[data-k="${dir<0?"up":"down"}-${id}"]`);
  }));
  body.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
    const [di, si] = b.dataset.del.split(",").map(Number), id = T.days[di][si];
    T.days[di].splice(si,1); plan = plan.filter(x=>x!==id); savePlan(); saveT();
    const nx = T.days[di][si] || T.days[di][si-1]; renderItinerary(nx ? `[data-del="${di},${T.days[di][si] ? si : si-1}"]` : "#itEdit");
  }));
  $("#itShare").addEventListener("click", sharePlan);
  // slideshow
  clearInterval(showTimer);
  const figs = body.querySelectorAll("#slides figure"); let si = 0, playing = !reduced && figs.length > 1;
  const go = k => { figs[si].classList.remove("on"); figs[si].setAttribute("aria-hidden","true"); si = (k + figs.length) % figs.length; figs[si].classList.add("on"); figs[si].removeAttribute("aria-hidden"); };
  const pb = $("#slP");
  if(pb){
    const paint = () => { pb.innerHTML = ico(playing ? "pause" : "play"); pb.setAttribute("aria-label", X(playing ? "pause" : "play")); };
    const run = () => { clearInterval(showTimer); if(playing) showTimer = setInterval(() => go(si+1), 3800); };
    if(figs.length < 2) body.querySelector("#slides .ctl").hidden = true;
    paint(); run();
    pb.addEventListener("click", () => { playing = !playing; paint(); run(); });
    $("#slPrev").addEventListener("click", () => { go(si-1); run(); });
    $("#slNext").addEventListener("click", () => { go(si+1); run(); });
  }
  if(!d.dataset.closeHook){ d.dataset.closeHook = "1"; d.addEventListener("close", () => clearInterval(showTimer)); }
  show(d);
  if(focusSel){ body.scrollTop = keepTop; let f = body.querySelector(focusSel);
    if(f && f.disabled){ const row = f.closest(".it-stop"); f = row && (row.querySelector(".icon-btn:not(:disabled)") || row.querySelector(".t button")); }
    if(f) f.focus(); }
  // map: only the latest render draws, and the old map is removed first
  const gen = ++mapGen;
  if(map){ try{ map.remove(); }catch(e){} map = null; }
  loadLeaflet().then(() => {
    const el = $("#itMap"); if(gen !== mapGen || !el || !el.isConnected || !window.L) return;
    try{
      map = L.map(el, {scrollWheelZoom:false}); L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:18, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
      const pts = []; let k = 0;
      const pin = (p, html, cls) => { L.marker([p[1],p[2]], {icon: L.divIcon({className:"", html:`<div class="pin ${cls||""}">${html}</div>`, iconSize:[26,26]}), title:p[0], keyboard:false}).addTo(map); pts.push([p[1],p[2]]); };
      tls.forEach((tl, di) => {
        const line = [[tl.origin[1], tl.origin[2]]];
        if(di === 0) pin(tl.origin, "S", "end");
        tl.stops.forEach(st => { k++; const s = S[st.id]; line.push([s.lat,s.lng]); pin(pt(st.id), k); });
        if(tl.end){ line.push([tl.end[1],tl.end[2]]); pin(tl.end, "G", "end"); }
        L.polyline(line, {color:"#c2452d", weight:3, opacity:.7, dashArray:"6 6"}).addTo(map);
      });
      if(pts.length) map.fitBounds(pts, {padding:[30,30]}); else map.setView([35.68,139.76], 12);
    }catch(e){ el.hidden = true; }
  }).catch(() => { const el = $("#itMap"); if(el && gen === mapGen) el.hidden = true; });
}
function sharePlan(){
  const sl = {}; (T.days||[]).flat().forEach(id => { if(bucket(id) === "both") sl[id] = mealOf(id); });
  const payload = {d: T.days, s: T.start, e: T.end, t: T.time, m: T.mode || "train", dt: T.date || "", sl};
  const url = location.origin + location.pathname + (LANG !== "en" ? "?lang=" + LANG : "") + "#trip=" + encodeURIComponent(btoa(JSON.stringify(payload)));
  const copy = () => navigator.clipboard ? navigator.clipboard.writeText(url).then(() => toast(X("linkCopied")), () => prompt(X("copyLink"), url)) : prompt(X("copyLink"), url);
  if(navigator.share) navigator.share({title: X("shareTitle"), url}).catch(e => { if(!e || e.name !== "AbortError") copy(); });
  else copy();
}
function loadShared(){
  const m = location.hash.match(/^#trip=(.+)$/); if(!m) return;
  try{
    const p = JSON.parse(atob(decodeURIComponent(m[1])));
    const days = (Array.isArray(p.d) ? p.d : []).map(dy => (Array.isArray(dy) ? dy : []).filter(id => S[id]));
    if(!days.flat().length) return;
    const okPlace = k => (PLACES[k] || k === "hotel") ? k : "tokyo";
    if(p.sl && typeof p.sl === "object") Object.keys(p.sl).forEach(id => { if(S[id] && (p.sl[id] === "L" || p.sl[id] === "D")) slots[id] = p.sl[id]; });
    T = {start: okPlace(p.s), end: okPlace(p.e), time: /^\d{1,2}:\d{2}$/.test(p.t) ? p.t : "auto", mode: ["walk","train","car"].includes(p.m) ? p.m : "train", date: /^\d{4}-\d{2}-\d{2}$/.test(p.dt||"") ? p.dt : "", days, shared: true};
    openItinerary();
  }catch(e){}
}

/* ---------- start ---------- */
if(tabs){ buildTabs(); paintTabs(); renderGrid(); arrows(); }
updateCounts();
document.querySelectorAll("[data-open-wizard]").forEach(b => b.addEventListener("click", openWizard));
document.querySelectorAll("[data-open-pick]").forEach(b => b.addEventListener("click", openPick));
loadShared();
window.MT = {openSpot, openWizard, openConfirm, openPick};
})();

/* sliding rows on the home page (tours, blog): arrow buttons appear only when there is more to see */
document.querySelectorAll("[data-carousel]").forEach(c => {
  const track = c.querySelector(".hcar-track"), prev = c.querySelector(".prev"), next = c.querySelector(".next");
  const paint = () => { prev.hidden = track.scrollLeft < 8; next.hidden = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8; };
  prev.addEventListener("click", () => track.scrollBy({left: -track.clientWidth * .9}));
  next.addEventListener("click", () => track.scrollBy({left: track.clientWidth * .9}));
  track.addEventListener("scroll", paint, {passive:true}); addEventListener("resize", paint);
  new MutationObserver(paint).observe(track, {childList:true}); setTimeout(paint, 300);
});
