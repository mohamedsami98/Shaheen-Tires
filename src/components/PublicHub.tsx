import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpLeft,
  Building2,
  Check,
  Copy,
  Info,
  Landmark,
  MapPin,
  MessageCircle,
  Navigation,
  QrCode,
  Share2,
  Smartphone,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DEFAULT_COVER_PATH, DEFAULT_LOGO_PATH } from '../data/defaultData';
import {
  BankAccount,
  BranchLocation,
  SECTION_LABELS,
  SiteConfig,
  SocialLink,
  WalletAccount,
} from '../types/hub';
import {
  getPlatformBrandColor,
  SocialPlatformIcon,
  WalletProviderMark,
} from './BrandIcons';
import { QRModal } from './QRModal';

interface PublicHubProps {
  config: SiteConfig;
  socialLinks: SocialLink[];
  branches: BranchLocation[];
  wallets: WalletAccount[];
  bankAccounts: BankAccount[];
}

export function PublicHub({
  config,
  socialLinks,
  branches,
  wallets,
  bankAccounts,
}: PublicHubProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}`;
  }, []);

  const visibleSocial = useMemo(
    () => socialLinks.filter((item) => item.visible),
    [socialLinks]
  );
  const visibleBranches = useMemo(
    () => branches.filter((item) => item.visible),
    [branches]
  );
  const visibleWallets = useMemo(
    () => wallets.filter((item) => item.visible),
    [wallets]
  );
  const visibleBanks = useMemo(
    () => bankAccounts.filter((item) => item.visible),
    [bankAccounts]
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 2600);
  };

  const handleCopy = async (text: string, id: string, customToast?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast(customToast || 'تم نسخ بيانات التحويل بنجاح');
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1800);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      showToast(customToast || 'تم نسخ بيانات التحويل بنجاح');
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1800);
    }
  };

  const handleSharePage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: config.brandName,
          text: config.brandTagline,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    await handleCopy(shareUrl, 'page-share-link', 'تم نسخ رابط الصفحة بنجاح');
  };

  const whatsappHref = useMemo(() => {
    const digits = (config.whatsappFloatNumber || '').replace(/[^\d]/g, '');
    if (!digits) return '';
    const text = encodeURIComponent(`مرحبًا، أتواصل معكم عبر صفحة ${config.brandName}`);
    return `https://wa.me/${digits}?text=${text}`;
  }, [config.whatsappFloatNumber, config.brandName]);

  const activeSections = useMemo(() => {
    return (config.sectionOrder || ['social', 'branches', 'wallets', 'banks']).filter(
      (key) => config.sectionVisibility?.[key] !== false
    );
  }, [config.sectionOrder, config.sectionVisibility]);

  const renderSocialSection = () => {
    if (config.sectionVisibility?.social === false || visibleSocial.length === 0) return null;
    return (
      <section
        id="section-social"
        key="social"
        aria-labelledby="heading-social"
        className="space-y-4"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2
              id="heading-social"
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100"
            >
              {SECTION_LABELS.social}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              اضغط على أي قناة للانتقال مباشرة إلى الحساب الرسمي
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-nums whitespace-nowrap shrink-0">
            {visibleSocial.length} قنوات
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visibleSocial.map((link, index) => {
            const brandColor = getPlatformBrandColor(link.platform);
            return (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.25) }}
                className="group min-h-[68px] flex items-center justify-between gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: config.primaryColor }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105"
                    style={{
                      backgroundColor: `${brandColor}14`,
                      color: brandColor,
                    }}
                  >
                    <SocialPlatformIcon platform={link.platform} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {link.label}
                    </div>
                    {link.subtitle && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {link.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <ArrowUpLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
              </motion.a>
            );
          })}
        </div>
      </section>
    );
  };

  const renderBranchesSection = () => {
    if (config.sectionVisibility?.branches === false || visibleBranches.length === 0) return null;
    return (
      <section
        id="section-branches"
        key="branches"
        aria-labelledby="heading-branches"
        className="space-y-4"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2
              id="heading-branches"
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100"
            >
              {SECTION_LABELS.branches}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              افتح موقع الفرع مباشرة على خرائط جوجل (Google Maps) للوصول السريع
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-nums whitespace-nowrap shrink-0">
            {visibleBranches.length} فروع
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleBranches.map((branch, index) => {
            const copyKey = `branch-addr-${branch.id}`;
            const isCopied = copiedId === copyKey;
            return (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.25) }}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${config.primaryColor}14`,
                      color: config.primaryColor,
                    }}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {branch.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                      {branch.address}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={branch.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 whitespace-nowrap"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>الاتجاهات على الخريطة</span>
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${branch.name}: ${branch.address}`,
                        copyKey,
                        'تم نسخ عنوان الفرع بنجاح'
                      )
                    }
                    className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ العنوان</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderWalletsSection = () => {
    if (config.sectionVisibility?.wallets === false || visibleWallets.length === 0) return null;
    return (
      <section
        id="section-wallets"
        key="wallets"
        aria-labelledby="heading-wallets"
        className="space-y-4"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2
              id="heading-wallets"
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100"
            >
              {SECTION_LABELS.wallets}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              انسخ رقم المحفظة أو عنوان الدفع الفوري بضغطة واحدة
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-nums whitespace-nowrap shrink-0">
            {visibleWallets.length} طرق
          </span>
        </div>

        {(config.beneficiaryWarning || config.paymentInstructions) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {config.beneficiaryWarning && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm leading-relaxed text-amber-950 dark:text-amber-200">
                  {config.beneficiaryWarning}
                </p>
              </div>
            )}
            {config.paymentInstructions && (
              <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <Info
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: config.primaryColor }}
                />
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {config.paymentInstructions}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleWallets.map((wallet, index) => {
            const copyKey = `wallet-${wallet.id}`;
            const isCopied = copiedId === copyKey;
            return (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.25) }}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <WalletProviderMark provider={wallet.provider} />
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                        {wallet.providerName}
                      </h3>
                      {wallet.showOwnerName && wallet.ownerName && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                          المستفيد: {wallet.ownerName}
                        </p>
                      )}
                    </div>
                  </div>
                  <Smartphone className="w-4 h-4 text-slate-400 shrink-0 mt-1" aria-hidden="true" />
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800">
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      رقم / عنوان التحويل
                    </div>
                    <div
                      dir="ltr"
                      className="text-sm sm:text-base font-semibold font-mono-nums text-slate-900 dark:text-slate-100 truncate mt-0.5 select-all"
                    >
                      {wallet.identifier}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(wallet.identifier, copyKey)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-90 active:scale-[0.98] whitespace-nowrap"
                    style={{
                      backgroundColor: isCopied ? '#15803D' : config.primaryColor,
                    }}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>

                {wallet.paymentUrl && (
                  <a
                    href={wallet.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:scale-[0.99]"
                    style={{ backgroundColor: '#5B2D90' }}
                  >
                    <span>الدفع المباشر عبر {wallet.providerName}</span>
                    <ArrowUpLeft className="w-4 h-4 shrink-0" />
                  </a>
                )}

                {wallet.note && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {wallet.note}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderBanksSection = () => {
    if (config.sectionVisibility?.banks === false || visibleBanks.length === 0) return null;
    return (
      <section
        id="section-banks"
        key="banks"
        aria-labelledby="heading-banks"
        className="space-y-4"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2
              id="heading-banks"
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100"
            >
              الحسابات البنكية الرسمية
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              بيانات استقبال التحويلات البنكية المحلية والدولية فقط
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-nums whitespace-nowrap shrink-0">
            {visibleBanks.length} حسابات
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleBanks.map((bank, index) => {
            const accKey = `bank-acc-${bank.id}`;
            const ibanKey = `bank-iban-${bank.id}`;
            const isAccCopied = copiedId === accKey;
            const isIbanCopied = copiedId === ibanKey;

            return (
              <motion.div
                key={bank.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.25) }}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${config.primaryColor}14`,
                        color: config.primaryColor,
                      }}
                    >
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {bank.bankName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          العملة: {bank.currency}
                        </span>
                        {bank.branchName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{bank.branchName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">
                      اسم صاحب الحساب
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-left">
                      {bank.accountHolder}
                    </span>
                  </div>

                  {/* Account Number */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        رقم الحساب
                      </div>
                      <div
                        dir="ltr"
                        className="text-sm font-semibold font-mono-nums text-slate-900 dark:text-slate-100 truncate mt-0.5 select-all"
                      >
                        {bank.accountNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bank.accountNumber, accKey)}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-90 whitespace-nowrap"
                      style={{
                        backgroundColor: isAccCopied ? '#15803D' : config.primaryColor,
                      }}
                    >
                      {isAccCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ رقم الحساب</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Optional IBAN */}
                  {bank.iban && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          رقم الآيبان (IBAN)
                        </div>
                        <div
                          dir="ltr"
                          className="text-xs sm:text-sm font-semibold font-mono-nums text-slate-900 dark:text-slate-100 truncate mt-0.5 select-all"
                        >
                          {bank.iban}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(bank.iban, ibanKey)}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 shrink-0 transition-colors whitespace-nowrap"
                      >
                        {isIbanCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ IBAN</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 truncate max-w-[185px] sm:max-w-[260px]"
          >
            {config.brandName}
          </a>

          <nav
            aria-label="أقسام الصفحة"
            className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            {activeSections.map((sec) => (
              <a
                key={sec}
                href={`#section-${sec}`}
                className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {SECTION_LABELS[sec]}
              </a>
            ))}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleSharePage}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5 transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
              style={{ backgroundColor: config.primaryColor }}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة الصفحة</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10 pb-24">
        {/* Hero Brand Card */}
        <section
          aria-label="التعريف بالمشروع"
          className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm"
        >
          {/* Architectural Cover Header */}
          <div className="relative h-44 sm:h-64 w-full bg-[#EFEFEF] overflow-hidden">
            {!coverError ? (
              <img
                src={DEFAULT_COVER_PATH}
                alt={`غلاف ${config.brandName}`}
                referrerPolicy="no-referrer"
                onError={() => setCoverError(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${config.primaryColor} 0%, #0F172A 100%)`,
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
          </div>

          {/* Brand Identity Content */}
          <div className="px-5 sm:px-8 pb-6 sm:pb-8">
            <div className="relative -mt-12 sm:-mt-14 mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="w-44 h-24 sm:w-52 sm:h-28 rounded-2xl bg-[#F5F5F5] p-2 border border-slate-200 dark:border-slate-700 shadow-md shrink-0 overflow-hidden flex items-center justify-center">
                {!logoError ? (
                  <img
                    src={config.logoUrl || DEFAULT_LOGO_PATH}
                    alt={`شعار ${config.brandName}`}
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <Building2 className="w-10 h-10" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsQrOpen(true)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <QrCode className="w-4 h-4" />
                  <span>عرض رمز QR</span>
                </button>
                <button
                  type="button"
                  onClick={handleSharePage}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center gap-2 transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة الرابط</span>
                </button>
              </div>
            </div>

            <div className="max-w-3xl">
              <h1
                className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                {config.brandName}
              </h1>
              {config.brandTagline && (
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {config.brandTagline}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Dynamically Ordered Sections */}
        <div className="space-y-12">
          {activeSections.map((key) => {
            if (key === 'social') return renderSocialSection();
            if (key === 'branches') return renderBranchesSection();
            if (key === 'wallets') return renderWalletsSection();
            if (key === 'banks') return renderBanksSection();
            return null;
          })}
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-center text-center text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} {config.brandName}. جميع الحقوق محفوظة.</p>
        </div>
      </footer>

      {/* Floating WhatsApp Direct Contact Button */}
      {config.whatsappFloatEnabled && whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصل مباشر عبر واتساب"
          className="fixed bottom-5 left-5 z-40 h-13 px-4 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs sm:text-sm font-bold whitespace-nowrap hidden sm:inline">
            تواصل عبر واتساب
          </span>
        </a>
      )}

      {/* Copy Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 sm:bottom-6 right-1/2 translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs sm:text-sm font-semibold shadow-xl flex items-center gap-2 whitespace-nowrap"
        >
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* QR Code Modal */}
      <QRModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={shareUrl}
        brandName={config.brandName}
        primaryColor={config.primaryColor}
        onCopyLink={() =>
          handleCopy(shareUrl, 'qr-share-link', 'تم نسخ رابط الصفحة بنجاح')
        }
        copied={copiedId === 'qr-share-link'}
      />
    </div>
  );
}
