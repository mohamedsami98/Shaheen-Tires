import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_BANK_ACCOUNTS,
  DEFAULT_BRANCHES,
  DEFAULT_SITE_CONFIG,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_WALLETS,
} from '../data/defaultData';
import { ADMIN_EMAIL, auth, db } from '../lib/firebase';
import {
  BankAccount,
  BranchLocation,
  SiteConfig,
  SocialLink,
  WalletAccount,
} from '../types/hub';

const STORAGE_KEY = 'shaheen_tires_hub_state_v1';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

export function saveHubStateCache(state: HubState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function assertAuthorizedAdminUid(): string {
  const user = auth.currentUser;
  if (
    !user ||
    !user.emailVerified ||
    user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
  ) {
    throw new Error(`غير مصرح: يجب تسجيل الدخول بحساب ${ADMIN_EMAIL}`);
  }
  return user.uid;
}

function sanitizeSiteConfigPayload(config: SiteConfig) {
  return {
    brandName: String(config.brandName || '').slice(0, 120),
    brandTagline: String(config.brandTagline || '').slice(0, 400),
    logoUrl: String(config.logoUrl || '').slice(0, 250000),
    primaryColor: /^#[0-9A-Fa-f]{6}$/.test(config.primaryColor)
      ? config.primaryColor
      : '#DC2626',
    surfaceMode: config.surfaceMode === 'dark' ? 'dark' : 'light',
    accentStyle: config.accentStyle || 'custom',
    whatsappFloatNumber: String(config.whatsappFloatNumber || '').slice(0, 30),
    whatsappFloatEnabled: Boolean(config.whatsappFloatEnabled),
    paymentInstructions: String(config.paymentInstructions || '').slice(0, 600),
    beneficiaryWarning: String(config.beneficiaryWarning || '').slice(0, 600),
    sectionOrder: Array.isArray(config.sectionOrder) && config.sectionOrder.length === 4
      ? config.sectionOrder
      : ['social', 'branches', 'wallets', 'banks'],
    sectionVisibility: {
      social: config.sectionVisibility?.social !== false,
      branches: config.sectionVisibility?.branches !== false,
      wallets: config.sectionVisibility?.wallets !== false,
      banks: Boolean(config.sectionVisibility?.banks),
    },
  };
}

function sanitizeSocialFields(item: SocialLink) {
  return {
    platform: item.platform,
    label: String(item.label || '').slice(0, 120),
    url: String(item.url || '').slice(0, 500),
    subtitle: String(item.subtitle || '').slice(0, 200),
    visible: Boolean(item.visible),
    order: Math.max(0, Math.min(1000, Number(item.order) || 0)),
  };
}

function sanitizeBranchFields(item: BranchLocation) {
  return {
    name: String(item.name || '').slice(0, 120),
    address: String(item.address || '').slice(0, 300),
    mapUrl: String(item.mapUrl || '').slice(0, 500),
    visible: Boolean(item.visible),
    order: Math.max(0, Math.min(1000, Number(item.order) || 0)),
  };
}

function sanitizeWalletFields(item: WalletAccount) {
  return {
    provider: item.provider,
    providerName: String(item.providerName || '').slice(0, 80),
    identifier: String(item.identifier || '').slice(0, 120),
    ownerName: String(item.ownerName || '').slice(0, 120),
    showOwnerName: Boolean(item.showOwnerName),
    note: String(item.note || '').slice(0, 300),
    visible: Boolean(item.visible),
    order: Math.max(0, Math.min(1000, Number(item.order) || 0)),
  };
}

function sanitizeBankFields(item: BankAccount) {
  return {
    bankName: String(item.bankName || '').slice(0, 120),
    accountHolder: String(item.accountHolder || '').slice(0, 120),
    accountNumber: String(item.accountNumber || '').slice(0, 80),
    iban: String(item.iban || '').slice(0, 80),
    currency: String(item.currency || '').slice(0, 30),
    branchName: String(item.branchName || '').slice(0, 120),
    visible: Boolean(item.visible),
    order: Math.max(0, Math.min(1000, Number(item.order) || 0)),
  };
}

export function subscribeToHubState(
  onUpdate: (state: HubState, isCloudSeeded: boolean) => void,
  onError?: (err: Error) => void
): () => void {
  let latest: HubState = loadHubState();
  let isCloudSeeded = false;
  let configLoaded = false;

  const emit = () => {
    saveHubStateCache(latest);
    onUpdate(latest, isCloudSeeded);
  };

  const configPath = 'siteConfig/main';
  const unsubConfig = onSnapshot(
    doc(db, 'siteConfig', 'main'),
    (snap) => {
      configLoaded = true;
      if (snap.exists()) {
        isCloudSeeded = true;
        const data = snap.data() as Partial<SiteConfig>;
        latest = {
          ...latest,
          config: {
            ...DEFAULT_SITE_CONFIG,
            ...data,
          },
        };
      } else {
        isCloudSeeded = false;
      }
      emit();
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, configPath);
    }
  );

  const unsubSocial = onSnapshot(
    query(collection(db, 'socialLinks'), orderBy('order', 'asc')),
    (snap) => {
      if (!snap.empty || isCloudSeeded || configLoaded) {
        if (!snap.empty || isCloudSeeded) {
          latest = {
            ...latest,
            socialLinks: snap.docs.map((d) => ({
              ...(d.data() as SocialLink),
              id: d.id,
            })),
          };
          emit();
        }
      }
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, 'socialLinks');
    }
  );

  const unsubBranches = onSnapshot(
    query(collection(db, 'branches'), orderBy('order', 'asc')),
    (snap) => {
      if (!snap.empty || isCloudSeeded) {
        latest = {
          ...latest,
          branches: snap.docs.map((d) => ({
            ...(d.data() as BranchLocation),
            id: d.id,
          })),
        };
        emit();
      }
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, 'branches');
    }
  );

  const unsubWallets = onSnapshot(
    query(collection(db, 'wallets'), orderBy('order', 'asc')),
    (snap) => {
      if (!snap.empty || isCloudSeeded) {
        latest = {
          ...latest,
          wallets: snap.docs.map((d) => ({
            ...(d.data() as WalletAccount),
            id: d.id,
          })),
        };
        emit();
      }
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, 'wallets');
    }
  );

  const unsubBanks = onSnapshot(
    query(collection(db, 'bankAccounts'), orderBy('order', 'asc')),
    (snap) => {
      if (!snap.empty || isCloudSeeded) {
        latest = {
          ...latest,
          bankAccounts: snap.docs.map((d) => ({
            ...(d.data() as BankAccount),
            id: d.id,
          })),
        };
        emit();
      }
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, 'bankAccounts');
    }
  );

  return () => {
    unsubConfig();
    unsubSocial();
    unsubBranches();
    unsubWallets();
    unsubBanks();
  };
}

export async function ensureFirestoreSeeded(currentState?: HubState): Promise<void> {
  const uid = assertAuthorizedAdminUid();
  const configRef = doc(db, 'siteConfig', 'main');
  let configSnap;
  try {
    configSnap = await getDoc(configRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'siteConfig/main');
  }

  if (configSnap.exists()) return;

  const seed = currentState || getDefaultHubState();
  const batch = writeBatch(db);

  batch.set(configRef, {
    ...sanitizeSiteConfigPayload(seed.config),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });

  seed.socialLinks.forEach((item, idx) => {
    batch.set(doc(db, 'socialLinks', item.id), {
      id: item.id,
      ...sanitizeSocialFields({ ...item, order: idx }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
  });

  seed.branches.forEach((item, idx) => {
    batch.set(doc(db, 'branches', item.id), {
      id: item.id,
      ...sanitizeBranchFields({ ...item, order: idx }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
  });

  seed.wallets.forEach((item, idx) => {
    batch.set(doc(db, 'wallets', item.id), {
      id: item.id,
      ...sanitizeWalletFields({ ...item, order: idx }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
  });

  seed.bankAccounts.forEach((item, idx) => {
    batch.set(doc(db, 'bankAccounts', item.id), {
      id: item.id,
      ...sanitizeBankFields({ ...item, order: idx }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'siteConfig/main');
  }
}

export async function saveSiteConfigToFirestore(config: SiteConfig): Promise<void> {
  const uid = assertAuthorizedAdminUid();
  await ensureFirestoreSeeded();
  const ref = doc(db, 'siteConfig', 'main');
  const payload = sanitizeSiteConfigPayload(config);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    } else {
      await updateDoc(ref, {
        ...payload,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'siteConfig/main');
  }
}

export async function saveSocialLinkToFirestore(item: SocialLink): Promise<void> {
  const uid = assertAuthorizedAdminUid();
  await ensureFirestoreSeeded();
  const path = `socialLinks/${item.id}`;
  const ref = doc(db, 'socialLinks', item.id);
  const fields = sanitizeSocialFields(item);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: item.id,
        ...fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    } else {
      await updateDoc(ref, {
        ...fields,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveBranchToFirestore(item: BranchLocation): Promise<void> {
  const uid = assertAuthorizedAdminUid();
  await ensureFirestoreSeeded();
  const path = `branches/${item.id}`;
  const ref = doc(db, 'branches', item.id);
  const fields = sanitizeBranchFields(item);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: item.id,
        ...fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    } else {
      await updateDoc(ref, {
        ...fields,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveWalletToFirestore(item: WalletAccount): Promise<void> {
  const uid = assertAuthorizedAdminUid();
  await ensureFirestoreSeeded();
  const path = `wallets/${item.id}`;
  const ref = doc(db, 'wallets', item.id);
  const fields = sanitizeWalletFields(item);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: item.id,
        ...fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    } else {
      await updateDoc(ref, {
        ...fields,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveBankToFirestore(item: BankAccount): Promise<void> {
  const uid = assertAuthorizedAdminUid();
  await ensureFirestoreSeeded();
  const path = `bankAccounts/${item.id}`;
  const ref = doc(db, 'bankAccounts', item.id);
  const fields = sanitizeBankFields(item);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: item.id,
        ...fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    } else {
      await updateDoc(ref, {
        ...fields,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteFirestoreDoc(
  colName: 'socialLinks' | 'branches' | 'wallets' | 'bankAccounts',
  id: string
): Promise<void> {
  assertAuthorizedAdminUid();
  await ensureFirestoreSeeded();
  const path = `${colName}/${id}`;
  try {
    await deleteDoc(doc(db, colName, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function reorderFirestoreDocs<T extends { id: string; order: number }>(
  colName: 'socialLinks' | 'branches' | 'wallets' | 'bankAccounts',
  items: T[]
): Promise<void> {
  const uid = assertAuthorizedAdminUid();
  await ensureFirestoreSeeded();
  const batch = writeBatch(db);
  items.forEach((item, idx) => {
    batch.update(doc(db, colName, item.id), {
      order: idx,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
  });
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, colName);
  }
}

export async function resetFirestoreToDefaults(): Promise<HubState> {
  const uid = assertAuthorizedAdminUid();
  const defaults = getDefaultHubState();
  const collectionsToClear: Array<'socialLinks' | 'branches' | 'wallets' | 'bankAccounts'> = [
    'socialLinks',
    'branches',
    'wallets',
    'bankAccounts',
  ];

  try {
    const batch = writeBatch(db);
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      snap.docs.forEach((d) => batch.delete(d.ref));
    }

    const configRef = doc(db, 'siteConfig', 'main');
    const configSnap = await getDoc(configRef);
    if (configSnap.exists()) {
      batch.update(configRef, {
        ...sanitizeSiteConfigPayload(defaults.config),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    } else {
      batch.set(configRef, {
        ...sanitizeSiteConfigPayload(defaults.config),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    }

    defaults.socialLinks.forEach((item, idx) => {
      batch.set(doc(db, 'socialLinks', item.id), {
        id: item.id,
        ...sanitizeSocialFields({ ...item, order: idx }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    });

    defaults.branches.forEach((item, idx) => {
      batch.set(doc(db, 'branches', item.id), {
        id: item.id,
        ...sanitizeBranchFields({ ...item, order: idx }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    });

    defaults.wallets.forEach((item, idx) => {
      batch.set(doc(db, 'wallets', item.id), {
        id: item.id,
        ...sanitizeWalletFields({ ...item, order: idx }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    });

    await batch.commit();
    saveHubStateCache(defaults);
    return defaults;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'siteConfig/main');
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
