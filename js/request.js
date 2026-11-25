/* Request form for the custom and photo tours (price on request). Shown on tour.html?t=custom / ?t=photo.
   Without GAS_URL in js/config.js it opens a pre-filled email instead. */
(function(){
"use strict";
const CFG = window.CONFIG, I = window.I18N, t = I.t, D = window.TOUR_DATA;
const $ = s => document.querySelector(s);
const nameOf = key => { const o = D.tours[key]; return (o.i18n[I.lang] && o.i18n[I.lang].name) || o.i18n.en.name; };
const iso = d => d.toLocaleDateString("en-CA", {timeZone: "Asia/Tokyo"});
const OPTIONS = {
  rWhat: ["Hire a photographer","Nature","Food","Meet local people","History and culture","Shopping","Nightlife","Anime and pop culture"],
  rShot: ["Portraits","Couple","Family","Friends","Street photos","Tokyo at night","In a kimono","Famous sights"]
};
const guests = Array.from({length: 12}, (_, i) => `<option ${i === 1 ? "selected" : ""}>${i+1}</option>`).join("");
function html(key){
  const photo = key === "photo";
  return `<form id="reqForm" class="req-form" novalidate>
    <p class="req-intro">${photo ? t("req.introPhoto") : t("req.introCustom")}</p>
    <div class="row2">
      <label>${t("h.16")}<input id="rName" required autocomplete="name"></label>
      <label>${t("h.17")}<input id="rEmail" type="email" required autocomplete="email"></label>
    </div>
    <div class="row2">
      <label>${t("h.23")}<input id="rCountry" required autocomplete="country-name"></label>
      <label>${t("h.24")}<input id="rPhone" type="tel" autocomplete="tel" placeholder="+1 555 000 0000"></label>
    </div>
    ${photo ? `<div class="row2">
      <label>${t("h.32")}<input id="rFrom" type="date" required></label>
      <label>${t("h.33")}<input id="rTo" type="date" required></label>
    </div>` : `<div class="row2">
      <label>${t("h.25")}<input id="rDate" type="date"></label>
      <label>${t("h.26")}<select id="rLength"><option value="1 hour">${t("h.27")}</option><option selected value="2 hours">${t("h.28")}</option><option value="3 hours">${t("h.29")}</option><option value="4 hours or longer">${t("h.30")}</option><option value="Not sure yet">${t("h.31")}</option></select></label>
    </div>`}
    <div class="fld"><span class="lbl" id="${photo ? "rShot" : "rWhat"}L">${photo ? t("h.36") : t("h.34")}</span>
      <details class="msel" id="${photo ? "rShot" : "rWhat"}"><summary aria-labelledby="${photo ? "rShot" : "rWhat"}L ${photo ? "rShot" : "rWhat"}V"><span id="${photo ? "rShot" : "rWhat"}V">${t("h.35")}</span></summary>
      <div class="msel-list">${OPTIONS[photo ? "rShot" : "rWhat"].map((o, i) => `<label><input type="checkbox" value="${o}"> ${t("opt." + (photo ? "rShot" : "rWhat") + "." + i)}</label>`).join("")}</div></details></div>
    ${photo ? `<label>${t("h.37")}<input id="rRef" type="url" placeholder="${t("h.90")}"><small class="muted">${t("h.38")}</small></label>` : ""}
    <label>${t("h.39")}<textarea id="rPlaces" rows="2" placeholder="${t("h.87")}"></textarea></label>
    <div class="row2">
      <label>${t("h.40")}<input id="rLang" required placeholder="${t("h.88")}"></label>
      <label>${t("h.41")}<select id="rGuests">${guests}</select></label>
    </div>
    <label>${t("h.42")}<select id="rBudget"><option value="Not sure yet">${t("h.31")}</option><option value="Under ¥10,000">${t("h.43")}</option><option value="¥10,000 to ¥20,000">${t("h.44")}</option><option value="¥20,000 to ¥40,000">${t("h.45")}</option><option value="Over ¥40,000">${t("h.46")}</option></select></label>
    <label>${t("h.47")}<textarea id="rNotes" rows="3" placeholder="${t("h.89")}"></textarea></label>
    <button class="btn wide" type="submit" id="reqBtn">${t("h.48")}</button>
    <div id="reqMsg" class="msg" role="status"></div>
    <p class="small muted">${photo ? t("req.notePhoto") : t("tour.replyIn2")}</p>
  </form>`;
}
function mount(box, key){
  box.innerHTML = html(key);
  const photo = key === "photo", tomorrow = new Date(Date.now() + 86400000);
  if(photo){ $("#rTo").min = iso(new Date()); } else $("#rDate").min = iso(tomorrow);
  const id = photo ? "rShot" : "rWhat", list = $("#" + id + " .msel-list");
  list.addEventListener("change", () => {
    const v = [...list.querySelectorAll("input:checked")].map(x => x.parentNode.textContent.trim());
    $("#" + id + "V").textContent = v.length ? v.join(", ") : t("h.35");
  });
  $("#reqForm").addEventListener("submit", e => send(e, key));
}
/* the booking box on the right hands over its guests and date */
function prefill(g, d){
  if(g && $("#rGuests")) $("#rGuests").value = String(g);
  if(d && $("#rDate")) $("#rDate").value = d;
}
async function send(ev, key){
  ev.preventDefault();
  const form = ev.target, photo = key === "photo", v = id => $("#" + id).value.trim(), msg = $("#reqMsg");
  if(!form.checkValidity()){ form.reportValidity(); return; }
  if(photo && v("rTo") < v("rFrom")){ msg.className = "msg err"; msg.textContent = t("req.errDates"); return; }
  const picked = id => [...document.querySelectorAll("#" + id + " input:checked")].map(x => x.value).join(", ") || "-";
  const lines = [
    `Tour: ${D.tours[key].i18n.en.name}`,
    `Name: ${v("rName")}`, `Email: ${v("rEmail")}`, `Country: ${v("rCountry")}`, `Phone/WhatsApp: ${v("rPhone") || "-"}`,
    photo ? `In Tokyo: ${v("rFrom")} to ${v("rTo")}` : `Preferred date: ${v("rDate") || "-"}  Length: ${v("rLength")}`,
    photo ? `Photos: ${picked("rShot")}` : `Interests: ${picked("rWhat")}`,
    photo ? `Reference images: ${v("rRef") || "-"}` : null,
    `Places: ${v("rPlaces") || "-"}`, `Languages: ${v("rLang")}`, `People: ${v("rGuests")}`, `Budget per person: ${v("rBudget")}`,
    `Notes: ${v("rNotes") || "-"}`, I.lang !== "en" ? `Site language: ${I.lang}` : null
  ].filter(Boolean);
  const btn = $("#reqBtn");
  if(CFG.GAS_URL){
    btn.disabled = true; btn.textContent = t("ui.sending");
    try{
      const res = await fetch(CFG.GAS_URL, {method:"POST", body: JSON.stringify({type:"request", tour: D.tours[key].i18n.en.name, email: v("rEmail"), name: v("rName"), text: lines.join("\n")})});
      const data = await res.json(); if(!data.ok) throw new Error(data.error || "error");
      msg.className = "msg ok"; msg.textContent = t("req.ok", {name: v("rName"), email: v("rEmail")});
    }catch(e){ msg.className = "msg err"; msg.textContent = t("tour.sentErr", {email: CFG.CONTACT_EMAIL}); }
    btn.disabled = false; btn.textContent = t("h.48");
  } else {
    location.href = `mailto:${CFG.CONTACT_EMAIL}?subject=${encodeURIComponent("[Okaeri Trip] " + D.tours[key].i18n.en.name + " request")}&body=${encodeURIComponent("Hi! I'd like to ask about a tour.\n\n" + lines.join("\n"))}`;
    msg.className = "msg ok"; msg.textContent = t("tour.mailOpened2", {email: CFG.CONTACT_EMAIL});
  }
}
window.MTRequest = {mount, prefill, nameOf};
})();
