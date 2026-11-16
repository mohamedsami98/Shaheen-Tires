import {
  BankAccount,
  BranchLocation,
  SiteConfig,
  SocialLink,
  WalletAccount,
} from '../types/hub';

export const DEFAULT_LOGO_PATH =
  './assets/aistudio/WhatsApp_Image_2026-11-16_at_12.42.38_PM_91f3b548.jpeg';
export const DEFAULT_COVER_PATH = './src/assets/images/shaheen_tires_cover_1794826271761.jpg';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: 'شاهين للإطارات والبطاريات | SHAHEEN',
  brandTagline:
    'البوابة الرسمية لشركة شاهين للإطارات والبطاريات — تواصل مباشر، مواقع الفروع ومراكز الصيانة بطنطا، وطرق الدفع المعتمدة.',
  logoUrl: DEFAULT_LOGO_PATH,
  primaryColor: '#DC2626',
  surfaceMode: 'light',
  accentStyle: 'custom',
  whatsappFloatNumber: '201553060666',
  whatsappFloatEnabled: true,
  paymentInstructions:
    'بعد إتمام التحويل، يرجى إرسال صورة إيصال الدفع أو لقطة الشاشة عبر الواتساب (01553060666) مرفقة باسم العميل ورقم الطلب لتأكيد الحجز فورًا.',
  beneficiaryWarning:
    'تنبيه هام: يرجى التأكد من مطابقة اسم المستفيد (أحمد محمد خيري شاهين) الظاهر على شاشة التحويل قبل تأكيد إرسال أي مبلغ مالي.',
  sectionOrder: ['social', 'branches', 'wallets', 'banks'],
  sectionVisibility: {
    social: true,
    branches: true,
    wallets: true,
    banks: false,
  },
};

export const DEFAULT_BRANCHES: BranchLocation[] = [
  {
    id: 'branch-main-galaa',
    name: 'الفرع الرئيسي',
    address: '6 شارع الجلاء بجوار رنين، طنطا',
    mapUrl: 'https://maps.app.goo.gl/beaPdnj9NbAUsfi68',
    visible: true,
    order: 0,
  },
  {
    id: 'branch-showroom-farouk',
    name: 'المعرض ومركز الصيانة',
    address: 'أمام كوبري فاروق، مدخل ميت حبيش، طنطا',
    mapUrl: 'https://goo.gl/maps/saVh4sz7X4FvUesr8',
    visible: true,
    order: 1,
  },
];

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'social-whatsapp',
    platform: 'whatsapp',
    label: 'واتساب شاهين للإطارات والبطاريات',
    url: 'https://wa.me/201553060666',
    subtitle: '01553060666 — للاستفسار والأسعار وإرسال إيصالات الدفع',
    visible: true,
    order: 0,
  },
  {
    id: 'social-website',
    platform: 'website',
    label: 'الموقع الرسمي لشاهين للإطارات',
    url: 'https://www.shaheentire.com/',
    subtitle: 'shaheentire.com — تصفح جميع الإطارات والبطاريات',
    visible: true,
    order: 1,
  },
  {
    id: 'social-facebook-shaheen',
    platform: 'facebook',
    label: 'صفحة شاهين للإطارات (فيسبوك)',
    url: 'https://www.facebook.com/shaheentyres',
    subtitle: 'أحدث العروض والأخبار على Facebook',
    visible: true,
    order: 2,
  },
  {
    id: 'social-facebook-boto',
    platform: 'facebook',
    label: 'صفحة بوتو للإطارات (فيسبوك)',
    url: 'https://www.facebook.com/profile.php?id=61589128182350',
    subtitle: 'BOTO Tyres — الصفحة الرسمية على فيسبوك',
    visible: true,
    order: 3,
  },
  {
    id: 'social-instagram-shaheen',
    platform: 'instagram',
    label: 'إنستغرام شاهين للإطارات',
    url: 'https://www.instagram.com/shaheentires?exln=ODZhNXhuYXF5dDho',
    subtitle: '@shaheentires',
    visible: true,
    order: 4,
  },
  {
    id: 'social-instagram-boto',
    platform: 'instagram',
    label: 'إنستغرام بوتو للإطارات مصر',
    url: 'https://www.instagram.com/boto.tyres.egypt?vrfl=N3BuMm84Mjd5OWp1',
    subtitle: '@boto.tyres.egypt',
    visible: true,
    order: 5,
  },
  {
    id: 'social-tiktok-shaheen',
    platform: 'tiktok',
    label: 'تيك توك شاهين للإطارات',
    url: 'https://www.tiktok.com/@shaheentires?_r=1&_t=ZS-9BS0wiulq56',
    subtitle: '@shaheentires — فيديوهات وعروض المركز',
    visible: true,
    order: 6,
  },
];

export const DEFAULT_WALLETS: WalletAccount[] = [
  {
    id: 'wallet-vodafone',
    provider: 'vodafone',
    providerName: 'Vodafone Cash',
    identifier: '01001768654',
    ownerName: 'أحمد محمد خيري شاهين',
    showOwnerName: true,
    note: 'رقم التحويل الرسمي عبر فودافون كاش — يرجى إرسال صورة التحويل على واتساب 01553060666',
    visible: true,
    order: 0,
  },
  {
    id: 'wallet-instapay',
    provider: 'instapay',
    providerName: 'InstaPay',
    identifier: 'shaheen-demo@instapay',
    ownerName: 'أحمد محمد خيري شاهين',
    showOwnerName: true,
    note: 'عنوان دفع تجريبي — استبدله بحساب إنستاباي الفعلي من لوحة التحكم',
    visible: true,
    order: 1,
  },
];

export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [];
