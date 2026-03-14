import Link from 'next/link';
import { wooApi } from '@/lib/woocommerce';
import { EditProductForm } from './EditProductForm';

export const dynamic = 'force-dynamic';

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const { data: product } = await wooApi.get(`products/${id}`);

    if (!product) {
      return (
        <div className="pt-40 text-center">
          <p className="text-xl font-bold italic text-black/20">Product not found</p>
          <Link href="/ueadmin/products" className="text-xs font-black uppercase tracking-widest bg-black text-white px-8 py-3 rounded-full mt-6 inline-block">Back to Inventory</Link>
        </div>
      );
    }

    return <EditProductForm product={product} />;
  } catch (error) {
    return (
      <div className="pt-40 text-center">
        <p className="text-xl font-bold italic text-black/20">Error loading product from WooCommerce</p>
        <Link href="/ueadmin/products" className="text-xs font-black uppercase tracking-widest bg-black text-white px-8 py-3 rounded-full mt-6 inline-block">Back to Inventory</Link>
      </div>
    );
  }
}
