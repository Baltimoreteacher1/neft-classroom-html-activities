import { drawQrOnCanvas } from "./qr-mini.js";
import { t } from "./i18n.js";

function lessonUrl(config) {
  if (typeof window === "undefined") return "";
  const base = window.location.origin;
  const id = config.lessonId || "";
  return `${base}/lessons/${encodeURIComponent(id)}/`;
}

/**
 * Render completion certificate to PNG and trigger download.
 * Print flow unchanged — this is additive.
 */
export async function downloadCertificatePng(certEl, config, state) {
  if (!certEl || typeof document === "undefined") return false;

  const s = state?.get?.() || {};
  const W = 900;
  const H = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  // Background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#fdf6ec");
  grad.addColorStop(1, "#dff2ee");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = "#387F84";
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = "#F2A93B";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  ctx.textAlign = "center";
  ctx.fillStyle = "#264653";

  ctx.font = "bold 28px Outfit, system-ui, sans-serif";
  ctx.fillText("🏆", W / 2, 100);

  ctx.font = "600 18px Outfit, system-ui, sans-serif";
  ctx.fillStyle = "#387F84";
  ctx.fillText(t("lessonComplete"), W / 2, 140);

  ctx.font = "bold 42px Outfit, system-ui, sans-serif";
  ctx.fillStyle = "#264653";
  ctx.fillText(config.title || "Lesson", W / 2, 200);

  const totalStars = (s.phases || []).reduce(
    (sum, p) => sum + (p.stars || 0),
    0,
  );
  ctx.font = "24px Hanken Grotesk, system-ui, sans-serif";
  ctx.fillStyle = "#C85A3A";
  ctx.fillText(`${totalStars}/18 ★`, W / 2, 245);

  ctx.font = "16px Hanken Grotesk, system-ui, sans-serif";
  ctx.fillStyle = "#5a6b75";
  ctx.fillText(t("awardedTo"), W / 2, 300);

  ctx.font = "bold 36px Outfit, system-ui, sans-serif";
  ctx.fillStyle = "#264653";
  ctx.fillText(s.studentName || t("mathematician"), W / 2, 350);

  if (s.studentPeriod) {
    ctx.font = "18px Hanken Grotesk, system-ui, sans-serif";
    ctx.fillStyle = "#5a6b75";
    ctx.fillText(`${t("period")} ${s.studentPeriod}`, W / 2, 385);
  }

  // Stats row
  const stats = [
    [`${s.xp || 0}`, t("xpEarned")],
    [`${totalStars}/18`, t("stars")],
    [`${s.coins || 0}`, t("coins")],
    [
      s.totalAttempts > 0
        ? `${Math.round((s.totalCorrect / s.totalAttempts) * 100)}%`
        : "100%",
      t("accuracy"),
    ],
  ];
  const statY = 450;
  const statW = W / 4;
  stats.forEach(([val, label], i) => {
    const cx = statW * i + statW / 2;
    ctx.font = "bold 28px Outfit, system-ui, sans-serif";
    ctx.fillStyle = "#264653";
    ctx.fillText(val, cx, statY);
    ctx.font = "13px Hanken Grotesk, system-ui, sans-serif";
    ctx.fillStyle = "#5a6b75";
    ctx.fillText(label, cx, statY + 22);
  });

  // Phase stars
  let py = 520;
  ctx.textAlign = "left";
  ctx.font = "16px Hanken Grotesk, system-ui, sans-serif";
  (s.phases || []).forEach((p) => {
    ctx.fillStyle = "#264653";
    ctx.fillText(p.name || "", 80, py);
    ctx.fillStyle = "#F2A93B";
    ctx.fillText(
      "★".repeat(p.stars || 0) + "☆".repeat(3 - (p.stars || 0)),
      320,
      py,
    );
    py += 28;
  });

  // Footer
  ctx.textAlign = "center";
  ctx.font = "14px Hanken Grotesk, system-ui, sans-serif";
  ctx.fillStyle = "#387F84";
  ctx.fillText(config.standard || "", W / 2, H - 180);
  ctx.fillStyle = "#5a6b75";
  ctx.fillText(new Date().toLocaleDateString(), W / 2, H - 155);
  ctx.fillText("Neft Teacher", W / 2, H - 130);

  // QR code — optional. A QR failure must never block the certificate, so the
  // code (and its label) are only drawn if generation succeeds.
  try {
    const url = lessonUrl(config);
    await drawQrOnCanvas(ctx, url, W / 2 - 50, H - 85, 100);
    ctx.font = "12px Hanken Grotesk, system-ui, sans-serif";
    ctx.fillStyle = "#5a6b75";
    ctx.fillText(t("scanToRevisit"), W / 2, H - 95);
  } catch {
    /* QR unavailable — emit the certificate without it. */
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${config.lessonId || "lesson"}-certificate.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      resolve(true);
    }, "image/png");
  });
}

/** Wire download button on certificate element. */
export function mountCertificateDownload(certEl, config, state) {
  if (!certEl) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-primary certificate-download-btn";
  btn.innerHTML = `<span class="i18n-stack"><span class="i18n-en">${t("downloadCertificate", "en")}</span><span class="i18n-es">${t("downloadCertificate", "es")}</span></span>`;
  const restoreLabel = `<span class="i18n-stack"><span class="i18n-en">${t("downloadCertificate", "en")}</span><span class="i18n-es">${t("downloadCertificate", "es")}</span></span>`;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "…";
    try {
      await downloadCertificatePng(certEl, config, state);
    } finally {
      // Always restore the button, even if rendering/QR threw.
      btn.disabled = false;
      btn.innerHTML = restoreLabel;
    }
  });
  const printBtn = certEl.querySelector(".certificate-print-btn");
  if (printBtn) printBtn.before(btn);
  else certEl.append(btn);
}
