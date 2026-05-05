import { cookies } from 'next/headers';

/**
 * Get the user's store code from cookies (set by middleware)
 * Defaults to 'UAE'
 */
export async function getStoreCode(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const storeCode = cookieStore.get('store_code')?.value;
    
    const validStores = ['UAE', 'SAUDI', 'KUWAIT', 'BAHRAIN', 'OMAN', 'QATAR'];
    if (storeCode && validStores.includes(storeCode.toUpperCase())) {
      return storeCode.toUpperCase();
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
  const stores: Record<string, any> = {
    UAE: { code: 'UAE', name: 'UAE', country: 'AE', currency: 'AED', region: 'Middle East' },
    SAUDI: { code: 'SAUDI', name: 'Saudi Arabia', country: 'SA', currency: 'SAR', region: 'Middle East' },
    KUWAIT: { code: 'KUWAIT', name: 'Kuwait', country: 'KW', currency: 'KWD', region: 'Middle East' },
    BAHRAIN: { code: 'BAHRAIN', name: 'Bahrain', country: 'BH', currency: 'BHD', region: 'Middle East' },
    OMAN: { code: 'OMAN', name: 'Oman', country: 'OM', currency: 'OMR', region: 'Middle East' },
    QATAR: { code: 'QATAR', name: 'Qatar', country: 'QA', currency: 'QAR', region: 'Middle East' },
  };
  
  return stores[storeCode.toUpperCase()] || stores.UAE;
}

/**
 * Get current store info for the user
 */
export async function getCurrentStoreInfo() {
  const storeCode = await getStoreCode();
  return getStoreInfo(storeCode);
}