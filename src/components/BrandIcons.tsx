import React from 'react';
import { Globe, MessageCircle, Send, Share2, Wallet, Youtube } from 'lucide-react';
import { SocialPlatform, WalletProvider } from '../types/hub';

export function SocialPlatformIcon({
  platform,
  className = 'w-5 h-5',
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  switch (platform) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.5-1.5h1.7V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H7.5v3h2.8v8h3.2z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.76a8.26 8.26 0 0 0 4.76 1.5V6.81a4.84 4.84 0 0 1-1-.12z" />
        </svg>
      );
    case 'whatsapp':
      return <MessageCircle className={className} aria-hidden="true" />;
    case 'telegram':
      return <Send className={className} aria-hidden="true" />;
    case 'youtube':
      return <Youtube className={className} aria-hidden="true" />;
    case 'website':
      return <Globe className={className} aria-hidden="true" />;
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      );
    default:
      return <Share2 className={className} aria-hidden="true" />;
  }
}

export function getPlatformBrandColor(platform: SocialPlatform): string {
  switch (platform) {
    case 'facebook':
      return '#1877F2';
    case 'instagram':
      return '#E1306C';
    case 'tiktok':
      return '#0F172A';
    case 'whatsapp':
      return '#16A34A';
    case 'telegram':
      return '#0284C7';
    case 'youtube':
      return '#DC2626';
    case 'website':
      return '#0F766E';
    case 'x':
      return '#1E293B';
    case 'linkedin':
      return '#0A66C2';
    case 'snapchat':
      return '#CA8A04';
  }
}

export function getWalletBrandStyle(provider: WalletProvider): {
  color: string;
  bgTint: string;
  shortCode: string;
} {
  switch (provider) {
    case 'vodafone':
      return { color: '#DC2626', bgTint: 'rgba(220, 38, 38, 0.10)', shortCode: 'VF' };
    case 'orange':
      return { color: '#EA580C', bgTint: 'rgba(234, 88, 12, 0.10)', shortCode: 'OR' };
    case 'etisalat':
      return { color: '#15803D', bgTint: 'rgba(21, 128, 61, 0.10)', shortCode: 'e&' };
    case 'wepay':
      return { color: '#6D28D9', bgTint: 'rgba(109, 40, 217, 0.10)', shortCode: 'WE' };
    case 'instapay':
      return { color: '#4338CA', bgTint: 'rgba(67, 56, 202, 0.10)', shortCode: 'IP' };
    default:
      return { color: '#0F766E', bgTint: 'rgba(15, 118, 110, 0.10)', shortCode: 'PAY' };
  }
}

export function WalletProviderMark({ provider }: { provider: WalletProvider }) {
  const style = getWalletBrandStyle(provider);
  return (
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-mono-nums text-xs font-bold tracking-tight border"
      style={{
        backgroundColor: style.bgTint,
        color: style.color,
        borderColor: `${style.color}30`,
      }}
      aria-hidden="true"
    >
      {provider === 'other' ? <Wallet className="w-5 h-5" /> : style.shortCode}
    </div>
  );
}
