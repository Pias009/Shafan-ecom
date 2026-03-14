import { prisma } from '@/lib/prisma'
import React from 'react'

export default async function AddProductPage() {
  const brands = await (prisma as any).brand.findMany({ select: { name: true } })
  const categories = await (prisma as any).category.findMany({ select: { name: true } })

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold mb-4">Add Product</h1>
      <form action="/api/admin/products" method="post" className="grid md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label>Name</label>
          <input name="name" className="border p-2 rounded" />
        </div>
        <div className="flex flex-col">
          <label>Brand</label>
          <select name="brandName" className="border p-2 rounded">
            {brands.map((b: any) => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label>Category</label>
          <select name="categoryName" className="border p-2 rounded">
            {categories.map((c: any) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col md:col-span-2">
          <label>Description</label>
          <textarea name="description" className="border p-2 rounded" rows={4} />
        </div>
        <div className="flex flex-col">
          <label>Features (comma separated)</label>
          <input name="features" className="border p-2 rounded" placeholder="e.g. long-lasting, vegan" />
        </div>
        <div className="flex flex-col">
          <label>Price (cents)</label>
          <input name="priceCents" type="number" className="border p-2 rounded" />
        </div>
        <div className="flex flex-col">
          <label>Offer Price (discountCents)</label>
          <input name="discountCents" type="number" className="border p-2 rounded" />
        </div>
        <div className="flex flex-col">
          <label>Stock Quantity</label>
          <input name="stockQuantity" type="number" className="border p-2 rounded" />
        </div>
        <div className="flex flex-col">
          <label>Main Image URL</label>
          <input name="mainImage" className="border p-2 rounded" placeholder="https://.." />
        </div>
        <div className="flex flex-col md:col-span-2">
          <label>Additional Images (comma separated URLs)</label>
          <input name="images" className="border p-2 rounded" placeholder="url1,url2,url3" />
        </div>
        <div className="flex items-center space-x-2">
          <input name="hot" type="checkbox" defaultChecked={false} />
          <span>Hot</span>
          <input name="trending" type="checkbox" defaultChecked={false} className="ml-4" />
          <span>Trending</span>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className="px-5 py-2 rounded bg-primary text-white">Create Product</button>
        </div>
      </form>
    </div>
  )
}
