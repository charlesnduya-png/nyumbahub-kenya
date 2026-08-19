/** Normalize Kenyan phone numbers for tel: and WhatsApp links. */

export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Display-friendly Kenyan mobile (keeps leading 0 when present). */
export function formatKenyanPhone(phone: string): string {
  const digits = digitsOnly(phone);
  if (!digits) return phone.trim();

  if (digits.startsWith("254") && digits.length >= 12) {
    return `0${digits.slice(3)}`;
  }

  if (digits.startsWith("0") && digits.length >= 10) {
    return digits;
  }

  if (digits.length === 9) {
    return `0${digits}`;
  }

  return phone.trim();
}

/** WhatsApp / wa.me expects country code without +. */
export function toWhatsAppNumber(phone: string): string | null {
  const digits = digitsOnly(phone);
  if (!digits) return null;

  if (digits.startsWith("254") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length >= 10) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  if (digits.length >= 10) return digits;
  return null;
}

export function telHref(phone: string): string {
  const digits = digitsOnly(phone);
  if (digits.startsWith("254")) return `tel:+${digits}`;
  if (digits.startsWith("0")) return `tel:+254${digits.slice(1)}`;
  if (digits.length === 9) return `tel:+254${digits}`;
  return `tel:${phone.trim()}`;
}
