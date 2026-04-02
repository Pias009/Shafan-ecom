'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DiscountForm } from '@/components/DiscountForm';
import { Loader } from 'lucide-react';

interface Discount {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  discountType: string;
  value: number;
  applyToAll: boolean;
  productIds?: string[];
  categoryIds?: string[];
  countries: string[];
  minimumOrderValue?: number;
  startDate: string | null;
  endDate: string | null;
  maxUses: number | null;
  active: boolean;
}

export default function EditDiscountPage() {
  const params = useParams();
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        // Handle both Promise and direct params
        const resolvedParams = await Promise.resolve(params);
        const discountId = (resolvedParams as any).id as string;

        if (!discountId) {
          setError('Discount ID not found');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/admin/promotional/discounts/${discountId}`);
        if (!res.ok) throw new Error('Failed to fetch discount');

        const data = await res.json();
        setDiscount({
          ...data,
          productIds: data.productIds || [],
          categoryIds: data.categoryIds || [],
        });
      } catch (err) {
        console.error('Error fetching discount:', err);
        setError('Failed to load discount details');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscount();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading discount...</p>
        </div>
      </div>
    );
  }

  if (error || !discount) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Error</p>
          <p className="text-red-700">{error || 'Discount not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Discount</h1>
        <DiscountForm 
          initialData={{
            id: discount.id,
            code: discount.code || '',
            name: discount.name,
            description: discount.description || '',
            discountType: discount.discountType as any,
            value: discount.value,
            applyToAll: discount.applyToAll,
            productIds: discount.productIds || [],
            categoryIds: discount.categoryIds || [],
            countries: discount.countries,
            minimumOrderValue: discount.minimumOrderValue,
            startDate: discount.startDate || '',
            endDate: discount.endDate || '',
            maxUses: discount.maxUses || undefined,
            active: discount.active,
          }} 
          isEditing={true} 
        />
      </div>
    </div>
  );
}
