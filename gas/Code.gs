/**
 * Okaeri Trip — booking backend (Google Apps Script)
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
  return json({ ok: true, service: "Okaeri Trip booking" });
}

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    // Custom / photo tour requests: no calendar event, just pass the request on and confirm to the guest.
    if (b.type === "request") {
      ["tour", "name", "email", "text"].forEach(function (k) { if (!b[k]) throw new Error("missing field: " + k); });
      MailApp.sendEmail({ to: OWNER_EMAIL, replyTo: b.email, subject: "[Okaeri Trip] " + b.tour + " request from " + b.name, body: b.text });
      MailApp.sendEmail({ to: b.email, subject: "Okaeri Trip: we received your " + b.tour + " request",
        body: "Hi " + b.name + ",\n\nThank you for your request. We'll reply within 2 days with a plan and a price.\n" +
              "If you have reference images, just reply to this email and attach them.\n\nHere is what you sent:\n\n" + b.text + "\n\nOkaeri Trip" });
      return json({ ok: true });
    }
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

    const title = "🏮 [Okaeri Trip] " + b.tour + " — " + b.name + " (" + b.guests + " guests)";
    const desc =
      "Tour: " + b.tour + "\n" +
      "Guests: " + b.guests + "\n" +
      "Name: " + b.name + "\n" +
      "Email: " + b.email + "\n" +
      "WhatsApp: " + (b.phone || "-") + "\n" +
      "Notes: " + (b.notes || "-") + "\n\n" +
      "Booked via okaeritrip.com";
    CALENDAR.createEvent(title, start, end, { description: desc });

    // お客様へ確認メール
    MailApp.sendEmail({
      to: b.email,
      subject: "🏮 Okaeri Trip — Booking received: " + b.tour + " (" + b.date + ")",
      body:
        "Hi " + b.name + ",\n\n" +
        "Thank you for booking with Okaeri Trip!\n\n" +
        "Tour:   " + b.tour + "\n" +
        "Date:   " + b.date + "\n" +
        "Start:  " + b.time + " (Japan time), " + hours + " hours\n" +
        "Guests: " + b.guests + "\n\n" +
        (b.tour.indexOf("Shinjuku") >= 0 ? "Meeting point: Omoide Yokocho, Shinjuku. We'll share the exact meeting spot once your booking is confirmed.\n\n"
          : b.tour.indexOf("Shibuya") >= 0 ? "Meeting point: the \"Myth of Tomorrow\" mural in the passage between JR Shibuya Station and Shibuya Mark City.\n\n"
          : b.tour.indexOf("Shimokitazawa") >= 0 ? "Meeting point: Shimokitazawa Station, Central Exit.\n\n"
          : b.tour.indexOf("Meiji") >= 0 ? "Meeting point: JR Harajuku Station, West Exit.\n\n"
          : "We'll email you the meeting point shortly.\n\n") +
        "Payment: we'll send you a secure credit-card payment link shortly — your reservation is confirmed once payment is completed.\n" +
        "Cancellation: free up to 7 days before the tour, 50% within 7 days, 100% on the tour day or no-show.\n\n" +
        "See you in Tokyo!\nMikuri — Okaeri Trip\n" +
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
