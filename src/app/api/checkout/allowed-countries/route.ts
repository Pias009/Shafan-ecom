import { NextResponse } from 'next/server';
import { COUNTRY_CONFIG, getActiveCountries } from '@/lib/address-config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/checkout/allowed-countries
 * Returns list of countries that accept orders
 */
export async function GET() {
  try {
    const activeCountries = getActiveCountries();

    const countriesData = activeCountries.map((country) => ({
      code: country.code,
      name: country.name,
      currency: country.currency,
      minOrder: country.minOrder,
      deliveryFee: country.deliveryFee,
      freeDelivery: country.freeDelivery,
      estimatedDays: country.estimatedDays,
      regions: country.regions || [],
    }));

    return NextResponse.json({
      activeCountries: countriesData,
      totalCountries: countriesData.length,
    });
  } catch (error) {
    console.error('Error fetching allowed countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allowed countries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/checkout/validate-country
 * Validate if a specific country is allowed to place orders
 */
export async function POST(req: Request) {
  try {
    const { countryCode } = await req.json();

    if (!countryCode) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      );
    }

    const country = COUNTRY_CONFIG[countryCode.toUpperCase()];

    if (!country) {
      return NextResponse.json(
        {
          allowed: false,
          message: 'Country not found in our service area',
        },
        { status: 400 }
      );
    }

    if (!country.active) {
      return NextResponse.json(
        {
          allowed: false,
          message: `Unfortunately, we do not currently deliver to ${country.name}. Please select a different country.`,
          countryName: country.name,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      allowed: true,
      country: {
        code: country.code,
        name: country.name,
        currency: country.currency,
        minOrder: country.minOrder,
        deliveryFee: country.deliveryFee,
        freeDelivery: country.freeDelivery,
        estimatedDays: country.estimatedDays,
        regions: country.regions || [],
      },
    });
  } catch (error) {
    console.error('Error validating country:', error);
    return NextResponse.json(
      { error: 'Failed to validate country' },
      { status: 500 }
    );
  }
}
