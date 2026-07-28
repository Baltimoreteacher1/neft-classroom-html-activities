function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequestPost(context) {
  const { request } = context;
  const origin = request.headers.get("Origin");
  try {
    if (!origin || new URL(origin).host !== new URL(request.url).host)
      return json({ error: "same-origin request required" }, 403);
  } catch {
    return json({ error: "same-origin request required" }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid request" }, 400);
  }
  const weekKey = String(body?.weekKey || "");
  const completedDays = Number(body?.completedDays) || 0;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekKey) || completedDays < 4)
    return json({ error: "milestone not reached" }, 400);

  const store = context.env.NOAM_SCHOOL_KV;
  const mailer = context.env.EMAIL;
  if (!store || !mailer) return json({ error: "notification service unavailable" }, 503);
  const noticeKey = `pushup-notice:${weekKey}`;
  if (await store.get(noticeKey)) return json({ ok: true, alreadySent: true });

  await mailer.send({
    from: { email: ["notifications", "eduwonderlab.com"].join("@"), name: "Shai School" },
    to: ["neftjd", "gmail.com"].join("@"),
    subject: "Shai earned the $5 push-up reward",
    text: `Shai completed 10 push-ups on four separate days during the week of ${weekKey}. His weekly push-up reward is now $5.00.`,
    html: `<h1>Shai reached four push-up days! 💪</h1><p>Shai completed <strong>10 push-ups on four separate days</strong> during the week of ${weekKey}.</p><p>His weekly push-up reward is now <strong>$5.00</strong>.</p>`,
  });
  await store.put(noticeKey, new Date().toISOString(), { expirationTtl: 60 * 60 * 24 * 21 });
  return json({ ok: true, sent: true });
}
