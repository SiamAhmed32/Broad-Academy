function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return url.replace(/\/$/, "");
}

type DetailRow = { label: string; value: string; mono?: boolean };

type EmailTemplateOptions = {
  preheader: string;
  eyebrow: string;
  greetingName: string;
  heading: string;
  intro: string;
  details?: DetailRow[];
  steps?: string[];
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  note?: string;
  tone?: "default" | "success" | "warning" | "danger";
};

const toneColors = {
  default: { accent: "#007bff", soft: "#f3f7fb", badge: "#163351" },
  success: { accent: "#059669", soft: "#ecfdf5", badge: "#047857" },
  warning: { accent: "#d97706", soft: "#fffbeb", badge: "#b45309" },
  danger: { accent: "#dc2626", soft: "#fef2f2", badge: "#b91c1c" },
};

export function renderBroadAcademyEmail(options: EmailTemplateOptions) {
  const tone = toneColors[options.tone ?? "default"];
  const detailsHtml = options.details?.length
    ? `
      <table class="ba-details" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:100%;margin:22px 0 0;border-collapse:collapse;table-layout:fixed;background:${tone.soft};border:1px solid #e5edf5;border-radius:16px;overflow:hidden">
        ${options.details
          .map(
            (row, index) => `
          <tr>
            <td class="ba-detail-label" style="box-sizing:border-box;padding:14px 18px;${index < options.details!.length - 1 ? "border-bottom:1px solid #e5edf5;" : ""}width:38%;color:#61758a;font-size:13px;font-weight:600;line-height:1.45;vertical-align:top;word-break:break-word;overflow-wrap:anywhere">${escapeHtml(row.label)}</td>
            <td class="ba-detail-value" style="box-sizing:border-box;padding:14px 18px;${index < options.details!.length - 1 ? "border-bottom:1px solid #e5edf5;" : ""}color:#163351;font-size:14px;font-weight:600;line-height:1.45;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;${row.mono ? "font-family:Consolas,Monaco,monospace;letter-spacing:0.02em" : ""}">${escapeHtml(row.value)}</td>
          </tr>`,
          )
          .join("")}
      </table>`
    : "";

  const stepsHtml = options.steps?.length
    ? `
      <ol style="margin:20px 0 0;padding-left:20px;color:#61758a;line-height:1.8;font-size:14px">
        ${options.steps.map((step) => `<li style="margin-bottom:6px">${escapeHtml(step)}</li>`).join("")}
      </ol>`
    : "";

  const ctaHtml = options.cta
    ? `
      <div style="margin:28px 0 0;text-align:center">
        <a href="${escapeHtml(options.cta.href)}" style="display:inline-block;background:${tone.accent};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 24px;border-radius:14px">
          ${escapeHtml(options.cta.label)}
        </a>
      </div>`
    : "";

  const secondaryCtaHtml = options.secondaryCta
    ? `
      <div style="margin:14px 0 0;text-align:center">
        <a href="${escapeHtml(options.secondaryCta.href)}" style="color:${tone.accent};text-decoration:none;font-size:13px;font-weight:600">
          ${escapeHtml(options.secondaryCta.label)} →
        </a>
      </div>`
    : "";

  const noteHtml = options.note
    ? `<p style="margin:22px 0 0;padding:14px 16px;border-radius:12px;background:${tone.soft};color:#61758a;font-size:13px;line-height:1.7">${escapeHtml(options.note)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @media only screen and (max-width: 520px) {
        .ba-page { padding: 18px 8px !important; }
        .ba-card { width: 100% !important; max-width: 100% !important; border-radius: 18px !important; }
        .ba-header { padding: 22px 18px !important; }
        .ba-content { padding: 22px 16px !important; }
        .ba-footer { padding: 16px 18px !important; }
        .ba-heading { font-size: 22px !important; line-height: 1.25 !important; }
        .ba-details { table-layout: auto !important; }
        .ba-detail-label,
        .ba-detail-value {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .ba-detail-label {
          padding: 13px 16px 4px !important;
          border-bottom: 0 !important;
        }
        .ba-detail-value {
          padding: 0 16px 13px !important;
          border-bottom: 1px solid #e5edf5 !important;
        }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f3f7fb">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(options.preheader)}</div>
    <div class="ba-page" style="margin:0;background:#f3f7fb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#163351">
      <div class="ba-card" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5edf5;border-radius:24px;overflow:hidden">
        <div class="ba-header" style="background:#163351;padding:28px 32px;color:#ffffff">
          <div style="font-size:20px;font-weight:700">Broad Academy</div>
          <div style="margin-top:8px;display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.12);color:#8cf0d0;font-size:11px;font-weight:700;letter-spacing:1.4px">${escapeHtml(options.eyebrow)}</div>
        </div>
        <div class="ba-content" style="padding:32px">
          <p style="margin:0 0 12px;font-size:15px">Hello ${escapeHtml(options.greetingName)},</p>
          <h1 class="ba-heading" style="margin:0;font-size:26px;line-height:1.25;color:#163351">${escapeHtml(options.heading)}</h1>
          <p style="margin:14px 0 0;color:#61758a;font-size:15px;line-height:1.75">${options.intro}</p>
          ${detailsHtml}
          ${stepsHtml}
          ${ctaHtml}
          ${secondaryCtaHtml}
          ${noteHtml}
        </div>
        <div class="ba-footer" style="padding:18px 32px;background:#f8fbff;border-top:1px solid #e5edf5;color:#94a3b8;font-size:12px;line-height:1.6">
          Broad Academy · Learn Today, Lead Tomorrow
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export { escapeHtml };
