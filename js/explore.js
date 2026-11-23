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
  pause:'<path d="M8 5v14M16 5v14"/>', play:'<path d="M7 5l12 7-12 7z"/>'
};
const ico = (k, extra="") => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${P[k]||""}</svg>`;
const crown = c => `<svg viewBox="0 0 48 44" aria-hidden="true"><path d="M5 13l9 9 10-16 10 16 9-9-3.5 27h-31z" fill="${c}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="5" cy="12" r="3" fill="${c}" stroke="#fff" stroke-width="1.5"/><circle cx="24" cy="5" r="3" fill="${c}" stroke="#fff" stroke-width="1.5"/><circle cx="43" cy="12" r="3" fill="${c}" stroke="#fff" stroke-width="1.5"/></svg>`;
const MEDAL = ["var(--gold)", "var(--silver)", "var(--bronze)"];

const genreOf = id => DATA.genres.find(g => g.key !== "all" && g.ids.includes(id));
const img = (s, cls="") => s && s.img ? `<img src="${esc(s.img)}" alt="" loading="lazy" ${cls}>` : `<span class="ph" aria-hidden="true">${esc((s && s.name || "?").charAt(0))}</span>`;

/* ---------- state ---------- */
let plan = store.get("mt_plan", []).filter(id => S[id]);
let favs = store.get("mt_favs", []).filter(id => S[id]);
const savePlan = () => { store.set("mt_plan", plan); updateCounts(); };
const saveFavs = () => { store.set("mt_favs", favs); updateCounts(); };
function togglePlan(id){ plan = plan.includes(id) ? plan.filter(x=>x!==id) : plan.concat(id); savePlan(); toast(plan.includes(id) ? "Added to your trip plan" : "Removed from your trip plan"); return plan.includes(id); }
function toggleFav(id){ favs = favs.includes(id) ? favs.filter(x=>x!==id) : favs.concat(id); saveFavs(); toast(favs.includes(id) ? "Saved to favorites" : "Removed from favorites"); return favs.includes(id); }

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
  tabs.innerHTML = DATA.genres.map(g => `<button type="button" class="gtab" role="tab" id="gt-${g.key}" aria-controls="rankPanel">${ico(g.key)}<span>${esc(g.label)}</span></button>`).join("") + '<span class="gtab-bar" id="gBar" aria-hidden="true"></span>';
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
  $("#rankNote").textContent = g.note || "";
  grid.innerHTML = g.ids.map((id,i) => { const s = S[id]; if(!s) return "";
    const badge = i < 3 ? `<span class="rank-badge">${crown(MEDAL[i])}<b>${i+1}</b></span>` : `<span class="rank-badge plain"><b>${i+1}</b></span>`;
    return `<li class="rcard">${badge}<button type="button" data-id="${esc(id)}" aria-label="No. ${i+1}: ${esc(s.name)}. Open details"><span class="pic">${img(s)}</span><span class="nm">${esc(s.name)}</span></button></li>`;
  }).join("");
  grid.querySelectorAll("button[data-id]").forEach(b => b.addEventListener("click", () => openSpot(b.dataset.id)));
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
    page.innerHTML = `<div class="xd-top"><button type="button" class="xd-back" aria-label="Back">${ico("left")}<span>Back</span></button><h2 id="mtPageT"></h2><button type="button" class="xd-x" aria-label="Close">${ico("x")}</button></div><div class="xd-body"></div><div class="xd-foot" hidden></div>`;
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
function closeAll(){ if(pos) history.go(-pos); else if(page && page.open) page.close(); }
addEventListener("popstate", e => {
  const n = (e.state && e.state.mt) || 0;
  pos = Math.min(n, stack.length);
  if(pos){ stack[pos-1](); show(page); page.querySelector(".xd-body").scrollTop = 0; restore(); }
  else if(page && page.open) page.close();
});
function foot(d, html){ const f = d.querySelector(".xd-foot"); f.hidden = !html; f.innerHTML = html || ""; return f; }

/* ---------- spot detail ---------- */
function mapsSearch(s){ return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((s.name_ja || s.name) + " " + (s.address || "")); }
function openSpot(id){ if(S[id]) push(() => renderSpot(id)); }
function renderSpot(id){
  const s = S[id]; if(!s) return;
  const g = genreOf(id), d = dialog("spot", s.name);
  const row = (k, v) => v ? `<li><span class="k">${k}</span><span class="v">${v}</span></li>` : "";
  const access = s.station ? esc(s.station) + (s.walk_min != null ? `, ${esc(s.walk_min)} min walk` : "") : "";
  const parking = [s.parking, s.car].filter(Boolean).map(esc).join("\n");
  const web = s.website ? `<a href="${esc(s.website)}" target="_blank" rel="noopener">${esc(s.website.replace(/^https?:\/\//,"").replace(/\/$/,""))}</a>` : "";
  const ig = s.instagram ? `<a href="${esc(s.instagram)}" target="_blank" rel="noopener">${esc(s.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//,"@").replace(/\/$/,""))}</a>` : "";
  const map = (s.lat && s.lng) ? `<div class="sd-map"><iframe title="Map of ${esc(s.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${s.lat},${s.lng}&z=16&hl=en&output=embed"></iframe></div>` : "";
  const reviews = (s.reviews||[]).map(r => `<div class="rv"><p>${esc(r.text)}</p><div class="who">${esc(r.name)}${r.date?", "+esc(r.date):""}</div></div>`).join("");
  foot(d, "");
  d.querySelector(".xd-body").innerHTML = `<div class="sd-page"><div class="sd-main">
    <div class="sd-hero">${s.img ? `<img src="${esc(s.img)}" alt="${esc(s.name)}">` : ""}</div>
    ${s.credit ? `<div class="credit-line">Photo: <a href="${esc(s.credit.page)}" target="_blank" rel="noopener">${esc(s.credit.author)}</a>, ${s.credit.license_url ? `<a href="${esc(s.credit.license_url)}" target="_blank" rel="noopener">${esc(s.credit.license)}</a>` : esc(s.credit.license)}</div>` : ""}
    <div class="sd-in">
      <div class="sd-meta"><span>${esc(s.area||"")}</span>${g ? `<span>${esc(g.label)}</span>` : ""}</div>
      <h3>${esc(s.name)}</h3>
      ${s.name_ja ? `<div class="sd-ja" lang="ja">${esc(s.name_ja)}</div>` : ""}
      <p class="sd-about">${esc(s.about || s.desc || "")}</p>
      <ul class="sd-facts">
        ${row("Address", s.address ? esc(s.address) + map + `<a href="${esc(mapsSearch(s))}" target="_blank" rel="noopener">View on Google Maps</a>` : "")}
        ${row("Phone", s.phone ? `<a href="tel:${esc(s.phone.replace(/[^0-9+]/g,""))}">${esc(s.phone)}</a>` : "")}
        ${row("Hours", esc(s.hours))}
        ${row("Closed", esc(s.closed))}
        ${row("Price", esc(s.price))}
        ${row("Access", access)}
        ${row("Parking", parking)}
        ${row("Website", web)}
        ${row("Instagram", ig)}
      </ul>
      <p class="sd-note">Information checked ${esc(DATA.checked || "")}. Hours and prices change, so please check the official website before you go.</p>
      <section class="sd-reviews" aria-labelledby="rvh">
        <h4 id="rvh">Reviews</h4>
        ${reviews || `<p class="rv-empty">No reviews yet. Been here? Share your memories.</p>`}
        <button type="button" class="btn small ghost" data-act="rv">Write a review</button>
        <form class="rv-form" hidden>
          <div><label for="rvName">Your name</label><input id="rvName" maxlength="40" autocomplete="nickname"></div>
          <div><label for="rvText">Your review</label><textarea id="rvText" maxlength="1200" required></textarea></div>
          <small>This opens an email draft to ${esc(CONTACT)} in your mail app. No mail app? Copy your review and send it to that address. We read every one and add some to this page.</small>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button type="submit" class="btn small">Open email draft</button><button type="button" class="btn small ghost" data-act="rvcopy">Copy review</button></div>
        </form>
      </section>
    </div></div>
    <aside class="sd-side" aria-label="Plan and favorites"><div class="sd-card">
      <button type="button" class="btn" data-act="plan">Add to trip plan</button>
      <button type="button" class="btn ghost btn-fav" data-act="fav">${ico("heart")}<span>Favorite</span></button>
    </div></aside></div>`;
  const pb = d.querySelector('[data-act="plan"]'), fb = d.querySelector('[data-act="fav"]');
  const paint = () => { fb.setAttribute("aria-pressed", favs.includes(id)); fb.querySelector("span").textContent = favs.includes(id) ? "Saved to favorites" : "Favorite"; };
  // adding a spot starts the questions; the spot stays in the plan as the first pick
  pb.addEventListener("click", () => { if(!plan.includes(id)){ plan = [id].concat(plan); savePlan(); } firstPick = id; openWizard(); });
  fb.addEventListener("click", () => { toggleFav(id); paint(); refreshOpenViews(); });
  paint();
  const form = d.querySelector(".rv-form");
  d.querySelector('[data-act="rv"]').addEventListener("click", e => { form.hidden = false; e.currentTarget.hidden = true; $("#rvText").focus(); });
  d.querySelector('[data-act="rvcopy"]').addEventListener("click", () => {
    const txt = `To: ${CONTACT}\nSubject: Review: ${s.name}\n\nName: ${$("#rvName").value}\n\n${$("#rvText").value}`;
    if(navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast("Review copied"), () => prompt("Copy your review", txt)); else prompt("Copy your review", txt);
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const body = `Spot: ${s.name}\nName: ${$("#rvName").value}\n\n${$("#rvText").value}`;
    location.href = `mailto:${CONTACT}?subject=${encodeURIComponent("Review: " + s.name)}&body=${encodeURIComponent(body)}`;
  });
  show(d);
}
let firstPick = null;

/* ---------- floating buttons + drawer ---------- */
const fab = document.createElement("div"); fab.className = "fab";
fab.innerHTML = `<button type="button" id="fabFav" aria-label="Favorites">${ico("heart")}<span class="cnt" id="cntFav">0</span></button><button type="button" class="main" id="fabPlan">${ico("list")}<span>Trip plan</span><span class="cnt" id="cntPlan">0</span></button>`;
document.body.appendChild(fab);
const drawer = document.createElement("dialog"); drawer.className = "drawer"; drawer.setAttribute("aria-labelledby","drawerT");
drawer.innerHTML = `<div class="xd-top"><h2 id="drawerT">Your Tokyo trip</h2><button type="button" class="xd-x" aria-label="Close">${ico("x")}</button></div>
  <div class="drawer-tabs" role="tablist"><button type="button" role="tab" data-t="plan">Trip plan</button><button type="button" role="tab" data-t="fav">Favorites</button></div>
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
    body.innerHTML = plan.length ? plan.map(id => miniRow(id, `<button type="button" class="icon-btn" data-rm="${esc(id)}" aria-label="Remove ${esc(S[id].name)}">${ico("x")}</button>`)).join("")
      : `<p class="empty">No spots yet. Tap a spot in the ranking and choose "Add to trip plan", or let us suggest some.</p>`;
    f.innerHTML = `<button type="button" class="btn" id="dBuild" ${plan.length?"":"disabled"}>Review and build my plan</button><button type="button" class="btn ghost" id="dWizard">Get recommendations</button>`;
    $("#dBuild").addEventListener("click", () => { closeDrawer(); openConfirm(); });
  } else {
    body.innerHTML = favs.length ? favs.map(id => miniRow(id, `<button type="button" class="icon-btn ${plan.includes(id)?"on":""}" data-add="${esc(id)}" aria-pressed="${plan.includes(id)}" aria-label="Add ${esc(S[id].name)} to trip plan">${ico(plan.includes(id)?"check":"plus")}</button><button type="button" class="icon-btn" data-unfav="${esc(id)}" aria-label="Remove ${esc(S[id].name)} from favorites">${ico("x")}</button>`)).join("")
      : `<p class="empty">No favorites yet. Open a spot and tap "Favorite" to keep it here.</p>`;
    f.innerHTML = `<button type="button" class="btn ghost" id="dWizard">Get recommendations</button>`;
  }
  $("#dWizard").addEventListener("click", () => { closeDrawer(); openWizard(); });
  body.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openSpot(b.dataset.open)));
  body.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => { plan = plan.filter(x=>x!==b.dataset.rm); savePlan(); }));
  body.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => togglePlan(b.dataset.add)));
  body.querySelectorAll("[data-unfav]").forEach(b => b.addEventListener("click", () => { favs = favs.filter(x=>x!==b.dataset.unfav); saveFavs(); }));
}

/* ---------- wizard ---------- */
const KEYWORDS = [["solo","Solo trip"],["friends","With friends"],["family","With family"],["relax","Rest and recharge"],["learn","Learn something new"],["seasonal","Seasonal sights"],["unique","Something out of the ordinary"],["nature","Nature"],["history","History and culture"],["art","Art"],["onsen","Hot springs"],["beauty","Beauty"],["active","Exercise"],["hiking","Hiking"],["food","Food and cooking"],["shopping","Shopping"],["music","Music"],["photo","Photography"],["drive","Driving"],["reading","Reading"]];
let W = Object.assign({year:"", gender:"", kw:[], when:"", date:"", nights:0, mode:""}, store.get("mt_wz", {}));
if(W.mode === "walk") W.mode = "train";   // walking and trains are now one choice
let wStep = 0;
const STEPS = ["about","kw","when","mode"];
const RESULTS_STEP = STEPS.length + 1;
function stepTitle(n){ return `Step ${n} / ${RESULTS_STEP}`; }
function openWizard(){ wLastStep = -1; push(() => { wStep = 0; renderWizard(); }); }
function wNext(){ store.set("mt_wz", W); if(wStep < STEPS.length-1){ const k = wStep+1; push(() => { wStep = k; renderWizard(); }); } else push(renderResults); }
function renderWizard(){
  const d = dialog("wizard", stepTitle(wStep+1)), body = d.querySelector(".xd-body"), step = STEPS[wStep];
  const prog = `<div class="wz-prog"><i style="width:${(wStep+1)/RESULTS_STEP*100}%"></i></div>`;
  let h = "", ok = true;
  if(W.date && new Date(W.date+"T00:00") < new Date(new Date().toDateString())){ W.date = ""; if(W.when === "date") W.when = ""; }
  if(step === "about"){
    const y = new Date().getFullYear(); let opts = `<option value="">Choose a year</option><option value="skip" ${W.year==="skip"?"selected":""}>Prefer not to say</option>`;
    for(let i=y-10;i>=y-100;i--) opts += `<option ${String(i)===String(W.year)?"selected":""}>${i}</option>`;
    h = `<h3>Tell us about you</h3><p class="sub">We use this only to tune the suggestions on this page. Nothing is sent or saved on a server.</p>
      <div class="wz-field"><label for="wzYear">What year were you born?</label><select id="wzYear">${opts}</select></div>
      <div class="wz-field"><span class="lbl" id="gL">Gender (optional)</span><div class="chips" role="group" aria-labelledby="gL">${[["female","Female"],["male","Male"],["none","Prefer not to say"]].map(([k,l])=>`<button type="button" class="chip" aria-pressed="${W.gender===k}" data-g="${k}">${l}</button>`).join("")}</div></div>`;
    ok = !!W.year;
  } else if(step === "kw"){
    h = `<h3>What kind of trip is it?</h3><p class="sub">Choose 1 to 3. <span id="kwN">${W.kw.length}</span> of 3 chosen.</p><div class="chips">${KEYWORDS.map(([k,l])=>`<button type="button" class="chip" aria-pressed="${W.kw.includes(k)}" data-k="${k}" ${!W.kw.includes(k)&&W.kw.length>=3?"disabled":""}>${l}</button>`).join("")}</div>`;
    ok = W.kw.length > 0;
  } else if(step === "when"){
    h = `<h3>When does your trip start?</h3><div class="wz-field"><div class="chips" role="group" aria-label="Travel date">${[["date","Pick a date"],["tbd","Not decided yet"]].map(([k,l])=>`<button type="button" class="chip" aria-pressed="${W.when===k}" data-w="${k}">${l}</button>`).join("")}</div><div id="wzCal"></div></div>
      <div class="wz-field"><span class="lbl" id="nl">How long?</span><div class="chips" role="group" aria-labelledby="nl">${[[0,"Day trip"],[1,"1 night"],[2,"2 nights"]].map(([k,l])=>`<button type="button" class="chip" aria-pressed="${W.nights===k}" data-n="${k}">${l}</button>`).join("")}</div></div>`;
    ok = W.when === "tbd" || (W.when === "date" && !!W.date);
  } else if(step === "mode"){
    h = `<h3>How will you get around?</h3><div class="chips big" role="group" aria-label="Getting around">${[["train","On foot and by train"],["car","By car"]].map(([k,l])=>`<button type="button" class="chip" aria-pressed="${W.mode===k}" data-m="${k}">${l}</button>`).join("")}</div>`;
    ok = !!W.mode;
  }
  body.innerHTML = prog + `<div class="wz">${h}</div>`;
  const h3 = body.querySelector("h3"); h3.tabIndex = -1;
  foot(d, `<button type="button" class="btn" id="wzNext" ${ok?"":"disabled"}>${wStep===STEPS.length-1?"Show my picks":"Next"}</button>`);
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
let calMonth = null;
function renderWcal(){
  const box = $("#wzCal"); if(!box) return;
  const today = new Date(); today.setHours(0,0,0,0);
  if(!calMonth){ const b = W.date ? new Date(W.date+"T00:00") : today; calMonth = new Date(b.getFullYear(), b.getMonth(), 1); }
  const y = calMonth.getFullYear(), m = calMonth.getMonth(), first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
  const iso = dt => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  let cells = ["Su","Mo","Tu","We","Th","Fr","Sa"].map(x=>`<span class="dw" aria-hidden="true">${x}</span>`).join("");
  for(let i=0;i<first;i++) cells += "<span></span>";
  for(let dd=1; dd<=days; dd++){
    const dt = new Date(y,m,dd), v = iso(dt), past = dt < today;
    cells += `<button type="button" data-d="${v}" ${past?"disabled":""} aria-pressed="${W.date===v}" aria-label="${dt.toDateString()}">${dd}</button>`;
  }
  const canPrev = new Date(y,m,1) > new Date(today.getFullYear(), today.getMonth(), 1);
  box.innerHTML = `<div class="wcal"><div class="wcal-head"><button type="button" class="icon-btn" id="cPrev" aria-label="Previous month" ${canPrev?"":"disabled"}>${ico("left")}</button><span aria-live="polite">${calMonth.toLocaleString("en",{month:"long", year:"numeric"})}</span><button type="button" class="icon-btn" id="cNext" aria-label="Next month">${ico("right")}</button></div><div class="wcal-grid">${cells}</div></div>`;
  $("#cPrev").addEventListener("click", () => { calMonth = new Date(y, m-1, 1); renderWcal(); $("#cPrev").focus(); });
  $("#cNext").addEventListener("click", () => { calMonth = new Date(y, m+1, 1); renderWcal(); $("#cNext").focus(); });
  box.querySelectorAll("[data-d]").forEach(b => b.addEventListener("click", () => { W.date = b.dataset.d; refocus(`#wzCal [data-d="${W.date}"]`); renderWizard(); }));
}

/* recommendation score: keyword match first, then the ranking position, then small nudges */
function score(id){
  const s = S[id], tags = s.tags || []; let sc = 0;
  W.kw.forEach(k => { if(tags.includes(k)) sc += 3; });
  DATA.genres.forEach(g => { if(g.key==="all") return; const i = g.ids.indexOf(id); if(i>=0) sc += (10-i)/10; });
  if(DATA.genres[0] && DATA.genres[0].ids.includes(id)) sc += .5;
  const age = W.year && W.year !== "skip" ? new Date().getFullYear() - (+W.year) : null;
  if(age !== null && age < 30 && (tags.includes("photo") || tags.includes("unique"))) sc += .4;
  if(age !== null && age >= 60 && (tags.includes("relax") || tags.includes("history"))) sc += .4;
  if(W.mode === "car" && s.parking && !/^no\b/i.test(s.parking)) sc += .5;
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
const PER = {sight:3, L:1, D:1};          // suggested per day
let shown = {};                           // how many cards each section shows
const SECS = [
  {key:"sight", title:"Sightseeing and experiences", icon:"history", filter: id => bucket(id)==="sight", slot:""},
  {key:"L", title:"For lunch", icon:"food", filter: id => ["lunch","both","cafe"].includes(bucket(id)), slot:"L"},
  {key:"D", title:"For dinner", icon:"food", filter: id => ["dinner","both"].includes(bucket(id)), slot:"D"},
  {key:"stay", title:"Where to stay", icon:"stay", filter: id => bucket(id)==="stay", slot:""}
];
function countIn(key){ return plan.filter(id => key === "stay" ? isStay(id) : key === "sight" ? bucket(id)==="sight" : mealOf(id) === key).length; }
function needs(){
  const n = tripDays(), out = [];
  if(W.nights > 0) out.push({req:true, label:"Stay", left: countIn("stay") ? 0 : 1});
  out.push({req:false, label:"Sightseeing", left: Math.max(0, PER.sight*n - countIn("sight"))});
  out.push({req:false, label:"Lunch", left: Math.max(0, PER.L*n - countIn("L"))});
  out.push({req:false, label:"Dinner", left: Math.max(0, PER.D*n - countIn("D"))});
  return out;
}
function distFromFirst(id){
  const f = plan.find(x => x !== id); if(!f) return "";
  const k = km(pt(f), pt(id)); return k < 1 ? `${Math.round(k*100)*10} m` : `${k < 10 ? k.toFixed(1) : Math.round(k)} km`;
}
function renderResults(){
  const d = dialog("results", stepTitle(RESULTS_STEP)), body = d.querySelector(".xd-body");
  foot(d, "");
  const secs = SECS.filter(x => x.key !== "stay" || W.nights > 0);
  body.innerHTML = `<div class="res-page">
    <div class="res-main">
      <div class="res-head"><h3 tabindex="-1">Recommended for you</h3><p class="sub">Tap <span class="plus-dot" aria-hidden="true">${ico("plus")}</span> to add a spot to your plan. Tap a photo for details.</p>
      ${plan.length ? `<p class="res-note">Distances are from the first spot in your plan.</p>` : ""}</div>
      ${secs.map(x => `<section class="res-sec" data-sec="${x.key}"><h4>${ico(x.icon)}${x.title}</h4><div class="res-row" role="list"></div><button type="button" class="btn small ghost res-more" data-more="${x.key}">Show more</button></section>`).join("")}
    </div>
    <aside class="res-side" aria-labelledby="rpT"><div class="plan-card" id="planCard"></div></aside>
  </div>`;
  secs.forEach(x => paintRow(x));
  body.querySelectorAll("[data-more]").forEach(b => b.addEventListener("click", () => { const x = SECS.find(y => y.key === b.dataset.more); shown[x.key] = (shown[x.key] || 6) + 6; paintRow(x, true); }));
  paintPlanCard();
  show(d); body.querySelector("h3").focus();
}
function paintRow(x, keepFocus){
  const sec = page.querySelector(`[data-sec="${x.key}"]`); if(!sec) return;
  const all = top(id => x.filter(id) && !plan.includes(id), 99), n = shown[x.key] || 6, list = all.slice(0, n);
  const row = sec.querySelector(".res-row");
  row.innerHTML = list.length ? list.map(id => `<div class="res-card" role="listitem" data-card="${esc(id)}">
      <button type="button" class="pic" data-open="${esc(id)}" aria-label="${esc(S[id].name)}: details">${img(S[id]).replace(' loading="lazy"','')}<span class="cap"><b>${esc(S[id].name)}</b>${distFromFirst(id) ? `<small>${distFromFirst(id)}</small>` : ""}</span></button>
      <button type="button" class="add" data-add="${esc(id)}" data-slot="${x.slot}" aria-label="Add ${esc(S[id].name)} to your plan">${ico("plus")}</button>
    </div>`).join("") : `<p class="empty">You have added everything here.</p>`;
  sec.querySelector(".res-more").hidden = all.length <= n;
  row.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openSpot(b.dataset.open)));
  row.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => addFromCard(b)));
  if(keepFocus){ const c = row.children[Math.max(0, n-6)]; const f = c && c.querySelector(".pic"); f && f.focus(); }
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
    toast(`${S[id].name} added to your plan`);
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
  box.innerHTML = `<button type="button" class="pc-expand" id="pcToggle" aria-expanded="false" aria-controls="pcList" aria-label="Show the spots in your plan">${ico("list")}</button>
    <div class="pc-stack" id="planStack" aria-hidden="true">${pics.length ? pics.map((id,i) => `<img src="${esc(S[id].img)}" alt="" class="s${i}">`).join("") : `<span class="pc-empty"></span>`}</div>
    <h3 id="rpT">Your Tokyo trip plan</h3>
    <p class="pc-sum">${n===1?"Day trip":`${W.nights} night${W.nights>1?"s":""}, ${n} days`}, ${plan.length} spot${plan.length===1?"":"s"}</p>
    <ul class="pc-needs">${list.map(x => `<li><span class="tag ${x.req?"req":""}">${x.req?"Required":"Suggested"}</span>${x.label} ${x.left ? `<b>${x.left} more</b>` : `<b class="ok">${ico("check")}done</b>`}</li>`).join("")}</ul>
    <div class="pc-list" id="pcList" hidden>${plan.length ? plan.map(id => miniRow(id, `<button type="button" class="icon-btn" data-rp="${esc(id)}" aria-label="Remove ${esc(S[id].name)} from your plan">${ico("x")}</button>`)).join("") : `<p class="empty">Nothing added yet.</p>`}</div>
    <button type="button" class="btn pc-go" id="planGo" ${plan.length?"":"disabled"}>Go to final check</button>`;
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
let T = Object.assign({start:"tokyo", end:"tokyo", time:"auto", days:null}, store.get("mt_trip", {}));
T.shared = false;
const saveT = () => { const {shared, ...rest} = T; if(!shared) store.set("mt_trip", rest); };
function nightsNow(){ return W.nights || 0; }
function openConfirm(){ push(() => renderConfirm()); }
function renderConfirm(focusSel){
  const d = dialog("confirm", "Check your plan"), body = d.querySelector(".xd-body");
  const n = nightsNow(), sights = plan.filter(id => !isStay(id)), stays = plan.filter(isStay);
  const opt = sel => Object.entries(PLACES).map(([k,[l]]) => `<option value="${k}" ${k===sel?"selected":""}>${l}</option>`).join("") + (stays.length && n > 0 ? `<option value="hotel" ${sel==="hotel"?"selected":""}>Your hotel in this plan</option>` : "");
  let times = `<option value="auto" ${T.time==="auto"?"selected":""}>Leave it to us (9:00)</option>`;
  for(let h=6; h<=14; h++) for(const mm of ["00","30"]){ const v = `${h}:${mm}`; times += `<option value="${v}" ${T.time===v?"selected":""}>${v}</option>`; }
  body.innerHTML = `<div class="wz">
    <h3 tabindex="-1">${n===0?"Day trip":n===1?"1 night, 2 days":"2 nights, 3 days"}, ${sights.length} spot${sights.length===1?"":"s"}</h3>
    <p class="sub">Check the spots, then set where you start and finish. We put them in an easy order.</p>
    <div class="wz-field"><span class="lbl" id="lenL">Trip length</span><div class="chips" role="group" aria-labelledby="lenL">${[[0,"Day trip"],[1,"1 night"],[2,"2 nights"]].map(([k,l])=>`<button type="button" class="chip" aria-pressed="${n===k}" data-n="${k}">${l}</button>`).join("")}</div></div>
    ${n===0 && stays.length ? `<p class="sd-note">Hotels are left out of a day trip. Choose 1 or 2 nights to include them.</p>` : n > 0 && !stays.length ? `<p class="it-warn">Add a hotel to finish a ${n}-night plan. One hotel can cover every night.</p>` : stays.length > n ? `<p class="sd-note">One hotel per night: only the first ${n} hotel${n>1?"s":""} in your list will be used.</p>` : n > 1 && stays.length < n ? `<p class="sd-note">You stay at ${esc(S[stays[stays.length-1]].name)} for the remaining night${n-stays.length>1?"s":""}.</p>` : ""}
    <div id="cfList">${plan.map(id => miniRow(id, `<button type="button" class="icon-btn" data-rm="${esc(id)}" aria-label="Remove ${esc(S[id].name)}">${ico("x")}</button>`)).join("") || '<p class="empty">Your plan is empty.</p>'}</div>
    <div class="wz-field" style="margin-top:18px"><label for="cfTime">Start time</label><select id="cfTime">${times}</select></div>
    <div class="wz-field"><label for="cfStart">Starting point</label><select id="cfStart">${opt(T.start)}</select></div>
    <div class="wz-field"><label for="cfEnd">Finishing point</label><select id="cfEnd">${opt(T.end)}</select></div>
    <div class="wz-field"><span class="lbl" id="mdL">Getting around</span><div class="chips" role="group" aria-labelledby="mdL">${[["train","On foot and by train"],["car","By car"]].map(([k,l])=>`<button type="button" class="chip" aria-pressed="${(W.mode||"train")===k}" data-m="${k}">${l}</button>`).join("")}</div></div>
  </div>`;
  foot(d, `<button type="button" class="btn ghost" id="cfAdd">Add more spots</button><button type="button" class="btn" id="cfGo" ${sights.length && !(n > 0 && !stays.length) ? "" : "disabled"}>Create plan with these spots</button>`);
  const keep = () => { T.time = $("#cfTime").value; T.start = $("#cfStart").value; T.end = $("#cfEnd").value; saveT(); };
  ["#cfTime","#cfStart","#cfEnd"].forEach(s => $(s).addEventListener("change", keep));
  body.querySelectorAll("[data-rm]").forEach((b, i) => b.addEventListener("click", () => { plan = plan.filter(x=>x!==b.dataset.rm); savePlan(); const nx = plan[i] || plan[i-1]; renderConfirm(nx ? `[data-rm="${nx}"]` : "#cfAdd"); }));
  body.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openSpot(b.dataset.open)));
  body.querySelectorAll("[data-n]").forEach(b => b.addEventListener("click", () => { W.nights = +b.dataset.n; store.set("mt_wz", W); if(W.nights===0 && (T.start==="hotel"||T.end==="hotel")){ T.start = T.start==="hotel"?"tokyo":T.start; T.end = T.end==="hotel"?"tokyo":T.end; saveT(); } renderConfirm(`[data-n="${W.nights}"]`); }));
  body.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { W.mode = b.dataset.m; store.set("mt_wz", W); renderConfirm(`[data-m="${W.mode}"]`); }));
  $("#cfAdd").addEventListener("click", () => { if(!W.year || !W.kw.length) openWizard(); else push(renderResults); });
  $("#cfGo").addEventListener("click", () => {
    keep(); T.mode = W.mode || "train"; T.date = W.when === "date" ? W.date : ""; T.shared = false;
    T.days = arrange(plan, nightsNow()); saveT(); push(() => renderItinerary());
  });
  show(d);
  const f = focusSel && body.querySelector(focusSel) || (focusSel && $(focusSel)); (f || body.querySelector("h3")).focus();
}
const R = d => d*Math.PI/180;
function km(a, b){ const dLat = R(b[1]-a[1]), dLng = R(b[2]-a[2]); const h = Math.sin(dLat/2)**2 + Math.cos(R(a[1]))*Math.cos(R(b[1]))*Math.sin(dLng/2)**2; return 12742*Math.asin(Math.sqrt(h)); }
function pt(id){ const s = S[id]; return [s.name, s.lat, s.lng]; }
function place(key, days){ if(key === "hotel"){ const h = (days||[]).flat().find(isStay); if(h) return pt(h); key = "tokyo"; } return PLACES[key] || PLACES.tokyo; }
const MODE_WORD = {walk:"on foot", train:"by train", car:"by car"};
function travel(a, b, mode){
  const k = km(a, b); let m, by = MODE_WORD[mode] || "by train";
  if(mode === "walk") m = k*1.3/4.5*60;
  else if(mode === "car") m = 8 + k*1.4/22*60;
  else if(k < 1){ m = k*1.3/4.5*60; by = "on foot"; }
  else m = 12 + k*1.3/28*60;
  return {min: Math.max(5, Math.round(m/5)*5), km: k, by};
}
function nearestOrder(list, from){
  const out = [], rest = list.slice(); let at = from;
  while(rest.length){ let bi = 0, bd = Infinity; rest.forEach((id,i)=>{ const dd = km(at, pt(id)); if(dd < bd){ bd = dd; bi = i; } }); at = pt(rest[bi]); out.push(rest.splice(bi,1)[0]); }
  return out;
}
/* split spots into days and order them: sights by distance, lunch near midday, dinner in the evening, hotel at night */
function arrange(list, nights){
  const nd = nights + 1, picked = list.filter(isStay).slice(0, nights), stays = picked.length ? Array.from({length: nights}, (_, i) => picked[Math.min(i, picked.length-1)]) : [], eat = list.filter(id => mealOf(id));
  const sights = list.filter(id => !isStay(id) && !mealOf(id));
  const start = place(T.start === "hotel" ? "tokyo" : T.start), ordered = nearestOrder(sights, start);
  // cut the route into days at its longest hops, so spots close to each other stay on the same day
  const cuts = ordered.slice(1).map((id, i) => ({i: i+1, d: km(pt(ordered[i]), pt(id))}))
    .sort((a,b) => b.d - a.d).slice(0, nd-1).map(c => c.i).sort((a,b) => a-b);
  const days = []; let from = 0;
  cuts.concat(ordered.length).forEach(c => { days.push(ordered.slice(from, c)); from = c; });
  while(days.length < nd) days.push([]);
  // each meal goes to the nearest day that has no meal of that kind yet
  const assign = slot => eat.filter(id => mealOf(id) === slot).forEach(id => {
    let best = 0, bd = Infinity;
    days.forEach((dy, i) => { const taken = dy.filter(x => mealOf(x) === slot).length;
      const dd = (dy.length ? Math.min(...dy.map(x => km(pt(x), pt(id)))) : km(start, pt(id))) + taken*100; if(dd < bd){ bd = dd; best = i; } });
    const dy = days[best];
    if(slot === "L"){ const sightsIn = dy.filter(x => !mealOf(x)).length; dy.splice(Math.min(Math.ceil(sightsIn/2), dy.length), 0, id); } else dy.push(id);
  });
  assign("L"); assign("D");
  stays.forEach((id, i) => days[Math.min(i, nd-2)].push(id));
  return days;
}
function mins(t){ const [h,m] = t.split(":").map(Number); return h*60+m; }
const hhmm = m => m >= 1440 ? `${Math.floor(m/60)-24}:${String(m%60).padStart(2,"0")} (next day)` : `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;
const DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function dayDate(di){ if(!T.date) return null; const d = new Date(T.date+"T00:00"); d.setDate(d.getDate()+di); return d; }
function closesAt(id){ const m = String(S[id].hours||"").match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/); if(!m) return null; let c = (+m[3])*60 + (+m[4]); if(c <= (+m[1])*60 + (+m[2])) c += 1440; return c; }
function maybeClosed(id, date){ if(!date) return false; const c = (S[id].closed || ""); const w = DOW[date.getDay()]; return new RegExp("\\b" + w + "s?\\b", "i").test(c) || new RegExp("\\b" + w.slice(0,3) + "\\b").test(c); }
function timeline(days){
  const mode = T.mode || "train";
  return days.map((dy, di) => {
    const prevStay = di > 0 ? days[di-1].find(isStay) : null;
    const origin = prevStay ? pt(prevStay) : place(T.start, days);
    let at = origin, t = mins(T.time === "auto" ? "9:00" : T.time); if(di > 0) t = Math.max(t, 9*60);
    const stops = [];
    dy.forEach(id => {
      const mv = travel(at, pt(id), mode); t += mv.min;
      const meal = mealOf(id);
      if(meal === "L" && bucket(id) !== "cafe" && t < 11*60+30) t = 11*60+30;
      if(meal === "D" && t < 17*60+30) t = 17*60+30;
      stops.push({id, arrive:t, move:mv, meal});
      t += isStay(id) ? 0 : (S[id].duration_min || (meal ? 60 : 90)); at = pt(id);
    });
    const end = di === days.length-1 ? place(T.end, days) : null;
    const endMove = end && km(at, end) > 0.05 ? travel(at, end, mode) : null;
    return {stops, origin, end, endMove, endAt: endMove ? t + endMove.min : null, date: dayDate(di)};
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
  const d = dialog("itinerary", "Your Tokyo trip plan"), body = d.querySelector(".xd-body");
  const keepTop = focusSel ? body.scrollTop : 0;
  const days = T.days || [], tls = timeline(days), all = days.flat(), withImg = all.filter(id=>S[id].img);
  let n = 0;
  body.innerHTML = `<div class="it">
    ${T.shared ? `<p class="sd-note">This is a shared plan. Use "Copy to my plan" to change it.</p>` : ""}
    ${withImg.length ? `<div class="show" id="slides" aria-roledescription="slideshow" aria-label="Photos of your spots">${withImg.map((id,i)=>`<figure class="${i===0?"on":""}" ${i===0?"":'aria-hidden="true"'}><img src="${esc(S[id].img)}" alt=""><figcaption>${esc(S[id].name)}</figcaption></figure>`).join("")}
      <div class="ctl"><button type="button" id="slPrev" aria-label="Previous photo">${ico("left")}</button><button type="button" id="slP"></button><button type="button" id="slNext" aria-label="Next photo">${ico("right")}</button></div></div>` : ""}
    <div class="it-tools"><button type="button" class="btn small ghost" id="itShare">Share this plan</button>${T.shared ? "" : `<button type="button" class="btn small ghost" id="itEdit" aria-pressed="${editing}">${editing ? "Done editing" : "Edit order"}</button>`}</div>
    <div class="it-map" id="itMap" role="img" aria-label="Map of the spots in your plan, numbered in visiting order"></div>
    ${tls.map((tl, di) => {
      const dt = tl.date, link = gmapsDir(tl);
      return `${days.length>1 || dt ? `<h4 class="it-day">${days.length>1?`Day ${di+1}`:""}${dt?`${days.length>1?", ":""}${dt.toLocaleDateString("en-GB",{weekday:"short", day:"numeric", month:"short"})}`:""}</h4>`:""}
      <p class="it-ends">Start: ${esc(tl.origin[0])}, ${hhmm(di===0 ? mins(T.time==="auto"?"9:00":T.time) : Math.max(mins(T.time==="auto"?"9:00":T.time), 540))}</p>
      ${tl.stops.length ? "" : `<p class="empty">Nothing planned for this day yet. Add more spots or choose a shorter trip.</p>`}
      <ol class="it-list">${tl.stops.map((st, si) => { n++; const warn = [];
        const cl = isStay(st.id) ? null : closesAt(st.id);
        if(!isStay(st.id) && st.arrive >= 24*60) warn.push("This runs past midnight. Move it to another day or remove a spot.");
        else if(cl !== null && st.arrive > cl - 30) warn.push(`Likely closed by then (hours: ${esc(S[st.id].hours)}). Move it earlier.`);
        else if(!isStay(st.id) && st.arrive >= 21*60) warn.push("Late in the day. Consider moving this to another day.");
        if(maybeClosed(st.id, dt)) warn.push(`May be closed on ${DOW[dt.getDay()]}s. Check before you go.`);
        return `<li>
        <div class="it-move">${st.move.min} min ${st.move.by}</div>
        <div class="it-stop"><span class="it-time"><span class="it-n">${n}</span>${isStay(st.id)?"Night":hhmm(st.arrive)}</span>${img(S[st.id])}
          <div><div class="t"><button type="button" data-open="${esc(st.id)}">${esc(S[st.id].name)}</button></div><div class="s">${esc(S[st.id].area||"")}${st.meal==="L"?", lunch":st.meal==="D"?", dinner":""}</div>${warn.map(w=>`<div class="it-warn">${w}</div>`).join("")}</div>
          <div class="it-edit" ${editing?"":"hidden"}>
            <button type="button" class="icon-btn" data-mv="${di},${si},-1" data-k="up-${esc(st.id)}" aria-label="Move ${esc(S[st.id].name)} earlier" ${si===0&&di===0?"disabled":""}>${ico("up")}</button>
            <button type="button" class="icon-btn" data-mv="${di},${si},1" data-k="down-${esc(st.id)}" aria-label="Move ${esc(S[st.id].name)} later" ${si===tl.stops.length-1&&di===days.length-1?"disabled":""}>${ico("down")}</button>
            <button type="button" class="icon-btn" data-del="${di},${si}" aria-label="Remove ${esc(S[st.id].name)}">${ico("x")}</button>
          </div>
        </div></li>`; }).join("")}</ol>
      ${tl.end ? `<div class="it-move">${tl.endMove ? tl.endMove.min + " min " + tl.endMove.by : ""}</div><p class="it-ends">Finish: ${esc(tl.end[0])}${tl.endAt?", about "+hhmm(tl.endAt):""}</p>` : ""}
      ${link ? `<p style="margin:10px 0 0"><a href="${esc(link)}" target="_blank" rel="noopener">Open ${days.length>1?"day "+(di+1)+" ":""}route in Google Maps</a></p>` : ""}`;
    }).join("")}
    <p class="sd-note">Times are rough estimates from straight-line distance. Check opening hours and closed days for your date.</p>
  </div>`;
  foot(d, `<button type="button" class="btn ghost" id="itBack">${T.shared ? "Copy to my plan" : "Change spots"}</button><button type="button" class="btn" id="itBook">Book a guide for this plan</button>`);
  $("#itBack").addEventListener("click", () => {
    if(T.shared){
      if(!confirm("Replace your trip plan with this shared plan, so you can edit it?")) return;
      plan = all.slice(); savePlan(); store.set("mt_slots", slots);
      W.nights = Math.max(0, days.length-1); W.mode = T.mode; if(T.date){ W.when = "date"; W.date = T.date; } store.set("mt_wz", W);
      T.shared = false; saveT(); renderItinerary(); toast("Copied. You can edit it now."); return;
    }
    openConfirm();
  });
  $("#itBook").addEventListener("click", () => { closeAll(); const b = document.getElementById("book"); if(b) b.scrollIntoView({behavior: reduced?"auto":"smooth"}); });
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
    const paint = () => { pb.innerHTML = ico(playing ? "pause" : "play"); pb.setAttribute("aria-label", playing ? "Pause slideshow" : "Play slideshow"); };
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
  const url = location.origin + location.pathname + "#trip=" + encodeURIComponent(btoa(JSON.stringify(payload)));
  const copy = () => navigator.clipboard ? navigator.clipboard.writeText(url).then(() => toast("Link copied"), () => prompt("Copy this link", url)) : prompt("Copy this link", url);
  if(navigator.share) navigator.share({title:"My Tokyo trip plan", url}).catch(e => { if(!e || e.name !== "AbortError") copy(); });
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
loadShared();
window.MT = {openSpot, openWizard, openConfirm};
})();
