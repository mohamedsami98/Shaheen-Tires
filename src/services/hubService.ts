import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_BANK_ACCOUNTS,
  DEFAULT_BRANCHES,
  DEFAULT_LOGO_PATH,
  DEFAULT_SITE_CONFIG,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_WALLETS,
} from '../data/defaultData';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  BankAccount,
  BranchLocation,
  SectionKey,
  SiteConfig,
  SocialLink,
  WalletAccount,
} from '../types/hub';

const BOOTSTRAPPED_ADMIN_EMAILS = [
  'shaheeninfo96@gmail.com',
  'sandidodo80@gmail.com',
];

function sanitizeString(value: string, maxLength: number): string {
  return (value ?? '').trim().slice(0, maxLength);
}

function sanitizeId(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned || `item-${Date.now()}`;
}

export async function verifyAdminAccess(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (BOOTSTRAPPED_ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    return true;
  }
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists() && adminDoc.data()?.role === 'admin';
  } catch {
    return false;
  }
}

export function subscribeSiteConfig(
  onData: (config: SiteConfig | null, existsInDb: boolean) => void
) {
  const ref = doc(db, 'siteConfig', 'main');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const raw = snap.data() as SiteConfig;
        const normalizedOrder: SectionKey[] = Array.isArray(raw.sectionOrder)
          ? ([
              ...raw.sectionOrder,
              ...(['social', 'branches', 'wallets', 'banks'] as SectionKey[]).filter(
                (k) => !raw.sectionOrder.includes(k)
              ),
            ].slice(0, 4) as SectionKey[])
          : ['social', 'branches', 'wallets', 'banks'];

        onData(
          {
            ...DEFAULT_SITE_CONFIG,
            ...raw,
            sectionOrder: normalizedOrder,
            sectionVisibility: {
              social: raw.sectionVisibility?.social ?? true,
              branches: raw.sectionVisibility?.branches ?? true,
              wallets: raw.sectionVisibility?.wallets ?? true,
              banks: raw.sectionVisibility?.banks ?? true,
            },
          },
          true
        );
      } else {
        onData(null, false);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'siteConfig/main');
    }
  );
}

export function subscribeSocialLinks(
  includeHidden: boolean,
  onData: (links: SocialLink[]) => void
) {
  const path = 'socialLinks';
  const q = includeHidden
    ? query(collection(db, path))
    : query(collection(db, path), where('visible', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ ...(d.data() as Omit<SocialLink, 'id'>), id: d.id }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeBranches(
  includeHidden: boolean,
  onData: (branches: BranchLocation[]) => void
) {
  const path = 'branches';
  const q = includeHidden
    ? query(collection(db, path))
    : query(collection(db, path), where('visible', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ ...(d.data() as Omit<BranchLocation, 'id'>), id: d.id }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeWallets(
  includeHidden: boolean,
  onData: (wallets: WalletAccount[]) => void
) {
  const path = 'wallets';
  const q = includeHidden
    ? query(collection(db, path))
    : query(collection(db, path), where('visible', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ ...(d.data() as Omit<WalletAccount, 'id'>), id: d.id }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeBankAccounts(
  includeHidden: boolean,
  onData: (banks: BankAccount[]) => void
) {
  const path = 'bankAccounts';
  const q = includeHidden
    ? query(collection(db, path))
    : query(collection(db, path), where('visible', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ ...(d.data() as Omit<BankAccount, 'id'>), id: d.id }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

function buildConfigPayload(config: SiteConfig, isCreate: boolean) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Unauthorized');

  const allKeys: SectionKey[] = ['social', 'branches', 'wallets', 'banks'];
  const validOrder: SectionKey[] =
    config.sectionOrder.length === 4 &&
    allKeys.every((k) => config.sectionOrder.includes(k))
      ? config.sectionOrder
      : allKeys;

  const colorMatch = /^#[0-9a-fA-F]{6}$/.test(config.primaryColor)
    ? config.primaryColor
    : '#DC2626';

  const base = {
    brandName: sanitizeString(config.brandName, 120) || 'شاهين للإطارات والبطاريات',
    brandTagline: sanitizeString(config.brandTagline, 300),
    logoUrl: (config.logoUrl || DEFAULT_LOGO_PATH).slice(0, 145000),
    primaryColor: colorMatch,
    surfaceMode: config.surfaceMode === 'dark' ? 'dark' : 'light',
    accentStyle: config.accentStyle || 'custom',
    whatsappFloatNumber: sanitizeString(config.whatsappFloatNumber, 30),
    whatsappFloatEnabled: Boolean(config.whatsappFloatEnabled),
    paymentInstructions: sanitizeString(config.paymentInstructions, 1200),
    beneficiaryWarning: sanitizeString(config.beneficiaryWarning, 400),
    sectionOrder: validOrder,
    sectionVisibility: {
      social: Boolean(config.sectionVisibility?.social ?? true),
      branches: Boolean(config.sectionVisibility?.branches ?? true),
      wallets: Boolean(config.sectionVisibility?.wallets ?? true),
      banks: Boolean(config.sectionVisibility?.banks ?? true),
    },
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };

  if (isCreate) {
    return { ...base, createdAt: serverTimestamp() };
  }
  return base;
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  const ref = doc(db, 'siteConfig', 'main');
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, buildConfigPayload(config, false));
    } else {
      await setDoc(ref, buildConfigPayload(config, true));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'siteConfig/main');
  }
}

export async function upsertSocialLink(link: SocialLink): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Unauthorized');
  const id = sanitizeId(link.id);
  const ref = doc(db, 'socialLinks', id);

  try {
    const existing = await getDoc(ref);
    const payload = {
      platform: link.platform,
      label: sanitizeString(link.label, 80) || 'رابط تواصل',
      url: sanitizeString(link.url, 500) || 'https://example.com',
      subtitle: sanitizeString(link.subtitle, 120),
      visible: Boolean(link.visible),
      order: Math.max(0, Math.min(1000, Number(link.order) || 0)),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    };
    if (existing.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `socialLinks/${id}`);
  }
}

export async function deleteSocialLink(id: string): Promise<void> {
  const cleanId = sanitizeId(id);
  try {
    await deleteDoc(doc(db, 'socialLinks', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `socialLinks/${cleanId}`);
  }
}

export async function upsertBranch(branch: BranchLocation): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Unauthorized');
  const id = sanitizeId(branch.id);
  const ref = doc(db, 'branches', id);

  try {
    const existing = await getDoc(ref);
    const payload = {
      name: sanitizeString(branch.name, 120) || 'فرع جديد',
      address: sanitizeString(branch.address, 250) || 'العنوان',
      mapUrl: sanitizeString(branch.mapUrl, 500) || 'https://maps.google.com',
      visible: Boolean(branch.visible),
      order: Math.max(0, Math.min(1000, Number(branch.order) || 0)),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    };
    if (existing.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `branches/${id}`);
  }
}

export async function deleteBranch(id: string): Promise<void> {
  const cleanId = sanitizeId(id);
  try {
    await deleteDoc(doc(db, 'branches', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `branches/${cleanId}`);
  }
}

export async function upsertWallet(wallet: WalletAccount): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Unauthorized');
  const id = sanitizeId(wallet.id);
  const ref = doc(db, 'wallets', id);

  try {
    const existing = await getDoc(ref);
    const payload = {
      provider: wallet.provider,
      providerName: sanitizeString(wallet.providerName, 80) || 'محفظة إلكترونية',
      identifier: sanitizeString(wallet.identifier, 120) || '01000000000',
      ownerName: sanitizeString(wallet.ownerName, 120),
      showOwnerName: Boolean(wallet.showOwnerName),
      note: sanitizeString(wallet.note, 200),
      visible: Boolean(wallet.visible),
      order: Math.max(0, Math.min(1000, Number(wallet.order) || 0)),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    };
    if (existing.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `wallets/${id}`);
  }
}

export async function deleteWallet(id: string): Promise<void> {
  const cleanId = sanitizeId(id);
  try {
    await deleteDoc(doc(db, 'wallets', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `wallets/${cleanId}`);
  }
}

export async function upsertBankAccount(bank: BankAccount): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Unauthorized');
  const id = sanitizeId(bank.id);
  const ref = doc(db, 'bankAccounts', id);

  try {
    const existing = await getDoc(ref);
    const payload = {
      bankName: sanitizeString(bank.bankName, 120) || 'بنك تجاري',
      accountHolder: sanitizeString(bank.accountHolder, 120) || 'اسم صاحب الحساب',
      accountNumber: sanitizeString(bank.accountNumber, 80) || '0000000000',
      iban: sanitizeString(bank.iban, 80),
      currency: sanitizeString(bank.currency, 20) || 'EGP',
      branchName: sanitizeString(bank.branchName, 120),
      visible: Boolean(bank.visible),
      order: Math.max(0, Math.min(1000, Number(bank.order) || 0)),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    };
    if (existing.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `bankAccounts/${id}`);
  }
}

export async function deleteBankAccount(id: string): Promise<void> {
  const cleanId = sanitizeId(id);
  try {
    await deleteDoc(doc(db, 'bankAccounts', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `bankAccounts/${cleanId}`);
  }
}

export async function updateCollectionOrder(
  collectionName: 'socialLinks' | 'branches' | 'wallets' | 'bankAccounts',
  orderedIds: string[]
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Unauthorized');

  const batch = writeBatch(db);
  orderedIds.forEach((id, idx) => {
    const cleanId = sanitizeId(id);
    batch.update(doc(db, collectionName, cleanId), {
      order: idx,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, collectionName);
  }
}

export async function seedDemoDataToFirestore(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Unauthorized');

  try {
    const batch = writeBatch(db);
    const configRef = doc(db, 'siteConfig', 'main');
    const existingConfig = await getDoc(configRef);
    if (existingConfig.exists()) {
      batch.update(configRef, buildConfigPayload(DEFAULT_SITE_CONFIG, false));
    } else {
      batch.set(configRef, buildConfigPayload(DEFAULT_SITE_CONFIG, true));
    }

    for (const link of DEFAULT_SOCIAL_LINKS) {
      const ref = doc(db, 'socialLinks', link.id);
      const snap = await getDoc(ref);
      const base = {
        platform: link.platform,
        label: link.label,
        url: link.url,
        subtitle: link.subtitle,
        visible: link.visible,
        order: link.order,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      };
      if (snap.exists()) {
        batch.update(ref, base);
      } else {
        batch.set(ref, { ...base, createdAt: serverTimestamp() });
      }
    }

    for (const branch of DEFAULT_BRANCHES) {
      const ref = doc(db, 'branches', branch.id);
      const snap = await getDoc(ref);
      const base = {
        name: branch.name,
        address: branch.address,
        mapUrl: branch.mapUrl,
        visible: branch.visible,
        order: branch.order,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      };
      if (snap.exists()) {
        batch.update(ref, base);
      } else {
        batch.set(ref, { ...base, createdAt: serverTimestamp() });
      }
    }

    for (const wallet of DEFAULT_WALLETS) {
      const ref = doc(db, 'wallets', wallet.id);
      const snap = await getDoc(ref);
      const base = {
        provider: wallet.provider,
        providerName: wallet.providerName,
        identifier: wallet.identifier,
        ownerName: wallet.ownerName,
        showOwnerName: wallet.showOwnerName,
        note: wallet.note,
        visible: wallet.visible,
        order: wallet.order,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      };
      if (snap.exists()) {
        batch.update(ref, base);
      } else {
        batch.set(ref, { ...base, createdAt: serverTimestamp() });
      }
    }

    for (const bank of DEFAULT_BANK_ACCOUNTS) {
      const ref = doc(db, 'bankAccounts', bank.id);
      const snap = await getDoc(ref);
      const base = {
        bankName: bank.bankName,
        accountHolder: bank.accountHolder,
        accountNumber: bank.accountNumber,
        iban: bank.iban,
        currency: bank.currency,
        branchName: bank.branchName,
        visible: bank.visible,
        order: bank.order,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      };
      if (snap.exists()) {
        batch.update(ref, base);
      } else {
        batch.set(ref, { ...base, createdAt: serverTimestamp() });
      }
    }

    // Clean up deprecated default items if they existed from an earlier seed
    const deprecatedDeletes: Array<['socialLinks' | 'wallets' | 'bankAccounts', string]> = [
      ['socialLinks', 'social-facebook'],
      ['socialLinks', 'social-instagram'],
      ['socialLinks', 'social-tiktok'],
      ['socialLinks', 'social-telegram'],
      ['socialLinks', 'social-youtube'],
      ['wallets', 'wallet-orange'],
      ['wallets', 'wallet-etisalat'],
      ['wallets', 'wallet-wepay'],
      ['bankAccounts', 'bank-nbe-demo'],
      ['bankAccounts', 'bank-cib-demo'],
    ];

    for (const [col, oldId] of deprecatedDeletes) {
      const oldRef = doc(db, col, oldId);
      const snap = await getDoc(oldRef);
      if (snap.exists()) {
        batch.delete(oldRef);
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedDemoData');
  }
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
