import { create } from 'zustand';

import {
  checkActiveSubscription,
  courseProductId,
  getProduct,
  logoutRevenueCat,
  purchaseProduct,
  restorePurchases as rcRestorePurchases,
  RCProduct,
} from '../lib/revenuecat';
import {
  fetchOwnedCourseIds,
  recordPurchase,
} from '../services/purchases.service';
import { useAuthStore } from './auth.store';

interface PurchasesState {
  ownedCourseIds: Set<string>;
  loading:        boolean;
  buyLoading:     boolean;
  error:          string | null;

  /**
   * Future: becomes true when a monthly/annual subscription is active.
   * Always false until subscriptions are activated (planned for a later version).
   */
  hasActiveSubscription: boolean;

  /** Load owned courses from Supabase. Call once after auth initializes. */
  initialize: (userId: string) => Promise<void>;

  /**
   * Purchase a course via RevenueCat, then record it in Supabase.
   * Returns null on success, 'cancelled' if user aborted, or an error string.
   */
  buyCourse: (courseId: string, priceUsd?: number) => Promise<string | null>;

  /**
   * Trigger App Store restore, then reload owned courses from Supabase.
   * Required by App Store guidelines; safe to call any time.
   */
  restorePurchases: (userId: string) => Promise<void>;

  /** True if the user can access a course (free, owned, or subscribed). */
  hasAccess: (courseId: string, isFree: boolean) => boolean;

  /** Fetch product info for displaying price in the paywall. */
  getProductInfo: (courseId: string, priceUsd?: number) => Promise<RCProduct>;

  /** Clear state on sign-out. */
  reset: () => void;
}

const EMPTY: Pick<PurchasesState,
  'ownedCourseIds' | 'loading' | 'buyLoading' | 'error' | 'hasActiveSubscription'
> = {
  ownedCourseIds:        new Set(),
  loading:               false,
  buyLoading:            false,
  error:                 null,
  hasActiveSubscription: false,
};

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  ...EMPTY,

  async initialize(userId) {
    set({ loading: true, error: null });
    try {
      const [courseIds, isSubscribed] = await Promise.all([
        fetchOwnedCourseIds(userId),
        checkActiveSubscription(),
      ]);
      set({
        ownedCourseIds:        new Set(courseIds),
        hasActiveSubscription: isSubscribed,
      });
    } catch (e: any) {
      // Non-fatal: user just won't see previously purchased courses until refresh
      set({ error: e?.message ?? 'Error cargando compras' });
    } finally {
      set({ loading: false });
    }
  },

  async buyCourse(courseId, priceUsd) {
    const session = useAuthStore.getState().session;
    if (!session) return 'No autenticado';

    set({ buyLoading: true, error: null });
    try {
      const productId = courseProductId(courseId);
      const result = await purchaseProduct(productId);
      await recordPurchase(session.user.id, courseId, result.revenuecatId);

      set((prev) => ({
        ownedCourseIds: new Set([...prev.ownedCourseIds, courseId]),
      }));
      return null; // success
    } catch (e: any) {
      // User tapped Cancel in the native payment sheet — not an error
      if (e?.userCancelled === true) return 'cancelled';
      const msg = e?.message ?? 'Error al procesar el pago';
      set({ error: msg });
      return msg;
    } finally {
      set({ buyLoading: false });
    }
  },

  async restorePurchases(userId) {
    set({ buyLoading: true, error: null });
    try {
      // Let RC sync with the App Store, then use Supabase as source of truth
      await rcRestorePurchases();
      const courseIds = await fetchOwnedCourseIds(userId);
      set({ ownedCourseIds: new Set(courseIds) });
    } catch (e: any) {
      set({ error: e?.message ?? 'Error restaurando compras' });
    } finally {
      set({ buyLoading: false });
    }
  },

  hasAccess(courseId, isFree) {
    if (isFree)                        return true;
    if (get().hasActiveSubscription)   return true;
    return get().ownedCourseIds.has(courseId);
  },

  async getProductInfo(courseId, priceUsd) {
    return getProduct(courseProductId(courseId), priceUsd);
  },

  reset() {
    logoutRevenueCat();
    set({ ...EMPTY });
  },
}));
