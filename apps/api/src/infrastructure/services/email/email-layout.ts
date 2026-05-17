import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/** CID referenced in HTML (`cid:…`). */
export const EMAIL_LOGO_CID = 'althea-logo';

/** Public site origin — fallback when logo file is missing. */
export function getEmailPublicBaseUrl(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function getEmailLogoUrl(): string {
  return `${getEmailPublicBaseUrl()}/logo.png`;
}

function resolveLogoPath(): string | null {
  const fromEnv = process.env.EMAIL_LOGO_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const candidates = [
    join(process.cwd(), 'apps', 'api', 'dist', 'assets', 'email', 'logo.png'),
    join(process.cwd(), 'dist', 'assets', 'email', 'logo.png'),
    join(__dirname, '..', '..', '..', 'assets', 'email', 'logo.png'),
    join(__dirname, '..', '..', '..', '..', 'assets', 'email', 'logo.png'),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

let logoBufferCache: Buffer | null | undefined;

export function getEmailLogoBuffer(): Buffer | null {
  if (logoBufferCache !== undefined) return logoBufferCache;
  const logoPath = resolveLogoPath();
  if (!logoPath) {
    logoBufferCache = null;
    return null;
  }
  logoBufferCache = readFileSync(logoPath);
  return logoBufferCache;
}

export function getEmailLogoAttachment(): {
  filename: string;
  content: Buffer;
  cid: string;
  contentDisposition: 'inline';
} | null {
  const content = getEmailLogoBuffer();
  if (!content) return null;
  return {
    filename: 'logo.png',
    content,
    cid: EMAIL_LOGO_CID,
    contentDisposition: 'inline',
  };
}

/** Wrap transactional body HTML with Althea card + logo footer. */
export function wrapEmailHtml(bodyHtml: string): string {
  const logoAtt = getEmailLogoAttachment();
  const imgSrc = logoAtt ? `cid:${EMAIL_LOGO_CID}` : getEmailLogoUrl();

  return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f0f4f3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f3;padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3f1f3;">
          <tr>
            <td style="padding:32px 28px 24px;font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.55;color:#1a1d1a;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;border-top:1px solid #e3f1f3;background:#fafaf8;text-align:center;">
              <img src="${imgSrc}" alt="Althea Systems" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto;border:0;" />
              <p style="margin:14px 0 0;font-family:system-ui,Arial,sans-serif;font-size:11px;color:#6b6f69;">
                Althea Systems — équipements médicaux
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
