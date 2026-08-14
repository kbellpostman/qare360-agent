/**
 * lib/email.ts — verzendt een gestileerde e-mail met het onderzoeksvoorstel.
 * Gebruikt SMTP via env (SMTP_HOST/PORT/USER/PASS). Als SMTP niet geconfigureerd
 * is, retourneren we false zodat de caller kan terugvallen op "link kopiëren".
 */
import nodemailer from "nodemailer";
import type { ResearchPlan } from "@/lib/planner/types";

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Bouw de HTML-versie van de e-mail in QARE-stijl. */
function buildHtml(plan: ResearchPlan, url: string): string {
  const formatted = (typeof plan.estimatedInvestment === "number"
    ? `€${plan.estimatedInvestment.toLocaleString("en-US")}`
    : "—");
  const tags = (plan.tags ?? []).map((t) => `<span style="background:#f2f3f4;color:#4a4d55;border-radius:999px;padding:4px 12px;font-size:12px;margin:0 4px 4px 0;display:inline-block">${t}</span>`).join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f6f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="background:#111318;padding:24px 0;text-align:center">
      <span style="color:#fff;font-weight:700;font-size:18px">QARE 360°</span>
      <span style="color:#9a9ca3;font-size:14px;margin-left:8px">Research Planner</span>
    </div>
    <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;padding:36px;box-shadow:0 10px 30px rgba(20,30,60,.06)">
      <h1 style="margin:0 0 8px;font-size:22px;color:#111318">${plan.recommendationTitle || "Jouw onderzoeksvoorstel"}</h1>
      ${tags ? `<div style="margin-bottom:16px">${tags}</div>` : ""}
      <p style="color:#4a4d55;font-size:15px;line-height:1.6;margin:0 0 24px">${plan.recommendationDescription || ""}</p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
        <tr>
          <td style="padding:12px 0;border-top:1px solid #eee">
            <div style="font-size:11px;color:#9a9ca3;text-transform:uppercase;letter-spacing:.5px">Geschatte investering</div>
            <div style="font-size:20px;font-weight:800;color:#111318">${formatted}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-top:1px solid #eee">
            <div style="font-size:11px;color:#9a9ca3;text-transform:uppercase;letter-spacing:.5px">Aanpak</div>
            <div style="font-size:15px;color:#3a3d44;line-height:1.5">${plan.recommendedApproach || ""}</div>
          </td>
        </tr>
      </table>

      <a href="${url}" style="display:inline-block;background:#111318;color:#fff;text-decoration:none;font-size:15px;font-weight:600;border-radius:10px;padding:14px 28px">Bekijk voorstel</a>
      <p style="color:#b3b5bb;font-size:12px;margin-top:24px">Indicatief plan en prijs. QARE 360° bevestigt haalbaarheid en definitieve kosten vóór aanvang.</p>
    </div>
  </body>
</html>`;
}

export async function sendProposalEmail(
  to: string,
  plan: ResearchPlan,
  url: string
): Promise<boolean> {
  if (!isSmtpConfigured()) return false;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const html = buildHtml(plan, url);
  const text = `${plan.recommendationTitle || "Onderzoeksvoorstel"}\n\n${plan.recommendationDescription || ""}\n\nBekijk het volledige voorstel: ${url}`;

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: `Jouw QARE 360° onderzoeksvoorstel — ${plan.recommendationTitle || "bekijk het hier"}`,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error("sendProposalEmail error:", err);
    return false;
  }
}