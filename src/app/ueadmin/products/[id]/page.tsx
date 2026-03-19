import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/auth';
import { EditProductForm } from './EditProductForm';

export const dynamic = 'force-dynamic';

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const session = await getServerAuthSession();
    const isSuper = session?.user?.email === "pvs178380@gmail.com";

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
        storeInventories: {
          include: { store: true }
        }
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

    // Flatten inventories for the form
    const kuwaitInv = (product as any).storeInventories?.find((i: any) => i.store?.code === 'KUW');
    
    const productWithGlobal = {
      ...product,
      kuwaitPrice: kuwaitInv?.price || 0,
      kuwaitStock: kuwaitInv?.quantity || 0,
      allInventories: (product as any).storeInventories || [], // For Super Admin
      isSuper
    };

    return <EditProductForm product={productWithGlobal} />;
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
