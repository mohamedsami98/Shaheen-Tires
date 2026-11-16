import React, { useEffect } from 'react';
import { PublicHub } from './components/PublicHub';
import {
  DEFAULT_BANK_ACCOUNTS,
  DEFAULT_BRANCHES,
  DEFAULT_SITE_CONFIG,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_WALLETS,
} from './data/defaultData';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full rounded-3xl bg-white border border-slate-200 p-7 text-center space-y-4">
            <h1 className="text-lg font-bold">حدث خطأ غير متوقع</h1>
            <p className="text-sm text-slate-600">
              يرجى إعادة تحميل الصفحة أو المحاولة بعد قليل.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const config = DEFAULT_SITE_CONFIG;

  useEffect(() => {
    const root = document.documentElement;
    if (config.surfaceMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.setProperty('--brand-accent', config.primaryColor);
    document.title = `${config.brandName} | الروابط والفروع وطرق الدفع`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && config.brandTagline) {
      metaDesc.setAttribute('content', config.brandTagline);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', config.brandName);
    }
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && config.brandTagline) {
      ogDesc.setAttribute('content', config.brandTagline);
    }
  }, [config]);

  return (
    <AppErrorBoundary>
      <PublicHub
        config={config}
        socialLinks={DEFAULT_SOCIAL_LINKS}
        branches={DEFAULT_BRANCHES}
        wallets={DEFAULT_WALLETS}
        bankAccounts={DEFAULT_BANK_ACCOUNTS}
      />
    </AppErrorBoundary>
  );
}
