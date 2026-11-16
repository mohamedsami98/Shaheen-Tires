import {
  DEFAULT_BANK_ACCOUNTS,
  DEFAULT_BRANCHES,
  DEFAULT_SITE_CONFIG,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_WALLETS,
} from '../data/defaultData';
import {
  BankAccount,
  BranchLocation,
  SiteConfig,
  SocialLink,
  WalletAccount,
} from '../types/hub';

const STORAGE_KEY = 'shaheen_tires_hub_state_v1';

export interface HubState {
  config: SiteConfig;
  socialLinks: SocialLink[];
  branches: BranchLocation[];
  wallets: WalletAccount[];
  bankAccounts: BankAccount[];
}

export function getDefaultHubState(): HubState {
  return {
    config: DEFAULT_SITE_CONFIG,
    socialLinks: DEFAULT_SOCIAL_LINKS,
    branches: DEFAULT_BRANCHES,
    wallets: DEFAULT_WALLETS,
    bankAccounts: DEFAULT_BANK_ACCOUNTS,
  };
}

export function loadHubState(): HubState {
  const defaults = getDefaultHubState();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<HubState>;
    return {
      config: parsed.config ? { ...defaults.config, ...parsed.config } : defaults.config,
      socialLinks: Array.isArray(parsed.socialLinks) ? parsed.socialLinks : defaults.socialLinks,
      branches: Array.isArray(parsed.branches) ? parsed.branches : defaults.branches,
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : defaults.wallets,
      bankAccounts: Array.isArray(parsed.bankAccounts)
        ? parsed.bankAccounts
        : defaults.bankAccounts,
    };
  } catch {
    return defaults;
  }
}

export function saveHubState(state: HubState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetHubState(): HubState {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return getDefaultHubState();
}

export function compressLogoImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('تنسيق الصورة غير صالح'));
      img.onload = () => {
        const maxDim = 280;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذر معالجة الصورة'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const result = canvas.toDataURL('image/webp', 0.85);
        if (result.length > 130000) {
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        } else {
          resolve(result);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
