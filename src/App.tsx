import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { AdminDashboard } from './components/AdminDashboard';
import { PublicHub } from './components/PublicHub';
import { ADMIN_EMAIL, auth, googleProvider } from './lib/firebase';
import {
  ensureFirestoreSeeded,
  HubState,
  loadHubState,
  subscribeToHubState,
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
  const [isCloudSeeded, setIsCloudSeeded] = useState<boolean>(false);

  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

  const isAuthorizedAdmin = Boolean(
    authUser &&
      authUser.emailVerified &&
      authUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

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
    const unsubscribe = subscribeToHubState(
      (nextState, seeded) => {
        setHubState(nextState);
        setIsCloudSeeded(seeded);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const matchesAdmin =
          user.emailVerified &&
          user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (!matchesAdmin) {
          setAuthError(
            `تم رفض الدخول: الحساب (${user.email || 'غير معروف'}) غير مصرح له. صفحة التعديل مقفولة ومخصصة فقط لحساب ${ADMIN_EMAIL}.`
          );
          await signOut(auth);
          setAuthUser(null);
          setAuthReady(true);
          return;
        }
        setAuthError(null);
        setUnauthorizedDomain(null);
        setAuthUser(user);
      } else {
        setAuthUser(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthorizedAdmin && !isCloudSeeded) {
      ensureFirestoreSeeded(hubState).catch((err) => {
        console.error('Auto-seed error:', err);
      });
    }
  }, [isAuthorizedAdmin, isCloudSeeded]);

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

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    setUnauthorizedDomain(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = cred.user.email || '';
      if (!cred.user.emailVerified || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        setAuthError(
          `تم رفض الدخول: الحساب (${email || 'غير معروف'}) غير مصرح له. صفحة التعديل مخصصة فقط لحساب ${ADMIN_EMAIL}.`
        );
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(window.location.hostname);
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('قام المتصفح بحظر نافذة تسجيل الدخول المنبثقة. يرجى السماح بالنوافذ المنبثقة والمحاولة مرة أخرى.');
      } else {
        setAuthError('تعذر تسجيل الدخول حالياً. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAuthError(null);
  };

  const openAdmin = () => {
    window.location.hash = '#/admin';
    setRouteIsAdmin(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPublic = () => {
    if (window.location.pathname.endsWith('/admin')) {
      window.history.pushState({}, '', import.meta.env.BASE_URL || '/');
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
          authReady={authReady}
          authUser={authUser}
          isAuthorizedAdmin={isAuthorizedAdmin}
          authLoading={authLoading}
          authError={authError}
          unauthorizedDomain={unauthorizedDomain}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
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
