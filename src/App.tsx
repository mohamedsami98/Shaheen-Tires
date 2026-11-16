import React, { useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { PublicHub } from './components/PublicHub';
import {
  HubState,
  loadHubState,
  resetHubState,
  saveHubState,
} from './services/hubService';

function isAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname.endsWith('/admin') ||
    window.location.hash === '#/admin' ||
    window.location.hash === '#admin'
  );
}

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
  const [routeIsAdmin, setRouteIsAdmin] = useState<boolean>(isAdminRoute);
  const [hubState, setHubState] = useState<HubState>(() => loadHubState());

  useEffect(() => {
    const handleNav = () => setRouteIsAdmin(isAdminRoute());
    window.addEventListener('hashchange', handleNav);
    window.addEventListener('popstate', handleNav);
    return () => {
      window.removeEventListener('hashchange', handleNav);
      window.removeEventListener('popstate', handleNav);
    };
  }, []);

  const { config, socialLinks, branches, wallets, bankAccounts } = hubState;

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

  const handleUpdateState = (updater: (prev: HubState) => HubState) => {
    setHubState((prev) => {
      const next = updater(prev);
      saveHubState(next);
      return next;
    });
  };

  const handleResetDefaults = () => {
    const fresh = resetHubState();
    setHubState(fresh);
  };

  const openAdmin = () => {
    window.location.hash = '#/admin';
    setRouteIsAdmin(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPublic = () => {
    if (window.location.pathname.endsWith('/admin')) {
      window.history.pushState({}, '', '/');
    } else {
      window.location.hash = '';
    }
    setRouteIsAdmin(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppErrorBoundary>
      {routeIsAdmin ? (
        <AdminDashboard
          state={hubState}
          onUpdateState={handleUpdateState}
          onResetDefaults={handleResetDefaults}
          onBackToPublic={openPublic}
        />
      ) : (
        <PublicHub
          config={config}
          socialLinks={socialLinks}
          branches={branches}
          wallets={wallets}
          bankAccounts={bankAccounts}
          onOpenAdmin={openAdmin}
        />
      )}
    </AppErrorBoundary>
  );
}
