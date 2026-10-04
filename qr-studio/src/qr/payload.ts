import type { ContentState, QRType } from '@/types/qr';

export interface PayloadResult {
  payload: string;
  errors: Record<string, string>;
  valid: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Wi-Fi payload fields must escape \ ; , : and " with a backslash. */
export const escapeWifi = (v: string): string => v.replace(/([\\;,:"])/g, '\\$1');

function normalizeUrl(raw: string): { url: string; error?: string } {
  const v = raw.trim();
  if (!v) return { url: '', error: 'Enter a web address.' };
  if (/\s/.test(v)) return { url: v, error: 'Web addresses cannot contain spaces.' };
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(v);
  const candidate = hasScheme ? v : 'https://' + v;
  try {
    const u = new URL(candidate);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { url: v, error: 'Use an http or https address.' };
    }
    const host = u.hostname;
    if (host !== 'localhost' && !/^[^.]+(\.[^.]+)+$/.test(host)) {
      return { url: v, error: 'Enter a full domain, such as example.com.' };
    }
    return { url: candidate };
  } catch {
    return { url: v, error: 'That does not look like a valid web address.' };
  }
}

export function buildPayload(type: QRType, c: ContentState): PayloadResult {
  const errors: Record<string, string> = {};
  let payload = '';

  switch (type) {
    case 'url': {
      const r = normalizeUrl(c.url);
      if (r.error) errors.url = r.error;
      else payload = r.url;
      break;
    }
    case 'text': {
      if (!c.text.trim()) errors.text = 'Enter some text.';
      else if (c.text.length > 1000) errors.text = 'Keep text under 1,000 characters.';
      else payload = c.text;
      break;
    }
    case 'email': {
      const to = c.email.to.trim();
      if (!to) errors.to = 'Enter an email address.';
      else if (!EMAIL_RE.test(to)) errors.to = 'That does not look like a valid email address.';
      if (c.email.subject.length > 200) errors.subject = 'Keep the subject under 200 characters.';
      if (c.email.body.length > 600) errors.body = 'Keep the message under 600 characters.';
      if (!errors.to && !errors.subject && !errors.body) {
        const q: string[] = [];
        if (c.email.subject.trim()) q.push('subject=' + encodeURIComponent(c.email.subject.trim()));
        if (c.email.body.trim()) q.push('body=' + encodeURIComponent(c.email.body.trim()));
        payload = 'mailto:' + to + (q.length ? '?' + q.join('&') : '');
      }
      break;
    }
    case 'phone': {
      const raw = c.phone.trim();
      const cleaned = raw.replace(/[\s().-]/g, '');
      if (!raw) errors.phone = 'Enter a phone number.';
      else if (!/^\+?\d{5,15}$/.test(cleaned)) {
        errors.phone = 'Use 5 to 15 digits, with an optional leading +.';
      } else payload = 'tel:' + cleaned;
      break;
    }
    case 'wifi': {
      const w = c.wifi;
      if (!w.ssid) errors.ssid = 'Enter the network name.';
      else if (w.ssid.length > 32) errors.ssid = 'Network names are 32 characters at most.';
      if (w.security === 'WPA' && (w.password.length < 8 || w.password.length > 63)) {
        errors.password = 'WPA passwords are 8 to 63 characters.';
      } else if (w.security === 'WEP' && w.password.length < 5) {
        errors.password = 'WEP passwords are at least 5 characters.';
      }
      if (!errors.ssid && !errors.password) {
        payload =
          'WIFI:T:' + w.security + ';S:' + escapeWifi(w.ssid) + ';' +
          (w.security !== 'nopass' ? 'P:' + escapeWifi(w.password) + ';' : '') +
          (w.hidden ? 'H:true;' : '') + ';';
      }
      break;
    }
  }
  return { payload, errors, valid: Object.keys(errors).length === 0 && payload.length > 0 };
}

export const TYPE_LABEL: Record<QRType, string> = {
  url: 'Link', text: 'Text', email: 'Email', phone: 'Phone', wifi: 'Wi-Fi',
};
