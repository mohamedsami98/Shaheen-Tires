import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AdminDashboard } from './components/AdminDashboard';
import { PublicHub } from './components/PublicHub';
import {
  DEFAULT_BANK_ACCOUNTS,
  DEFAULT_BRANCHES,
  DEFAULT_SITE_CONFIG,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_WALLETS,
} from './data/defaultData';
import { auth } from './lib/firebase';
import {
  subscribeBankAccounts,
  subscribeBranches,
  subscribeSiteConfig,
  subscribeSocialLinks,
  subscribeWallets,
  verifyAdminAccess,
} from './services/hubService';
import {
  BankAccount,
  BranchLocation,
  SiteConfig,
  SocialLink,
  WalletAccount,
} from './types/hub';

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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);

  const [dbConfig, setDbConfig] = useState<SiteConfig | null>(null);
  const [existsInDb, setExistsInDb] = useState(false);
  const [dbSocial, setDbSocial] = useState<SocialLink[]>([]);
  const [dbBranches, setDbBranches] = useState<BranchLocation[]>([]);
  const [dbWallets, setDbWallets] = useState<WalletAccount[]>([]);
  const [dbBanks, setDbBanks] = useState<BankAccount[]>([]);

  useEffect(() => {
    const handleNav = () => setRouteIsAdmin(isAdminRoute());
    window.addEventListener('hashchange', handleNav);
    window.addEventListener('popstate', handleNav);
    return () => {
      window.removeEventListener('hashchange', handleNav);
      window.removeEventListener('popstate', handleNav);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setAdminCheckLoading(true);
        const allowed = await verifyAdminAccess(currentUser);
        setIsAdmin(allowed);
        setAdminCheckLoading(false);
      } else {
        setIsAdmin(false);
        setAdminCheckLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubConfig = subscribeSiteConfig((cfg, exists) => {
      setDbConfig(cfg);
      setExistsInDb(exists);
    });
    return () => unsubConfig();
  }, []);

  useEffect(() => {
    if (authLoading || adminCheckLoading) return;
    const includeHidden = isAdmin;
    const unsubSocial = subscribeSocialLinks(includeHidden, setDbSocial);
    const unsubBranches = subscribeBranches(includeHidden, setDbBranches);
    const unsubWallets = subscribeWallets(includeHidden, setDbWallets);
    const unsubBanks = subscribeBankAccounts(includeHidden, setDbBanks);
    return () => {
      unsubSocial();
      unsubBranches();
      unsubWallets();
      unsubBanks();
    };
  }, [authLoading, adminCheckLoading, isAdmin]);

  const activeConfig = existsInDb && dbConfig ? dbConfig : DEFAULT_SITE_CONFIG;
  const activeSocial = existsInDb ? dbSocial : DEFAULT_SOCIAL_LINKS;
  const activeBranches =
    existsInDb && dbBranches.length > 0 ? dbBranches : existsInDb ? dbBranches : DEFAULT_BRANCHES;
  const activeWallets = existsInDb ? dbWallets : DEFAULT_WALLETS;
  const activeBanks = existsInDb ? dbBanks : DEFAULT_BANK_ACCOUNTS;

  useEffect(() => {
    const root = document.documentElement;
    if (activeConfig.surfaceMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.setProperty('--brand-accent', activeConfig.primaryColor);
    document.title = `${activeConfig.brandName} | الروابط والفروع وطرق الدفع`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && activeConfig.brandTagline) {
      metaDesc.setAttribute('content', activeConfig.brandTagline);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', activeConfig.brandName);
    }
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && activeConfig.brandTagline) {
      ogDesc.setAttribute('content', activeConfig.brandTagline);
    }
  }, [activeConfig]);

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
          user={user}
          authLoading={authLoading}
          isAdmin={isAdmin}
          adminCheckLoading={adminCheckLoading}
          existsInDb={existsInDb}
          config={activeConfig}
          socialLinks={activeSocial}
          branches={activeBranches}
          wallets={activeWallets}
          bankAccounts={activeBanks}
          onBackToPublic={openPublic}
        />
      ) : (
        <PublicHub
          config={activeConfig}
          socialLinks={activeSocial}
          branches={activeBranches}
          wallets={activeWallets}
          bankAccounts={activeBanks}
          isUsingDemoFallback={!existsInDb}
          onOpenAdmin={openAdmin}
        />
      )}
    </AppErrorBoundary>
  );
}
