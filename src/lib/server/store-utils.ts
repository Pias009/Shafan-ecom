import { cookies } from 'next/headers';

/**
 * Get the user's store code from cookies (set by middleware)
 * Defaults to 'UAE'
 */
export async function getStoreCode(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const storeCode = cookieStore.get('store_code')?.value;
    
    // Only UAE is supported now
    if (storeCode && storeCode === 'UAE') {
      return storeCode;
    }
    
    // Default to UAE
    return 'UAE';
  } catch (error) {
    console.error('Error reading store code from cookies:', error);
    return 'UAE';
  }
}

/**
 * Get store information based on store code
 */
export function getStoreInfo(storeCode: string) {
  const stores = {
    UAE: {
      code: 'UAE',
      name: 'UAE',
      country: 'AE',
      currency: 'AED',
      region: 'Middle East'
    }
  };
  
  return stores.UAE;
}

/**
 * Get current store info for the user
 */
export async function getCurrentStoreInfo() {
  const storeCode = await getStoreCode();
  return getStoreInfo(storeCode);
}