/**
 * My Tokyo — booking backend (Google Apps Script)
 *
 * 何をするか:
 *  - GET  ?action=availability&from=YYYY-MM-DD&to=YYYY-MM-DD
 *      → あなたのGoogleカレンダーの予定を見て、埋まっている日時を返す（サイトのカレンダーがグレーアウトされる）
 *  - POST {tour, date, time, hours, name, email, guests, phone, notes}
 *      → あなたのGoogleカレンダーに予約イベントを作成し、
 *        お客様と自分に確認メールを送る
 *
 * デプロイ方法は SETUP.md を参照。
 */

const OWNER_EMAIL = Session.getActiveUser().getEmail(); // 自分（通知先）
const CALENDAR = CalendarApp.getDefaultCalendar();      // 予約を入れるカレンダー
const TZ = "Asia/Tokyo";

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === "availability") {
    const from = new Date(p.from + "T00:00:00+09:00");
    const to = new Date(p.to + "T23:59:59+09:00");
    const events = CALENDAR.getEvents(from, to);
    const busy = [];
    events.forEach(function (ev) {
      const date = Utilities.formatDate(ev.getStartTime(), TZ, "yyyy-MM-dd");
      if (ev.isAllDayEvent()) {
        busy.push({ date: date, fullDay: true });
      } else {
        busy.push({ date: date, time: Utilities.formatDate(ev.getStartTime(), TZ, "HH:mm") });
      }
    });
    return json({ busy: busy });
  }
  return json({ ok: true, service: "My Tokyo booking" });
}

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    ["tour", "date", "time", "name", "email", "guests"].forEach(function (k) {
      if (!b[k]) throw new Error("missing field: " + k);
    });
    const hours = Number(b.hours) || 3;
    const start = new Date(b.date + "T" + b.time + ":00+09:00");
    const end = new Date(start.getTime() + hours * 3600 * 1000);
    if (start < new Date()) throw new Error("date is in the past");

    // ダブルブッキングチェック
    if (CALENDAR.getEvents(start, end).length > 0) {
      return json({ ok: false, error: "This slot was just taken. Please pick another time." });
    }

    const title = "🏮 [My Tokyo] " + b.tour + " — " + b.name + " (" + b.guests + " guests)";
    const desc =
      "Tour: " + b.tour + "\n" +
      "Guests: " + b.guests + "\n" +
      "Name: " + b.name + "\n" +
      "Email: " + b.email + "\n" +
      "WhatsApp: " + (b.phone || "-") + "\n" +
      "Notes: " + (b.notes || "-") + "\n\n" +
      "Booked via mikurin39.github.io/my-tokyo";
    CALENDAR.createEvent(title, start, end, { description: desc });

    // お客様へ確認メール
    MailApp.sendEmail({
      to: b.email,
      subject: "🏮 My Tokyo — Booking received: " + b.tour + " (" + b.date + ")",
      body:
        "Hi " + b.name + ",\n\n" +
        "Thank you for booking with My Tokyo!\n\n" +
        "Tour:   " + b.tour + "\n" +
        "Date:   " + b.date + "\n" +
        "Start:  " + b.time + " (Japan time), " + hours + " hours\n" +
        "Guests: " + b.guests + "\n\n" +
        (b.tour.indexOf("Izakaya") >= 0
          ? "Meeting point: Omoide Yokocho, Shinjuku. We'll share the exact meeting spot once your booking is confirmed.\n\n"
          : "I'll email you shortly to plan your custom itinerary and meeting point.\n\n") +
        "Payment: we'll send you a secure credit-card payment link shortly — your reservation is confirmed once payment is completed.\n" +
        "Cancellation: free up to 7 days before the tour, 50% within 7 days, 100% on the tour day or no-show.\n\n" +
        "See you in Tokyo!\nMikuri — My Tokyo\n" +
        OWNER_EMAIL,
    });

    // 自分へ通知
    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: "🔔 New booking: " + b.tour + " " + b.date + " " + b.time + " — " + b.name,
      body: desc,
    });

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
