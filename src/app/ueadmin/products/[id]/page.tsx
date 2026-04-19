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

    const [product, categories, subCategories, skinTones, skinConcerns, brands] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: {
          brand: true,
          subCategory: true,
          storeInventories: {
            include: { store: true }
          },
          productCategories: {
            include: { category: { select: { id: true, name: true } } }
          },
          productSkinTones: {
            include: { skinTone: { select: { id: true, name: true, hexColor: true } } }
          },
          productSkinConcerns: {
            include: { skinConcern: { select: { id: true, name: true } } }
          },
          countryPrices: true
        }
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      prisma.subCategory.findMany({
        select: { id: true, name: true, categoryId: true, category: { select: { name: true } } },
        orderBy: { name: 'asc' }
      }),
      prisma.skinTone.findMany({
        select: { id: true, name: true, hexColor: true },
        orderBy: { name: 'asc' }
      }),
      prisma.skinConcern.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      prisma.brand.findMany({
        select: { name: true },
        orderBy: { name: 'asc' }
      })
    ]);

    if (!product) {
      return (
        <div className="pt-40 text-center">
          <p className="text-xl font-bold italic text-black/20">Product not found in MongoDB</p>
          <Link href="/ueadmin/products" className="text-xs font-black uppercase tracking-widest bg-black text-white px-8 py-3 rounded-full mt-6 inline-block">Back to Inventory</Link>
        </div>
      );
    }

    const productWithGlobal = {
      ...product,
      categories: product.productCategories.map((pc: any) => pc.category),
      skinTones: product.productSkinTones.map((ps: any) => ps.skinTone),
      skinConcerns: product.productSkinConcerns.map((sc: any) => sc.skinConcern),
      allInventories: (product as any).storeInventories || [],
      countryPrices: (product as any).countryPrices?.map((cp: any) => ({
        ...cp,
        price: Number(cp.price) || 0,
      })) || [],
      price: Number(product.price) || 0,
      discountPrice: Number(product.discountPrice) || 0,
      stockQuantity: Number(product.stockQuantity) || 0,
      isSuper
    };

    return <EditProductForm product={productWithGlobal} categories={categories} subCategories={subCategories} skinTones={skinTones} skinConcerns={skinConcerns} brands={brands} />;
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
