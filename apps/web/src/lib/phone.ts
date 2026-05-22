/** Strip everything that isn't a digit or `+`, keep at most one leading `+`,
    cap at 20 chars (long enough for E.164 incl. country code). Used by the
    storefront address form and the backoffice admin-order form so phone
    fields refuse anything other than `+\d+`. */
export function sanitizePhone(input: string): string {
  const cleaned = input.replace(/[^\d+]/g, '');
  const hasLeadingPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\+/g, '');
  return (hasLeadingPlus ? '+' : '') + digits.slice(0, 20);
}
