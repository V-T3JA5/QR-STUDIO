import { useId, useState } from 'react';
import type { ContentState, QRType, WifiSecurity } from '@/types/qr';
import { Field, Segmented } from '@/components/ui';

interface Props {
  type: QRType;
  content: ContentState;
  errors: Record<string, string>;
  onChange: (patch: Partial<ContentState>) => void;
}

export default function ContentForm({ type, content, errors, onChange }: Props) {
  const uid = useId();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));
  // Show an error once the person has typed something or left the field.
  const err = (k: string, value: string) => (value !== '' || touched[k] ? errors[k] : undefined);
  const id = (k: string) => `${uid}-${k}`;
  const aria = (k: string, value: string) => ({
    id: id(k),
    'aria-invalid': !!err(k, value),
    'aria-describedby': err(k, value) ? id(k) + '-err' : undefined,
    onBlur: () => touch(k),
  });

  switch (type) {
    case 'url':
      return (
        <Field label="Web address" htmlFor={id('url')} error={err('url', content.url)} hint="https:// is added for you if you leave it out.">
          <input {...aria('url', content.url)} type="text" inputMode="url" autoComplete="off" spellCheck={false} placeholder="example.com/page"
            className="field-input" value={content.url} onChange={(e) => onChange({ url: e.target.value })} />
        </Field>
      );
    case 'text':
      return (
        <Field label="Text" htmlFor={id('text')} error={err('text', content.text)} hint={`${content.text.length} of 1,000 characters`}>
          <textarea {...aria('text', content.text)} rows={4} placeholder="Anything you want people to read after scanning"
            className="field-input min-h-28 py-2.5" value={content.text} onChange={(e) => onChange({ text: e.target.value })} />
        </Field>
      );
    case 'email':
      return (
        <div className="space-y-4">
          <Field label="Send to" htmlFor={id('to')} error={err('to', content.email.to)}>
            <input {...aria('to', content.email.to)} type="email" autoComplete="off" placeholder="name@example.com" className="field-input"
              value={content.email.to} onChange={(e) => onChange({ email: { ...content.email, to: e.target.value } })} />
          </Field>
          <Field label="Subject (optional)" htmlFor={id('subject')} error={err('subject', content.email.subject)}>
            <input {...aria('subject', content.email.subject)} type="text" className="field-input"
              value={content.email.subject} onChange={(e) => onChange({ email: { ...content.email, subject: e.target.value } })} />
          </Field>
          <Field label="Message (optional)" htmlFor={id('body')} error={err('body', content.email.body)}>
            <textarea {...aria('body', content.email.body)} rows={3} className="field-input py-2.5"
              value={content.email.body} onChange={(e) => onChange({ email: { ...content.email, body: e.target.value } })} />
          </Field>
        </div>
      );
    case 'phone':
      return (
        <Field label="Phone number" htmlFor={id('phone')} error={err('phone', content.phone)} hint="Include the country code, for example +1 555 0100.">
          <input {...aria('phone', content.phone)} type="tel" autoComplete="off" placeholder="+1 555 0100" className="field-input"
            value={content.phone} onChange={(e) => onChange({ phone: e.target.value })} />
        </Field>
      );
    case 'wifi': {
      const w = content.wifi;
      const set = (patch: Partial<ContentState['wifi']>) => onChange({ wifi: { ...w, ...patch } });
      const open = w.security === 'nopass';
      return (
        <div className="space-y-4">
          <Field label="Network name" htmlFor={id('ssid')} error={err('ssid', w.ssid)}>
            <input {...aria('ssid', w.ssid)} type="text" autoComplete="off" spellCheck={false} className="field-input"
              value={w.ssid} onChange={(e) => set({ ssid: e.target.value })} />
          </Field>
          <div>
            <span className="mb-1.5 block text-sm font-medium">Security</span>
            <Segmented<WifiSecurity>
              label="Wi-Fi security"
              value={w.security}
              onChange={(security) => set({ security, password: security === 'nopass' ? '' : w.password })}
              options={[{ value: 'WPA', label: 'WPA/WPA2' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: 'None' }]}
            />
          </div>
          {!open && (
            <Field label="Password" htmlFor={id('password')} error={err('password', w.password)}>
              <input {...aria('password', w.password)} type="text" autoComplete="off" spellCheck={false} className="field-input"
                value={w.password} onChange={(e) => set({ password: e.target.value })} />
            </Field>
          )}
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={w.hidden} onChange={(e) => set({ hidden: e.target.checked })}
              className="h-5 w-5 cursor-pointer" style={{ accentColor: 'rgb(var(--ink-primary))' }} />
            This network is hidden
          </label>
        </div>
      );
    }
  }
}
