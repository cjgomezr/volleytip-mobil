import { Platform } from 'react-native';
import { appConfig } from './config';

// ── Types ──────────────────────────────────────────────────────────────────

export interface RCProduct {
  productId:    string;
  priceString:  string;
  price:        number;
  currencyCode: string;
}

export interface RCPurchaseResult {
  productId:    string;
  revenuecatId: string;
}

// ── Product ID conventions ─────────────────────────────────────────────────

// One-time course purchases: volleytip_course_{courseId_sanitized}
export function courseProductId(courseId: string): string {
  return `volleytip_course_${courseId.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
}

// Future subscription product IDs — defined now, NOT exposed in UI yet.
// Activate in a future version without rewriting the purchase infrastructure.
export const SUBSCRIPTION_PRODUCT_IDS = {
  monthly: 'volleytip_monthly',
  annual:  'volleytip_annual',
} as const;

// ── Lazy native module ─────────────────────────────────────────────────────
// Loaded lazily so the app survives in Expo Go (where native modules
// from external packages are not available). All public functions check
// STUB_MODE and fall back to safe dev behavior when SDK is null.

let _sdk: any = undefined;

function sdk(): any {
  if (_sdk !== undefined) return _sdk;
  try {
    _sdk = require('react-native-purchases').default;
  } catch {
    _sdk = null;
  }
  return _sdk;
}

function isStub(): boolean {
  return sdk() === null;
}

// ── Public API ─────────────────────────────────────────────────────────────

export function configureRevenueCat(): void {
  if (isStub()) return;
  const apiKey = Platform.OS === 'ios'
    ? appConfig.revenuecatIosKey
    : appConfig.revenuecatAndroidKey;
  if (!apiKey) return;
  sdk().configure({ apiKey });
}

export function loginRevenueCat(userId: string): void {
  if (isStub()) return;
  sdk().logIn(userId).catch(() => {});
}

export function logoutRevenueCat(): void {
  if (isStub()) return;
  sdk().logOut().catch(() => {});
}

/** Fetch App Store product info for a course. Falls back to mock price in Expo Go. */
export async function getProduct(
  productId:     string,
  fallbackPrice: number = 0,
): Promise<RCProduct> {
  if (!isStub()) {
    try {
      const products: any[] = await sdk().getProducts([productId]);
      const p = products[0];
      if (p) {
        return {
          productId:    p.productIdentifier,
          priceString:  p.priceString,
          price:        p.price,
          currencyCode: p.currencyCode ?? 'USD',
        };
      }
    } catch { /* fall through to stub */ }
  }

  // Stub (Expo Go) or product not found in App Store
  return {
    productId,
    priceString: fallbackPrice > 0 ? `$${fallbackPrice.toFixed(2)}` : 'Gratis',
    price:        fallbackPrice,
    currencyCode: 'USD',
  };
}

/** Initiate an in-app purchase. Throws on failure; returns result on success. */
export async function purchaseProduct(productId: string): Promise<RCPurchaseResult> {
  if (isStub()) {
    // Simulate a successful purchase in Expo Go / dev builds without RC
    await new Promise((r) => setTimeout(r, 1200));
    return { productId, revenuecatId: `stub_${Date.now()}` };
  }

  const products: any[] = await sdk().getProducts([productId]);
  if (!products.length) throw new Error('product_not_found');

  const { customerInfo } = await sdk().purchaseStoreProduct(products[0]);

  // One-time purchases appear in nonSubscriptionTransactions (not entitlements)
  const txList: any[] = customerInfo.nonSubscriptionTransactions ?? [];
  const tx = txList.find((t: any) => t.productIdentifier === productId);

  return {
    productId,
    revenuecatId: tx?.revenueCatId ?? tx?.transactionIdentifier ?? productId,
  };
}

/** Trigger App Store restore. Returns owned product IDs. */
export async function restorePurchases(): Promise<string[]> {
  if (isStub()) return [];
  try {
    const info = await sdk().restorePurchases();
    return (info.nonSubscriptionTransactions as any[]).map((t: any) => t.productIdentifier);
  } catch {
    return [];
  }
}

/** Get currently owned product IDs from RC customer info. */
export async function getOwnedProductIds(): Promise<string[]> {
  if (isStub()) return [];
  try {
    const info = await sdk().getCustomerInfo();
    return (info.nonSubscriptionTransactions as any[]).map((t: any) => t.productIdentifier);
  } catch {
    return [];
  }
}

/**
 * Check whether user has an active subscription.
 * Always returns false until subscriptions are activated (future module).
 */
export async function checkActiveSubscription(): Promise<boolean> {
  if (isStub()) return false;
  try {
    const info   = await sdk().getCustomerInfo();
    const active = info.entitlements.active as Record<string, unknown>;
    return (
      SUBSCRIPTION_PRODUCT_IDS.monthly in active ||
      SUBSCRIPTION_PRODUCT_IDS.annual  in active
    );
  } catch {
    return false;
  }
}
