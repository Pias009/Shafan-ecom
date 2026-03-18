import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { EditProductForm } from './EditProductForm';

export const dynamic = 'force-dynamic';

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const product = await (prisma as any).product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
      }
    });

    if (!product) {
      return (
        <div className="pt-40 text-center">
          <p className="text-xl font-bold italic text-black/20">Product not found in MongoDB</p>
          <Link href="/ueadmin/products" className="text-xs font-black uppercase tracking-widest bg-black text-white px-8 py-3 rounded-full mt-6 inline-block">Back to Inventory</Link>
        </div>
      );
    }

    return <EditProductForm product={product} />;
  } catch (error) {
    console.error("Error loading product:", error);
    return (
      <div className="pt-40 text-center">
        <p className="text-xl font-bold italic text-black/20">Error loading product from database</p>
        <Link href="/ueadmin/products" className="text-xs font-black uppercase tracking-widest bg-black text-white px-8 py-3 rounded-full mt-6 inline-block">Back to Inventory</Link>
      </div>
    );
  }
}
