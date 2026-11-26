/* Tour page: tour.html?t=<key>. Layout follows common tour sites: photo mosaic, key facts,
   overview, itinerary, meeting point, included / not included, information, FAQ, reviews,
   a booking box that stays on the right, and other tours at the bottom. */
(function(){
"use strict";
const CFG = window.CONFIG, D = window.TOUR_DATA, I = window.I18N, t = I.t;
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const key = new URLSearchParams(location.search).get("t");
// only real tour ids; anything else shows the first tour but tells search engines not to index that address
const known = key && Object.prototype.hasOwnProperty.call(D.tours, key);
const tk = known ? key : D.order[0], T = D.tours[tk];
if(!known){ const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex"; document.head.appendChild(m); }
const txt = (tour) => Object.assign({}, tour.i18n.en, tour.i18n[I.lang] || {});
const X = txt(T);
const yen = n => "¥" + Math.round(n).toLocaleString("en-US");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ICON = {
  check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  left:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  right:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  chat:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg>',
  cal:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  people:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2c2.9.2 5.5 2.6 5.5 5.8"/></svg>'
};

// each tour has its own title, description and address for search engines (first sentence of the overview, kept short)
const firstSentence = txt => { const parts = String(txt || "").match(/[^.!?。！？]+(?:[.!?](?=\s|$)|[。！？])?\s*/g) || [""];
  let out = ""; for(const p of parts){ if((out + p).trim().length > 155 && out) break; out += p; }
  out = out.trim(); return out.length > 160 ? out.slice(0, 157) + "…" : out; };
I.head({title: X.name + " | Okaeri Trip", desc: firstSentence(X.overview), path: "tour.html?t=" + tk, image: T.img});
// structured data so search engines can show the price and the tour as a product
(function(){ const site = (CFG.SITE_URL || "").replace(/\/$/, "") + "/";
  if(T.type !== "book") return;   // price on request: nothing to show as a product price
  const url = site + "tour.html?t=" + tk + (I.lang !== "en" ? "&lang=" + I.lang : "");
  const ld = {"@context":"https://schema.org", "@type":"Product", name: X.name, description: firstSentence(X.overview), image: site + T.img, brand: {"@type":"Brand", name:"Okaeri Trip"},
    offers: {"@type":"Offer", price: String(T.price), priceCurrency:"JPY", availability:"https://schema.org/InStock", url}};
  const sc = document.createElement("script"); sc.type = "application/ld+json"; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc); })();
$("#langSlot").innerHTML = I.selector();
I.apply();
document.querySelectorAll("[data-keep-lang]").forEach(a => a.setAttribute("href", I.keepLang(a.getAttribute("href"))));

/* ---------- exchange rate (for reference; payment is in yen) ---------- */
let usd = null, rateDate = "";
// the rate service gives an English date ("Tue, 24 Nov 2026"); show it in the page language
const rateDay = () => { const d = new Date(rateDate + " 12:00 UTC"); return isNaN(d) ? rateDate : d.toLocaleDateString(locale, {year:"numeric", month:"long", day:"numeric"}); };
async function loadRate(){
  try{
    const r = await fetch("https://open.er-api.com/v6/latest/JPY"); const j = await r.json();
    if(j && j.result === "success" && j.rates && j.rates.USD){
      usd = j.rates.USD; rateDate = (j.time_last_update_utc || "").replace(/ \d\d:\d\d:\d\d.*$/, "");
      try{ localStorage.setItem("mt_fx", JSON.stringify({usd, date: rateDate, at: Date.now()})); }catch(e){}
    }
  }catch(e){
    try{ const c = JSON.parse(localStorage.getItem("mt_fx") || "null"); if(c){ usd = c.usd; rateDate = c.date; } }catch(e2){}
  }
}
const usdText = n => usd ? "US$" + (n*usd).toLocaleString("en-US", {maximumFractionDigits: 0}) : "";

/* ---------- page ---------- */
const isBook = T.type === "book";
const facts = [
  [ICON.pin, t("tour.area"), X.area],
  [ICON.clock, t("tour.duration"), X.duration],
  [ICON.chat, t("tour.language"), t("tour.languageValue")],
  [ICON.cal, t("tour.booking"), isBook ? t("tour.bookingRequest") : t("tour.bookingQuote")]
];
const g = T.gallery || [T.img];
$("#main").innerHTML = `
<div class="wrap">
  <p class="crumb"><a href="${esc(I.keepLang("./#tours"))}">${t("nav.tours")}</a> <span aria-hidden="true">/</span> ${esc(X.area)}</p>
  <h1>${esc(X.name)}</h1>
  <div class="gallery n${Math.min(g.length,5)}">
    ${g.slice(0,5).map((src,i) => `<button type="button" class="gi gi${i}" data-i="${i}" aria-label="${esc(t("tour.photo", {n: i+1}))}"><img src="${esc(src)}" alt="" ${i?'loading="lazy"':""}></button>`).join("")}
    ${g.length > 1 ? `<button type="button" class="all-photos" data-i="0">${t("tour.allPhotos", {n: g.length})}</button>` : ""}
  </div>
  <ul class="facts">${facts.map(([ic,k,v]) => `<li>${ic}<span><small>${esc(k)}</small><b>${esc(v)}</b></span></li>`).join("")}</ul>
  <div class="cols">
    <div class="main-col">
      <section><h2>${t("tour.overview")}</h2><p>${esc(X.overview)}</p>
        <ul class="hl">${X.highlights.map(h => `<li>${ICON.check}${esc(h)}</li>`).join("")}</ul></section>
      <section><h2>${isBook ? t("tour.itinerary") : t("tour.howItWorks")}</h2>
        <ol class="timeline">${X.itinerary.map(([time, title, text]) => `<li><span class="tl-time">${esc(time)}</span><div><b>${esc(title)}</b><p>${esc(text)}</p></div></li>`).join("")}</ol></section>
      <section><h2>${t("tour.meeting")}</h2><p class="meet">${ICON.pin}<span>${esc(X.meeting)}</span></p></section>
      <section class="inc-sec"><div><h2>${t("tour.included")}</h2><ul class="inc">${X.included.map(i => `<li>${ICON.check}${esc(i)}</li>`).join("")}</ul></div>
        <div><h2>${t("tour.notIncluded")}</h2><ul class="exc">${X.excluded.map(i => `<li>${ICON.x}${esc(i)}</li>`).join("")}</ul></div></section>
      <section><h2>${t("tour.info")}</h2><ul class="info">${X.info.map(i => `<li>${esc(i)}</li>`).join("")}
        ${isBook ? `<li>${t("tour.cancel")}</li>` : ""}</ul></section>
      <section><h2>${t("tour.faq")}</h2><div class="faq">${X.faq.map(([q,a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></section>
      ${isBook ? "" : `<section id="request" class="req-sec"><h2>${t("tour.sendRequest")}</h2><div id="reqBox"></div></section>`}
      <section><h2>${t("tour.reviews")}</h2><p class="muted">${t("tour.noReviews")}</p>
        <a class="btn ghost small" href="mailto:${esc(CFG.CONTACT_EMAIL)}?subject=${encodeURIComponent("Review: " + X.name)}">${t("tour.writeReview")}</a></section>
    </div>
    <aside class="book-col" id="bookBox" aria-label="${esc(t("tour.bookingBox"))}"></aside>
  </div>
</div>
<section class="more-tours"><div class="wrap"><h2>${t("tour.otherTours")}</h2>
  <div class="hcar"><button type="button" class="hcar-btn prev" aria-label="${esc(t("ui.prev"))}" hidden>${ICON.left}</button>
  <div class="hcar-track">${D.order.filter(k => k !== tk).map(k => { const o = D.tours[k], ox = txt(o);
    return `<a class="tcard" href="${esc(I.keepLang("tour.html?t=" + k))}"><span class="tc-img"><img src="${esc(o.img)}" alt="" loading="lazy"></span><span class="tc-body"><span class="tc-name">${esc(t("tour.cardPrefix"))}${esc(ox.name)}</span><span class="tc-price">${o.type === "book" ? esc(t("tour.from", {price: yen(o.price)})) : esc(t("tour.priceOnRequest"))}</span></span></a>`; }).join("")}</div>
  <button type="button" class="hcar-btn next" aria-label="${esc(t("ui.next"))}" hidden>${ICON.right}</button></div>
</div></section>
<div class="mbar" id="mbar"><div><b id="mbarPrice"></b><small id="mbarUsd"></small></div><a href="${isBook ? "#bookBox" : "#request"}" class="btn">${isBook ? t("tour.checkAvailability") : t("tour.sendRequest")}</a></div>`;

/* ---------- lightbox ---------- */
let li = 0;
const lb = document.createElement("dialog"); lb.className = "lightbox"; lb.setAttribute("aria-label", t("tour.photos"));
lb.innerHTML = `<button type="button" class="lb-x" aria-label="${esc(t("ui.close"))}">${ICON.x}</button><button type="button" class="lb-prev" aria-label="${esc(t("ui.prev"))}">${ICON.left}</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="lb-next" aria-label="${esc(t("ui.next"))}">${ICON.right}</button>`;
document.body.appendChild(lb);
const showPhoto = i => { li = (i + g.length) % g.length; lb.querySelector("img").src = g[li]; lb.querySelector("figcaption").textContent = `${li+1} / ${g.length}`; };
document.querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => { showPhoto(+b.dataset.i); lb.showModal(); }));
lb.querySelector(".lb-x").addEventListener("click", () => lb.close());
lb.querySelector(".lb-prev").addEventListener("click", () => showPhoto(li-1));
lb.querySelector(".lb-next").addEventListener("click", () => showPhoto(li+1));
lb.addEventListener("click", e => { if(e.target === lb) lb.close(); });
lb.addEventListener("keydown", e => { if(e.key === "ArrowLeft") showPhoto(li-1); if(e.key === "ArrowRight") showPhoto(li+1); });

/* ---------- other tours row ---------- */
document.querySelectorAll(".hcar").forEach(c => {
  const tr = c.querySelector(".hcar-track"), p = c.querySelector(".prev"), n = c.querySelector(".next");
  const paint = () => { p.hidden = tr.scrollLeft < 8; n.hidden = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 8; };
  p.addEventListener("click", () => tr.scrollBy({left: -tr.clientWidth*.9})); n.addEventListener("click", () => tr.scrollBy({left: tr.clientWidth*.9}));
  tr.addEventListener("scroll", paint, {passive:true}); addEventListener("resize", paint); setTimeout(paint, 200);
});

/* ---------- booking box ---------- */
const tokyoISO = new Date().toLocaleDateString("en-CA", {timeZone: "Asia/Tokyo"});   // today in Japan, YYYY-MM-DD
const today = new Date(tokyoISO + "T00:00");
const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + CFG.MAX_ADVANCE_DAYS);
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const B = {guests: Math.min(2, T.max || 2), date: "", time: T.slots ? (T.slots.length === 1 ? T.slots[0] : "") : "", view: new Date(today.getFullYear(), today.getMonth(), 1), step: 1, busy: {}};
const guestsTxt = n => String(n) === "1" ? t("tour.guest1") : t("tour.guestsN", {n});
const unit = n => (T.small && T.small[n]) || T.price;   // small groups (1-3) pay more per person
const locale = {en:"en-US", ja:"ja-JP", fr:"fr-FR", "zh-Hant":"zh-TW", ko:"ko-KR"}[I.lang] || "en-US";
function priceBlock(){
  if(!isBook) return `<div class="bp"><b>${t("tour.priceOnRequest")}</b></div>`;
  return `<div class="bp"><span class="from">${t("tour.fromLabel")}</span><b>${yen(T.price)}</b><span>${t("tour.perPerson")}</span></div>
    ${usd ? `<p class="usd">≈ ${usdText(T.price)} <small>${t("tour.rateNote", {date: esc(rateDay())})}</small></p>` : ""}`;
}
function cal(){
  const y = B.view.getFullYear(), m = B.view.getMonth(), first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
  const dows = Array.from({length:7}, (_,i) => new Date(2023,0,1+i).toLocaleDateString(locale,{weekday:"narrow"}));
  let cells = dows.map(d => `<span class="dw" aria-hidden="true">${d}</span>`).join("") + "<span></span>".repeat(first);
  for(let d=1; d<=days; d++){
    const dt = new Date(y,m,d), v = iso(dt), off = dt <= today || dt > maxDate || (B.busy[v] && B.busy[v].fullDay);
    cells += `<button type="button" data-d="${v}" ${off?"disabled":""} aria-pressed="${B.date===v}" aria-label="${esc(dt.toLocaleDateString(locale,{weekday:"long", month:"long", day:"numeric"}))}">${d}</button>`;
  }
  const canPrev = new Date(y,m,1) > new Date(today.getFullYear(), today.getMonth(), 1), canNext = new Date(y,m+1,1) <= maxDate;
  return `<div class="bcal"><div class="bcal-head"><button type="button" class="ib" data-m="-1" aria-label="${esc(t("ui.prevMonth"))}" ${canPrev?"":"disabled"}>${ICON.left}</button><b aria-live="polite">${esc(B.view.toLocaleDateString(locale,{month:"long", year:"numeric"}))}</b><button type="button" class="ib" data-m="1" aria-label="${esc(t("ui.nextMonth"))}" ${canNext?"":"disabled"}>${ICON.right}</button></div><div class="bcal-grid">${cells}</div></div>`;
}
function renderBox(focusSel){
  const box = $("#bookBox");
  if(!isBook){
    box.innerHTML = `<div class="bcard">${priceBlock()}<p class="muted">${t("tour.quoteNote")}</p>
      <div class="brow"><span class="bl">${ICON.people}${t("tour.guests")}</span>
        <div class="stepper"><button type="button" class="ib" data-g="-1" aria-label="${esc(t("tour.fewer"))}" ${B.guests<=1?"disabled":""}>−</button><output aria-live="polite">${B.guests}</output><button type="button" class="ib" data-g="1" aria-label="${esc(t("tour.more"))}" ${B.guests>=12?"disabled":""}>+</button></div></div>
      ${tk !== "photo" ? `<div class="bl2">${ICON.cal}${t("tour.preferredDate")}</div>${cal()}` : `<p class="small muted">${t("tour.photoDatesNote")}</p>`}
      <a class="btn wide" href="#request" id="toReq">${t("tour.sendRequest")}</a>
      <p class="small muted">${t("tour.replyIn2")}</p></div>`;
    wire(); paintBar();
    $("#toReq").addEventListener("click", e => { e.preventDefault(); window.MTRequest.prefill(B.guests, tk !== "photo" ? B.date : "");
      $("#request").scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); $("#rName").focus({preventScroll:true}); });
    if(focusSel){ const f = box.querySelector(focusSel); if(f && !f.disabled) f.focus(); } return;
  }
  const total = unit(B.guests) * B.guests;
  const tiers = !T.small ? "" : (() => { const ns = Object.keys(T.small).map(Number).sort((a,b) => a-b), top = ns[ns.length-1] + 1;
    const rows = ns.map(n => [n, String(n), T.small[n]]).concat([[top, top + "–" + T.max, T.price]]);
    return `<div class="tiers"><div class="bl2">${t("tour.tierTitle")}</div><table aria-label="${esc(t("tour.tierTitle"))}">${rows.map(([n, lab, p]) => { const on = n === B.guests || (n === top && B.guests >= top);
      return `<tr${on ? ' class="on"' : ""}><td>${guestsTxt(lab)}</td><td>${yen(p)}</td></tr>`; }).join("")}</table></div>`; })();
  if(B.step === 1){
    box.innerHTML = `<div class="bcard">${priceBlock()}
      <div class="brow"><span class="bl">${ICON.people}${t("tour.guests")}</span>
        <div class="stepper"><button type="button" class="ib" data-g="-1" aria-label="${esc(t("tour.fewer"))}" ${B.guests<=1?"disabled":""}>−</button><output aria-live="polite">${B.guests}</output><button type="button" class="ib" data-g="1" aria-label="${esc(t("tour.more"))}" ${B.guests>=T.max?"disabled":""}>+</button></div></div>
      <p class="small muted">${t("tour.maxGuests", {n: T.max})}</p>
      ${tiers}
      <div class="bl2">${ICON.cal}${t("tour.date")}</div>${cal()}
      <div class="bl2">${ICON.clock}${t("tour.time")} <small class="muted">(${t("tour.jst")})</small></div>
      <div class="slots">${T.slots.map(s => { const busy = B.date && B.busy[B.date] && B.busy[B.date].times.includes(s);
        return `<button type="button" class="slot" data-s="${s}" aria-pressed="${B.time===s}" ${busy||!B.date?"disabled":""}>${s}</button>`; }).join("")}</div>
      ${!B.date ? `<p class="small muted">${t("tour.pickDateFirst")}</p>` : ""}
      <div class="total"><span>${t("tour.total")}</span><b>${yen(total)}</b>${usd ? `<small>≈ ${usdText(total)}</small>` : ""}</div>
      <button type="button" class="btn wide" id="bNext" ${B.date && B.time ? "" : "disabled"}>${t("tour.requestBooking")}</button>
      <p class="small muted">${t("tour.payNote")}</p></div>`;
  } else {
    const d = new Date(B.date + "T00:00");
    box.innerHTML = `<div class="bcard"><button type="button" class="back" id="bBack">${ICON.left}${t("ui.back")}</button>
      <p class="sum"><b>${esc(X.name)}</b><br>${esc(d.toLocaleDateString(locale,{weekday:"short", month:"long", day:"numeric"}))}, ${B.time}<br>${guestsTxt(B.guests)} · ${yen(total)}${usd ? ` (≈ ${usdText(total)})` : ""}</p>
      <form id="bForm">
        <label>${t("form.name")} *<input id="bName" required autocomplete="name"></label>
        <label>${t("form.email")} *<input id="bEmail" type="email" required autocomplete="email"></label>
        <label>${t("form.phone")}<input id="bPhone" type="tel" autocomplete="tel" placeholder="+1 555 000 0000"></label>
        <label>${t("form.notes")}<textarea id="bNotes" rows="3"></textarea></label>
        ${T.minAge ? `<label class="chk"><input type="checkbox" id="bAge" required> ${t("form.ageConfirm", {n: T.minAge})}</label>` : ""}
        <button class="btn wide" type="submit" id="bSend">${t("tour.sendBookingRequest")}</button>
        <div id="bMsg" class="msg" role="status"></div>
        <p class="small muted">${t("tour.payNote")}</p>
      </form></div>`;
  }
  wire(); paintBar();
  if(focusSel){ const f = box.querySelector(focusSel); if(f && !f.disabled) f.focus(); }
}
function wire(){
  const box = $("#bookBox");
  box.querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => { B.guests = Math.max(1, Math.min(T.max || 12, B.guests + +b.dataset.g)); renderBox(`[data-g="${b.dataset.g}"]`); }));
  box.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { B.view = new Date(B.view.getFullYear(), B.view.getMonth() + +b.dataset.m, 1); renderBox(`[data-m="${b.dataset.m}"]`); }));
  box.querySelectorAll("[data-d]").forEach(b => b.addEventListener("click", () => { B.date = b.dataset.d; if(T.slots && T.slots.length > 1) B.time = ""; renderBox(`[data-d="${B.date}"]`); }));
  box.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => { B.time = b.dataset.s; renderBox(`[data-s="${B.time}"]`); }));
  const n = $("#bNext"); if(n) n.addEventListener("click", () => { B.step = 2; renderBox("#bName"); });
  const bk = $("#bBack"); if(bk) bk.addEventListener("click", () => { B.step = 1; renderBox("#bNext"); });
  const f = $("#bForm"); if(f) f.addEventListener("submit", send);
}
async function send(e){
  e.preventDefault();
  const v = id => $("#"+id).value.trim(), msg = $("#bMsg");
  const payload = {tour: X.name + " [" + tk + "]", date: B.date, time: B.time, hours: T.hours, name: v("bName"), email: v("bEmail"), guests: String(B.guests), phone: v("bPhone"), notes: [v("bNotes"), I.lang !== "en" ? "site language: " + I.lang : ""].filter(Boolean).join(" | "), price: yen(unit(B.guests)) + " × " + B.guests + " = " + yen(unit(B.guests) * B.guests)};
  if(CFG.GAS_URL){
    const btn = $("#bSend"); btn.disabled = true;
    try{
      const r = await fetch(CFG.GAS_URL, {method:"POST", body: JSON.stringify(payload)}); const j = await r.json();
      if(!j.ok) throw new Error(j.error || "error");
      msg.className = "msg ok"; msg.textContent = t("tour.sentOk", {email: payload.email});
    }catch(err){ msg.className = "msg err"; msg.textContent = t("tour.sentErr", {email: CFG.CONTACT_EMAIL}); }
    btn.disabled = false;
  } else {
    const body = `Hi! I'd like to book a tour.\n\nTour: ${payload.tour}\nDate: ${payload.date}  Start: ${payload.time} (Japan time)\nGuests: ${payload.guests}\nPrice: ${payload.price}\nName: ${payload.name}\nEmail: ${payload.email}\nWhatsApp: ${payload.phone || "-"}\nNotes: ${payload.notes || "-"}`;
    location.href = `mailto:${CFG.CONTACT_EMAIL}?subject=${encodeURIComponent("[Okaeri Trip] Booking request: " + X.name + " " + payload.date)}&body=${encodeURIComponent(body)}`;
    msg.className = "msg ok"; msg.textContent = t("tour.mailOpened2", {email: CFG.CONTACT_EMAIL});
  }
}
function paintBar(){
  $("#mbarPrice").textContent = isBook ? t("tour.from", {price: yen(T.price)}) : t("tour.priceOnRequest");
  $("#mbarUsd").textContent = isBook && usd ? "≈ " + usdText(T.price) : "";
}
async function loadBusy(){
  if(!CFG.GAS_URL || !isBook) return;
  try{
    const r = await fetch(`${CFG.GAS_URL}?action=availability&from=${iso(today)}&to=${iso(maxDate)}`); const j = await r.json();
    (j.busy || []).forEach(b => { B.busy[b.date] = B.busy[b.date] || {times:[], fullDay:false}; if(b.fullDay) B.busy[b.date].fullDay = true; if(b.time) B.busy[b.date].times.push(b.time); });
    if(B.date && B.busy[B.date] && (B.busy[B.date].fullDay || B.busy[B.date].times.includes(B.time))){ B.date = ""; if(B.step === 2) B.step = 1; }
    if(B.step === 1) renderBox();
  }catch(e){}
}

/* ---------- photo credits ---------- */
const STATIC_CREDITS = {
  "img/goldengai.jpg": ["urbz", "CC BY 2.0"], "img/sensoji.jpg": ["Akonnchiroll", "CC0"], "img/teamlab.jpg": ["Sasa0403", "CC BY-SA 4.0"],
  "img/shibuyax.jpg": ["David Kernan", "CC BY 4.0"], "img/meiji.jpg": ["Akonnchiroll", "CC BY-SA 4.0"], "img/tsukiji.jpg": ["Kakidai", "CC BY-SA 4.0"],
  "img/shibuyasky.jpg": ["Sakura Torch", "CC BY-SA 4.0"], "img/takeshita.jpg": ["Syced", "CC0"]
};
fetch("img/rank/credits.json").then(r => r.json()).then(c => {
  $("#credits").innerHTML = g.map(src => {
    const m = src.match(/^img\/rank\/(.+)\.jpg$/), cc = m && c[m[1]];
    if(cc) return `<a href="${esc(cc.page)}" target="_blank" rel="noopener">${esc(String(cc.author).replace(/^(User:|Photograph by )/,"").split(" (")[0])}</a> (${esc(cc.license)})`;
    const s = STATIC_CREDITS[src]; return s ? `${esc(s[0])} (${esc(s[1])})` : "";
  }).filter(Boolean).join(" · ") + ". Wikimedia Commons. Images resized or cropped.";
}).catch(() => {});

renderBox();
if(!isBook) window.MTRequest.mount($("#reqBox"), tk);
loadRate().then(() => { if(B.step === 1) renderBox(); else paintBar(); });
loadBusy();
})();
