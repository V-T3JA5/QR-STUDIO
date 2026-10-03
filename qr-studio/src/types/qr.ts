export type QRType = 'url' | 'text' | 'email' | 'phone' | 'wifi';
export type ECLevel = 'L' | 'M' | 'Q' | 'H';
export type LogoMode = 'none' | 'center' | 'fade';
export type ThemeMode = 'light' | 'dark' | 'system';
export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

export type PresetId =
  | 'classic'
  | 'dotMatrix'
  | 'neonGlow'
  | 'duotone'
  | 'twoTone'
  | 'retroGrain'
  | 'glassPanel'
  | 'embossed';

export type PresetGroup = 'Structural' | 'Vivid' | 'Textured';
export type ParamValue = number | string;
export type Params = Record<string, ParamValue>;

export interface ContentState {
  url: string;
  text: string;
  email: { to: string; subject: string; body: string };
  phone: string;
  wifi: { ssid: string; password: string; security: WifiSecurity; hidden: boolean };
}

export interface LogoState {
  mode: LogoMode;
  dataUrl: string | null;
  /** Center mode: logo width as a fraction of the code width. */
  scale: number;
  /** Full-fade mode: opacity of the logo behind the modules. */
  opacity: number;
}

export interface BrandState {
  c1: string;
  c2: string; // empty string = derive automatically
}

export interface QRState {
  type: QRType;
  content: ContentState;
  size: number;
  fg: string;
  bg: string;
  ec: ECLevel;
  margin: number;
  presetId: PresetId;
  params: Params;
  logo: LogoState;
  brand: BrandState;
}

export type CheckStatus = 'pass' | 'warn' | 'fail';
export interface ReliabilityItem {
  id: 'contrast' | 'polarity' | 'ec' | 'quiet' | 'logo' | 'pattern';
  label: string;
  status: CheckStatus;
  detail: string;
}
export interface Reliability {
  score: number;
  items: ReliabilityItem[];
}

export interface RecentEntry {
  id: string;
  savedAt: number;
  state: QRState;
}
