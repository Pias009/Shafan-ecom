import { cookies } from 'next/headers';

/**
 * Get the user's store code from cookies (set by middleware)
 * Defaults to 'UAE' if not set
 */
export async function getStoreCode(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const storeCode = cookieStore.get('store_code')?.value;
    
    // Validate store code - support all 6 countries
    const validStoreCodes = ['KUW', 'UAE', 'BHR', 'SAU', 'OMN', 'QAT'];
    if (storeCode && validStoreCodes.includes(storeCode)) {
      return storeCode;
    }
    
    // Default to UAE if invalid or not set
    return 'UAE';
  } catch (error) {
    console.error('Error reading store code from cookies:', error);
    return 'UAE';
  }
}

/**
 * Check if the user is from Kuwait based on store code
 */
export async function isKuwaitUser(): Promise<boolean> {
  const storeCode = await getStoreCode();
  return storeCode === 'KUW';
}

/**
 * Get store information based on store code
 */
export function getStoreInfo(storeCode: string) {
  const stores = {
    KUW: {
      code: 'KUW',
      name: 'Kuwait',
      country: 'KW',
      currency: 'KWD',
      region: 'Middle East'
    },
    UAE: {
      code: 'UAE',
      name: 'UAE',
      country: 'AE',
      currency: 'AED',
      region: 'Middle East'
    },
    BHR: {
      code: 'BHR',
      name: 'Bahrain',
      country: 'BH',
      currency: 'BHD',
      region: 'Middle East'
    },
    SAU: {
      code: 'SAU',
      name: 'Saudi Arabia',
      country: 'SA',
      currency: 'SAR',
      region: 'Middle East'
    },
    OMN: {
      code: 'OMN',
      name: 'Oman',
      country: 'OM',
      currency: 'OMR',
      region: 'Middle East'
    },
    QAT: {
      code: 'QAT',
      name: 'Qatar',
      country: 'QA',
      currency: 'QAR',
      region: 'Middle East'
    }
  };
  
  return stores[storeCode as keyof typeof stores] || stores.UAE;
}

/**
 * Get current store info for the user
 */
export async function getCurrentStoreInfo() {
  const storeCode = await getStoreCode();
  return getStoreInfo(storeCode);
}