"use client";

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(`Product "${productName}" deleted successfully`);
        router.refresh(); // Refresh the page to update the product list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An error occurred while deleting the product');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-2"
      title={`Delete ${productName}`}
    >
      {isDeleting ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Trash2 size={12} />
      )}
      Delete
    </button>
  );
}