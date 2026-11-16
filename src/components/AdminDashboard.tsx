import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Landmark,
  LogIn,
  LogOut,
  MapPin,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Share2,
  ShieldCheck,
  Trash2,
  Upload,
  Wallet,
} from 'lucide-react';
import { DEFAULT_LOGO_PATH, DEFAULT_SITE_CONFIG } from '../data/defaultData';
import { ADMIN_EMAIL, FIREBASE_PROJECT_ID } from '../lib/firebase';
import {
  compressLogoImage,
  deleteFirestoreDoc,
  HubState,
  reorderFirestoreDocs,
  resetFirestoreToDefaults,
  saveBankToFirestore,
  saveBranchToFirestore,
  saveSiteConfigToFirestore,
  saveSocialLinkToFirestore,
  saveWalletToFirestore,
} from '../services/hubService';
import {
  BankAccount,
  BranchLocation,
  PLATFORM_LABELS,
  SECTION_LABELS,
  SectionKey,
  SiteConfig,
  SocialLink,
  SocialPlatform,
  THEME_PRESETS,
  WALLET_PROVIDER_LABELS,
  WalletAccount,
  WalletProvider,
} from '../types/hub';
import { SocialPlatformIcon, WalletProviderMark } from './BrandIcons';

type AdminTab = 'brand' | 'sections' | 'social' | 'branches' | 'wallets' | 'banks';

interface AdminDashboardProps {
  state: HubState;
  authReady: boolean;
  authUser: User | null;
  isAuthorizedAdmin: boolean;
  authLoading: boolean;
  authError: string | null;
  unauthorizedDomain: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onBackToPublic: () => void;
}

export function AdminDashboard({
  state,
  authReady,
  authUser,
  isAuthorizedAdmin,
  authLoading,
  authError,
  unauthorizedDomain,
  onSignIn,
  onSignOut,
  onBackToPublic,
}: AdminDashboardProps) {
  const { config, socialLinks, branches, wallets, bankAccounts } = state;
  const [activeTab, setActiveTab] = useState<AdminTab>('brand');
  const [draftConfig, setDraftConfig] = useState<SiteConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const [editingSocial, setEditingSocial] = useState<SocialLink | null>(null);
  const [editingBranch, setEditingBranch] = useState<BranchLocation | null>(null);
  const [editingWallet, setEditingWallet] = useState<WalletAccount | null>(null);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);

  useEffect(() => {
    setDraftConfig(config);
  }, [config]);

  const notify = (text: string, type: 'ok' | 'err' = 'ok') => {
    setStatusMessage({ type, text });
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const runMutation = async (fn: () => Promise<void>, successText: string) => {
    setIsSaving(true);
    try {
      await fn();
      notify(successText, 'ok');
    } catch (err) {
      console.error(err);
      notify('تعذر حفظ التعديل في السحابة، تأكد من الصلاحيات والاتصال.', 'err');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await runMutation(
      () => saveSiteConfigToFirestore(draftConfig),
      'تم حفظ الإعدادات ونشرها للجميع بنجاح'
    );
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressLogoImage(file);
      setDraftConfig((prev) => ({ ...prev, logoUrl: compressedDataUrl }));
      notify('تم تجهيز الشعار الجديد، اضغط على حفظ الهوية والألوان لتثبيته');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل تحميل الشعار', 'err');
    }
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const nextOrder = [...draftConfig.sectionOrder];
    const target = index + direction;
    if (target < 0 || target >= nextOrder.length) return;
    const temp = nextOrder[index];
    nextOrder[index] = nextOrder[target];
    nextOrder[target] = temp;
    setDraftConfig((prev) => ({ ...prev, sectionOrder: nextOrder }));
  };

  const moveArrayItem = <T extends { id: string; order: number }>(
    list: T[],
    index: number,
    direction: -1 | 1
  ): T[] => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    return next.map((item, idx) => ({ ...item, order: idx }));
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shaheen-tires-config.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('تم تصدير ملف الإعدادات بنجاح');
  };

  const handleCopyDomain = async (domain: string) => {
    try {
      await navigator.clipboard.writeText(domain);
      setCopiedDomain(true);
      window.setTimeout(() => setCopiedDomain(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  if (!authReady) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex items-center justify-center p-6"
      >
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-5 text-sm font-medium">
          جاري التحقق من جلسة الإدارة...
        </div>
      </div>
    );
  }

  if (!isAuthorizedAdmin) {
    const authorizedDomainsUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/settings`;
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white">
              تسجيل دخول لوحة التحكم
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              هذه الصفحة مقفولة ومخصصة فقط لحساب الإدارة{' '}
              <span dir="ltr" className="font-mono-nums font-semibold text-slate-900 dark:text-white">
                ({ADMIN_EMAIL})
              </span>{' '}
              لتعديل الروابط والفروع والمحافظ وحفظها مباشرة في الموقع المنشور.
            </p>
          </div>

          {unauthorizedDomain && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 space-y-2.5 leading-relaxed">
              <div className="flex items-start gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  النطاق الحالي (<span dir="ltr" className="font-mono-nums">{unauthorizedDomain}</span>) غير مضاف بعد في إعدادات Firebase.
                </span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] sm:text-xs">
                <li>افتح إعدادات Firebase بالزر أدناه</li>
                <li>اختر تبويب <strong dir="ltr">Authorized domains</strong> ثم اضغط <strong dir="ltr">Add domain</strong></li>
                <li>أضف النطاق واحفظه ثم أعد الضغط على تسجيل الدخول</li>
              </ol>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyDomain(unauthorizedDomain)}
                  className="min-h-[34px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 text-[11px] font-semibold flex items-center gap-1.5"
                >
                  {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span dir="ltr" className="font-mono-nums">
                    {copiedDomain ? 'تم النسخ' : unauthorizedDomain}
                  </span>
                </button>
                <a
                  href={authorizedDomainsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[34px] px-3 rounded-lg bg-red-600 text-white text-[11px] font-semibold flex items-center gap-1.5 hover:bg-red-700"
                >
                  <span>فتح Authorized domains</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {authError && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={authLoading}
              onClick={onSignIn}
              className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <LogIn className="w-4 h-4" />
              <span>{authLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول بحساب Google'}</span>
            </button>

            <button
              type="button"
              onClick={onBackToPublic}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى الصفحة العامة</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-30 h-15 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap truncate">
              لوحة تحكم شاهين للإطارات والبطاريات
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportJson}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تصدير JSON</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
            <button
              type="button"
              onClick={onBackToPublic}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5 whitespace-nowrap"
              style={{ backgroundColor: draftConfig.primaryColor }}
            >
              <Eye className="w-4 h-4" />
              <span>معاينة الصفحة</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-20">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-2">
            <span>الحساب النشط:</span>
            <span dir="ltr" className="font-mono-nums font-semibold text-slate-900 dark:text-white">
              {authUser?.email || ADMIN_EMAIL}
            </span>
            {isSaving && (
              <span className="text-xs text-slate-500">· جاري الحفظ في السحابة...</span>
            )}
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              runMutation(async () => {
                await resetFirestoreToDefaults();
              }, 'تمت استعادة الإعدادات الافتراضية لشركة شاهين ونشرها')
            }
            className="min-h-[38px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {[
            { id: 'brand' as AdminTab, label: 'الهوية والألوان', icon: Palette },
            { id: 'sections' as AdminTab, label: 'الأقسام والتعليمات', icon: Settings2 },
            { id: 'social' as AdminTab, label: 'التواصل الاجتماعي', icon: Share2 },
            { id: 'branches' as AdminTab, label: 'الفروع والخريطة', icon: MapPin },
            { id: 'wallets' as AdminTab, label: 'المحافظ الإلكترونية', icon: Wallet },
            { id: 'banks' as AdminTab, label: 'الحسابات البنكية', icon: Landmark },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: BRAND & COLORS */}
        {activeTab === 'brand' && (
          <form
            onSubmit={handleSaveConfig}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 space-y-6"
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold">هوية المشروع والشعار والألوان</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                تحديث اسم الشركة ووصفها ورفع الشعار وتخصيص نظام الألوان
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              <img
                src={draftConfig.logoUrl || DEFAULT_LOGO_PATH}
                alt="معاينة الشعار"
                className="w-32 h-20 rounded-2xl object-contain p-1.5 border border-slate-200 dark:border-slate-700 bg-[#F5F5F5] shrink-0"
              />
              <div className="flex-1 space-y-2.5 w-full">
                <div className="text-sm font-semibold">شعار الشركة</div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-2 cursor-pointer hover:opacity-90">
                    <Upload className="w-4 h-4" />
                    <span>رفع شعار من الجهاز</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        logoUrl: DEFAULT_SITE_CONFIG.logoUrl,
                      }))
                    }
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة شعار SHAHEEN</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold" htmlFor="brandName">
                  اسم الشركة أو المشروع
                </label>
                <input
                  id="brandName"
                  type="text"
                  required
                  maxLength={120}
                  value={draftConfig.brandName}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({ ...prev, brandName: e.target.value }))
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" htmlFor="surfaceMode">
                  مظهر الصفحة العام
                </label>
                <select
                  id="surfaceMode"
                  value={draftConfig.surfaceMode}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      surfaceMode: e.target.value === 'dark' ? 'dark' : 'light',
                    }))
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                >
                  <option value="light">فاتح رسمي (Light)</option>
                  <option value="dark">داكن فاخر (Dark)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold" htmlFor="brandTagline">
                الوصف المختصر أسفل الاسم
              </label>
              <textarea
                id="brandTagline"
                rows={3}
                maxLength={300}
                value={draftConfig.brandTagline}
                onChange={(e) =>
                  setDraftConfig((prev) => ({ ...prev, brandTagline: e.target.value }))
                }
                className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold">لوحة الألوان المخصصة</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {THEME_PRESETS.map((preset) => {
                  const selected =
                    draftConfig.primaryColor.toLowerCase() === preset.primaryColor.toLowerCase() &&
                    draftConfig.surfaceMode === preset.surfaceMode;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          accentStyle: preset.id,
                          primaryColor: preset.primaryColor,
                          surfaceMode: preset.surfaceMode,
                        }))
                      }
                      className={`p-3 rounded-xl border text-right flex items-center gap-2.5 transition-colors ${
                        selected
                          ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-lg shrink-0 border border-black/10"
                        style={{ backgroundColor: preset.swatch }}
                      />
                      <span className="text-xs font-semibold truncate">{preset.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  أو اختر لونًا مخصصًا للأزرار والعناصر المميزة:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draftConfig.primaryColor}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        primaryColor: e.target.value,
                        accentStyle: 'custom',
                      }))
                    }
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                  />
                  <span dir="ltr" className="text-xs font-mono-nums text-slate-600 dark:text-slate-300">
                    {draftConfig.primaryColor}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="min-h-[46px] px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                style={{ backgroundColor: draftConfig.primaryColor }}
              >
                <Save className="w-4 h-4" />
                <span>حفظ الهوية والألوان</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SECTIONS ORDER & INSTRUCTIONS */}
        {activeTab === 'sections' && (
          <form
            onSubmit={handleSaveConfig}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 space-y-6"
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold">ترتيب الأقسام، تعليمات الدفع، وزر الواتساب العائم</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                تحكم في ظهور الأقسام وترتيبها من الأعلى للأسفل وفي التنبيهات الظاهرة للعملاء
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold">ترتيب وإظهار الأقسام الرئيسية</h3>
              <div className="space-y-2.5">
                {draftConfig.sectionOrder.map((secKey: SectionKey, idx) => {
                  const isVisible = draftConfig.sectionVisibility?.[secKey] !== false;
                  return (
                    <div
                      key={secKey}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-mono-nums font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold">{SECTION_LABELS[secKey]}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setDraftConfig((prev) => ({
                              ...prev,
                              sectionVisibility: {
                                ...prev.sectionVisibility,
                                [secKey]: !isVisible,
                              },
                            }))
                          }
                          className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                            isVisible
                              ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'
                          }`}
                        >
                          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{isVisible ? 'ظاهر' : 'مخفي'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, -1)}
                          aria-label="تحريك لأعلى"
                          className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === draftConfig.sectionOrder.length - 1}
                          onClick={() => moveSection(idx, 1)}
                          aria-label="تحريك لأسفل"
                          className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold" htmlFor="beneficiaryWarning">
                  تنبيه التأكد من اسم المستفيد قبل التحويل
                </label>
                <textarea
                  id="beneficiaryWarning"
                  rows={2}
                  maxLength={400}
                  value={draftConfig.beneficiaryWarning}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({ ...prev, beneficiaryWarning: e.target.value }))
                  }
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" htmlFor="paymentInstructions">
                  تعليمات الدفع للعميل
                </label>
                <textarea
                  id="paymentInstructions"
                  rows={3}
                  maxLength={1200}
                  value={draftConfig.paymentInstructions}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({ ...prev, paymentInstructions: e.target.value }))
                  }
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">زر الواتساب العائم للتواصل المباشر</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      أدخل الرقم بالصيغة الدولية بدون علامة + (مثال: 201553060666)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={draftConfig.whatsappFloatEnabled}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        whatsappFloatEnabled: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 accent-emerald-600 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={30}
                  placeholder="201553060666"
                  value={draftConfig.whatsappFloatNumber}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({ ...prev, whatsappFloatNumber: e.target.value }))
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-nums"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="min-h-[46px] px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                style={{ backgroundColor: draftConfig.primaryColor }}
              >
                <Save className="w-4 h-4" />
                <span>حفظ الترتيب والتعليمات</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SOCIAL LINKS */}
        {activeTab === 'social' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">إدارة حسابات التواصل الاجتماعي</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  إضافة أو تعديل أو إخفاء أو حذف روابط التواصل والموقع الإلكتروني
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingSocial({
                    id: `social-${Date.now()}`,
                    platform: 'instagram',
                    label: '',
                    url: 'https://',
                    subtitle: '',
                    visible: true,
                    order: socialLinks.length,
                  })
                }
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                style={{ backgroundColor: draftConfig.primaryColor }}
              >
                <Plus className="w-4 h-4" />
                <span>إضافة رابط جديد</span>
              </button>
            </div>

            {editingSocial && (
              <SocialForm
                initial={editingSocial}
                primaryColor={draftConfig.primaryColor}
                onCancel={() => setEditingSocial(null)}
                onSave={(item) => {
                  setEditingSocial(null);
                  void runMutation(
                    () => saveSocialLinkToFirestore(item),
                    'تم حفظ رابط التواصل بنجاح'
                  );
                }}
              />
            )}

            <div className="space-y-2.5">
              {socialLinks.map((link, idx) => (
                <div
                  key={link.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <SocialPlatformIcon platform={link.platform} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">
                        {link.label} {!link.visible && <span className="text-xs text-slate-400">(مخفي)</span>}
                      </div>
                      <div dir="ltr" className="text-xs font-mono-nums text-slate-500 truncate">
                        {link.url}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        void runMutation(
                          () => saveSocialLinkToFirestore({ ...link, visible: !link.visible }),
                          link.visible ? 'تم إخفاء الرابط' : 'تم إظهار الرابط'
                        )
                      }
                      className="min-h-[38px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1"
                    >
                      {link.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{link.visible ? 'ظاهر' : 'مخفي'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() =>
                        void runMutation(
                          () =>
                            reorderFirestoreDocs(
                              'socialLinks',
                              moveArrayItem(socialLinks, idx, -1)
                            ),
                          'تم تحديث ترتيب الروابط'
                        )
                      }
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30"
                      aria-label="تحريك لأعلى"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === socialLinks.length - 1}
                      onClick={() =>
                        void runMutation(
                          () =>
                            reorderFirestoreDocs(
                              'socialLinks',
                              moveArrayItem(socialLinks, idx, 1)
                            ),
                          'تم تحديث ترتيب الروابط'
                        )
                      }
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30"
                      aria-label="تحريك لأسفل"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSocial(link)}
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="تعديل"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void runMutation(
                          () => deleteFirestoreDoc('socialLinks', link.id),
                          'تم حذف الرابط'
                        )
                      }
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-red-200 dark:border-red-900 text-red-600 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BRANCHES & MAP LOCATIONS */}
        {activeTab === 'branches' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">إدارة الفروع ومواقع الخريطة</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  إضافة وتعديل عناوين الفروع وروابط خرائط جوجل (Google Maps)
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingBranch({
                    id: `branch-${Date.now()}`,
                    name: '',
                    address: '',
                    mapUrl: 'https://maps.google.com',
                    visible: true,
                    order: branches.length,
                  })
                }
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                style={{ backgroundColor: draftConfig.primaryColor }}
              >
                <Plus className="w-4 h-4" />
                <span>إضافة فرع جديد</span>
              </button>
            </div>

            {editingBranch && (
              <BranchForm
                initial={editingBranch}
                primaryColor={draftConfig.primaryColor}
                onCancel={() => setEditingBranch(null)}
                onSave={(item) => {
                  setEditingBranch(null);
                  void runMutation(
                    () => saveBranchToFirestore(item),
                    'تم حفظ بيانات الفرع بنجاح'
                  );
                }}
              />
            )}

            <div className="space-y-2.5">
              {branches.map((branch, idx) => (
                <div
                  key={branch.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">
                        {branch.name}{' '}
                        {!branch.visible && <span className="text-xs text-slate-400">(مخفي)</span>}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{branch.address}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        void runMutation(
                          () => saveBranchToFirestore({ ...branch, visible: !branch.visible }),
                          branch.visible ? 'تم إخفاء الفرع' : 'تم إظهار الفرع'
                        )
                      }
                      className="min-h-[38px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1"
                    >
                      {branch.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{branch.visible ? 'ظاهر' : 'مخفي'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() =>
                        void runMutation(
                          () =>
                            reorderFirestoreDocs(
                              'branches',
                              moveArrayItem(branches, idx, -1)
                            ),
                          'تم تحديث ترتيب الفروع'
                        )
                      }
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30"
                      aria-label="تحريك لأعلى"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === branches.length - 1}
                      onClick={() =>
                        void runMutation(
                          () =>
                            reorderFirestoreDocs(
                              'branches',
                              moveArrayItem(branches, idx, 1)
                            ),
                          'تم تحديث ترتيب الفروع'
                        )
                      }
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30"
                      aria-label="تحريك لأسفل"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBranch(branch)}
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="تعديل"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void runMutation(
                          () => deleteFirestoreDoc('branches', branch.id),
                          'تم حذف الفرع'
                        )
                      }
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-red-200 dark:border-red-900 text-red-600 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: WALLETS */}
        {activeTab === 'wallets' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">إدارة المحافظ الإلكترونية</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  تعديل أرقام المحافظ أو عناوين InstaPay وإظهار اسم صاحب المحفظة
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingWallet({
                    id: `wallet-${Date.now()}`,
                    provider: 'vodafone',
                    providerName: 'Vodafone Cash',
                    identifier: '',
                    ownerName: 'أحمد محمد خيري شاهين',
                    showOwnerName: true,
                    note: '',
                    visible: true,
                    order: wallets.length,
                  })
                }
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                style={{ backgroundColor: draftConfig.primaryColor }}
              >
                <Plus className="w-4 h-4" />
                <span>إضافة محفظة جديدة</span>
              </button>
            </div>

            {editingWallet && (
              <WalletForm
                initial={editingWallet}
                primaryColor={draftConfig.primaryColor}
                onCancel={() => setEditingWallet(null)}
                onSave={(item) => {
                  setEditingWallet(null);
                  void runMutation(
                    () => saveWalletToFirestore(item),
                    'تم حفظ بيانات المحفظة بنجاح'
                  );
                }}
              />
            )}

            <div className="space-y-2.5">
              {wallets.map((wallet, idx) => (
                <div
                  key={wallet.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <WalletProviderMark provider={wallet.provider} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">
                        {wallet.providerName}{' '}
                        {!wallet.visible && <span className="text-xs text-slate-400">(مخفي)</span>}
                      </div>
                      <div dir="ltr" className="text-xs font-mono-nums text-slate-600 dark:text-slate-400 truncate">
                        {wallet.identifier}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        void runMutation(
                          () => saveWalletToFirestore({ ...wallet, visible: !wallet.visible }),
                          wallet.visible ? 'تم إخفاء المحفظة' : 'تم إظهار المحفظة'
                        )
                      }
                      className="min-h-[38px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1"
                    >
                      {wallet.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{wallet.visible ? 'ظاهر' : 'مخفي'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() =>
                        void runMutation(
                          () =>
                            reorderFirestoreDocs(
                              'wallets',
                              moveArrayItem(wallets, idx, -1)
                            ),
                          'تم تحديث ترتيب المحافظ'
                        )
                      }
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30"
                      aria-label="تحريك لأعلى"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === wallets.length - 1}
                      onClick={() =>
                        void runMutation(
                          () =>
                            reorderFirestoreDocs(
                              'wallets',
                              moveArrayItem(wallets, idx, 1)
                            ),
                          'تم تحديث ترتيب المحافظ'
                        )
                      }
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30"
                      aria-label="تحريك لأسفل"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingWallet(wallet)}
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="تعديل"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void runMutation(
                          () => deleteFirestoreDoc('wallets', wallet.id),
                          'تم حذف المحفظة'
                        )
                      }
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-red-200 dark:border-red-900 text-red-600 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: BANK ACCOUNTS */}
        {activeTab === 'banks' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">إدارة الحسابات البنكية</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  إضافة عدد غير محدود من الحسابات البنكية وتعديل أرقام الحسابات والـ IBAN والعملة
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingBank({
                    id: `bank-${Date.now()}`,
                    bankName: '',
                    accountHolder: 'أحمد محمد خيري شاهين',
                    accountNumber: '',
                    iban: '',
                    currency: 'EGP - جنيه مصري',
                    branchName: '',
                    visible: true,
                    order: bankAccounts.length,
                  })
                }
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                style={{ backgroundColor: draftConfig.primaryColor }}
              >
                <Plus className="w-4 h-4" />
                <span>إضافة حساب بنكي</span>
              </button>
            </div>

            {editingBank && (
              <BankForm
                initial={editingBank}
                primaryColor={draftConfig.primaryColor}
                onCancel={() => setEditingBank(null)}
                onSave={(item) => {
                  setEditingBank(null);
                  void runMutation(
                    () => saveBankToFirestore(item),
                    'تم حفظ الحساب البنكي بنجاح'
                  );
                }}
              />
            )}

            {bankAccounts.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
                لا توجد حسابات بنكية مضافة حاليًا.
              </div>
            ) : (
              <div className="space-y-2.5">
                {bankAccounts.map((bank, idx) => (
                  <div
                    key={bank.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">
                          {bank.bankName}{' '}
                          {!bank.visible && <span className="text-xs text-slate-400">(مخفي)</span>}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {bank.accountHolder} · {bank.currency}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          void runMutation(
                            () => saveBankToFirestore({ ...bank, visible: !bank.visible }),
                            bank.visible ? 'تم إخفاء الحساب البنكي' : 'تم إظهار الحساب البنكي'
                          )
                        }
                        className="min-h-[38px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1"
                      >
                        {bank.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{bank.visible ? 'ظاهر' : 'مخفي'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() =>
                          void runMutation(
                            () =>
                              reorderFirestoreDocs(
                                'bankAccounts',
                                moveArrayItem(bankAccounts, idx, -1)
                              ),
                            'تم تحديث ترتيب الحسابات البنكية'
                          )
                        }
                        className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30"
                        aria-label="تحريك لأعلى"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === bankAccounts.length - 1}
                        onClick={() =>
                          void runMutation(
                            () =>
                              reorderFirestoreDocs(
                                'bankAccounts',
                                moveArrayItem(bankAccounts, idx, 1)
                              ),
                            'تم تحديث ترتيب الحسابات البنكية'
                          )
                        }
                        className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30"
                        aria-label="تحريك لأسفل"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingBank(bank)}
                        className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="تعديل"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void runMutation(
                            () => deleteFirestoreDoc('bankAccounts', bank.id),
                            'تم حذف الحساب البنكي'
                          )
                        }
                        className="min-h-[38px] min-w-[38px] rounded-lg border border-red-200 dark:border-red-900 text-red-600 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Status Toast */}
      {statusMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-1/2 translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap ${
            statusMessage.type === 'err'
              ? 'bg-red-600 text-white'
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
          }`}
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
}

function SocialForm({
  initial,
  primaryColor,
  onSave,
  onCancel,
}: {
  initial: SocialLink;
  primaryColor: string;
  onSave: (item: SocialLink) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SocialLink>(initial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">المنصة</label>
          <select
            value={form.platform}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, platform: e.target.value as SocialPlatform }))
            }
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          >
            {(Object.keys(PLATFORM_LABELS) as SocialPlatform[]).map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">العنوان الظاهر على الزر</label>
          <input
            type="text"
            required
            maxLength={80}
            value={form.label}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">الرابط المباشر (URL)</label>
          <input
            type="url"
            dir="ltr"
            required
            maxLength={500}
            value={form.url}
            onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-nums"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">وصف مختصر (اختياري)</label>
          <input
            type="text"
            maxLength={120}
            value={form.subtitle}
            onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[40px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="min-h-[40px] px-5 rounded-xl text-xs font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          حفظ الرابط
        </button>
      </div>
    </form>
  );
}

function BranchForm({
  initial,
  primaryColor,
  onSave,
  onCancel,
}: {
  initial: BranchLocation;
  primaryColor: string;
  onSave: (item: BranchLocation) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<BranchLocation>(initial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">اسم الفرع</label>
          <input
            type="text"
            required
            maxLength={120}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">رابط الموقع على خرائط جوجل</label>
          <input
            type="url"
            dir="ltr"
            required
            maxLength={500}
            value={form.mapUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, mapUrl: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-nums"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold">العنوان بالتفصيل</label>
        <input
          type="text"
          required
          maxLength={250}
          value={form.address}
          onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[40px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="min-h-[40px] px-5 rounded-xl text-xs font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          حفظ الفرع
        </button>
      </div>
    </form>
  );
}

function WalletForm({
  initial,
  primaryColor,
  onSave,
  onCancel,
}: {
  initial: WalletAccount;
  primaryColor: string;
  onSave: (item: WalletAccount) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<WalletAccount>(initial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">نوع المحفظة</label>
          <select
            value={form.provider}
            onChange={(e) => {
              const provider = e.target.value as WalletProvider;
              setForm((prev) => ({
                ...prev,
                provider,
                providerName: WALLET_PROVIDER_LABELS[provider],
              }));
            }}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          >
            {(Object.keys(WALLET_PROVIDER_LABELS) as WalletProvider[]).map((p) => (
              <option key={p} value={p}>
                {WALLET_PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">الاسم الظاهر للخدمة</label>
          <input
            type="text"
            required
            maxLength={80}
            value={form.providerName}
            onChange={(e) => setForm((prev) => ({ ...prev, providerName: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">رقم المحفظة أو عنوان التحويل</label>
          <input
            type="text"
            dir="ltr"
            required
            maxLength={120}
            value={form.identifier}
            onChange={(e) => setForm((prev) => ({ ...prev, identifier: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-nums"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">اسم صاحب المحفظة (المستفيد)</label>
          <input
            type="text"
            maxLength={120}
            value={form.ownerName}
            onChange={(e) => setForm((prev) => ({ ...prev, ownerName: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold">ملاحظة إضافية (اختياري)</label>
        <input
          type="text"
          maxLength={200}
          value={form.note}
          onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
          className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
        <input
          type="checkbox"
          checked={form.showOwnerName}
          onChange={(e) => setForm((prev) => ({ ...prev, showOwnerName: e.target.checked }))}
          className="w-4 h-4 accent-emerald-600"
        />
        <span>إظهار اسم صاحب المحفظة للعملاء في البطاقة</span>
      </label>

      <div className="flex justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[40px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="min-h-[40px] px-5 rounded-xl text-xs font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          حفظ المحفظة
        </button>
      </div>
    </form>
  );
}

function BankForm({
  initial,
  primaryColor,
  onSave,
  onCancel,
}: {
  initial: BankAccount;
  primaryColor: string;
  onSave: (item: BankAccount) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<BankAccount>(initial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">اسم البنك</label>
          <input
            type="text"
            required
            maxLength={120}
            value={form.bankName}
            onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">اسم صاحب الحساب</label>
          <input
            type="text"
            required
            maxLength={120}
            value={form.accountHolder}
            onChange={(e) => setForm((prev) => ({ ...prev, accountHolder: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">رقم الحساب</label>
          <input
            type="text"
            dir="ltr"
            required
            maxLength={80}
            value={form.accountNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-nums"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">رقم IBAN (اختياري)</label>
          <input
            type="text"
            dir="ltr"
            maxLength={80}
            value={form.iban}
            onChange={(e) => setForm((prev) => ({ ...prev, iban: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-nums"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">نوع العملة</label>
          <input
            type="text"
            required
            maxLength={20}
            value={form.currency}
            onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">اسم الفرع (اختياري)</label>
          <input
            type="text"
            maxLength={120}
            value={form.branchName}
            onChange={(e) => setForm((prev) => ({ ...prev, branchName: e.target.value }))}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[40px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="min-h-[40px] px-5 rounded-xl text-xs font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          حفظ الحساب
        </button>
      </div>
    </form>
  );
}
