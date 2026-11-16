export type SectionKey = 'social' | 'branches' | 'wallets' | 'banks';

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'whatsapp'
  | 'telegram'
  | 'youtube'
  | 'website'
  | 'x'
  | 'linkedin'
  | 'snapchat';

export type WalletProvider =
  | 'vodafone'
  | 'orange'
  | 'etisalat'
  | 'wepay'
  | 'instapay'
  | 'other';

export type AccentStyle = 'emerald' | 'gold' | 'navy' | 'obsidian' | 'custom';
export type SurfaceMode = 'light' | 'dark';

export interface SiteConfig {
  brandName: string;
  brandTagline: string;
  logoUrl: string;
  primaryColor: string;
  surfaceMode: SurfaceMode;
  accentStyle: AccentStyle;
  whatsappFloatNumber: string;
  whatsappFloatEnabled: boolean;
  paymentInstructions: string;
  beneficiaryWarning: string;
  sectionOrder: SectionKey[];
  sectionVisibility: Record<SectionKey, boolean>;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  subtitle: string;
  visible: boolean;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface BranchLocation {
  id: string;
  name: string;
  address: string;
  mapUrl: string;
  visible: boolean;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface WalletAccount {
  id: string;
  provider: WalletProvider;
  providerName: string;
  identifier: string;
  ownerName: string;
  showOwnerName: boolean;
  note: string;
  visible: boolean;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  iban: string;
  currency: string;
  branchName: string;
  visible: boolean;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface ThemePreset {
  id: AccentStyle;
  name: string;
  primaryColor: string;
  surfaceMode: SurfaceMode;
  swatch: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'custom',
    name: 'أحمر شاهين الرسمي',
    primaryColor: '#DC2626',
    surfaceMode: 'light',
    swatch: '#DC2626',
  },
  {
    id: 'emerald',
    name: 'زمردي رسمي',
    primaryColor: '#0F766E',
    surfaceMode: 'light',
    swatch: '#0F766E',
  },
  {
    id: 'gold',
    name: 'ذهبي فاخر',
    primaryColor: '#B45309',
    surfaceMode: 'light',
    swatch: '#B45309',
  },
  {
    id: 'navy',
    name: 'كحلي مؤسسي',
    primaryColor: '#1E3A8A',
    surfaceMode: 'light',
    swatch: '#1E3A8A',
  },
  {
    id: 'obsidian',
    name: 'ليلي داكن',
    primaryColor: '#DC2626',
    surfaceMode: 'dark',
    swatch: '#1E293B',
  },
];

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'فيسبوك (Facebook)',
  instagram: 'إنستغرام (Instagram)',
  tiktok: 'تيك توك (TikTok)',
  whatsapp: 'واتساب (WhatsApp)',
  telegram: 'تيليجرام (Telegram)',
  youtube: 'يوتيوب (YouTube)',
  website: 'الموقع الإلكتروني',
  x: 'إكس (X / Twitter)',
  linkedin: 'لينكدإن (LinkedIn)',
  snapchat: 'سناب شات (Snapchat)',
};

export const WALLET_PROVIDER_LABELS: Record<WalletProvider, string> = {
  vodafone: 'Vodafone Cash',
  orange: 'Orange Cash',
  etisalat: 'Etisalat Cash / e& Cash',
  wepay: 'WE Pay',
  instapay: 'InstaPay',
  other: 'محفظة أخرى',
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  social: 'حسابات التواصل الاجتماعي',
  branches: 'الفروع ومراكز الصيانة',
  wallets: 'طرق الدفع بالمحافظ الإلكترونية',
  banks: 'الحسابات البنكية',
};
