'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OrderFilter } from './OrderFilter';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function formatPrice(amountCents: number, currency: string): string {
  const code = currency?.toUpperCase() || 'USD';
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  const amount = Number(amountCents);
  return `${code} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ORDER_RECEIVED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'ORDER_CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PROCESSING': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'READY_FOR_PICKUP': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ORDER_PICKED_UP': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'IN_TRANSIT': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'DELIVERED': return 'bg-green-200 text-green-900 border-green-300';
    case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
    case 'REFUNDED': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}

function getPaymentStatusColor(paymentStatus: string | null): string {
  switch (paymentStatus) {
    case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
    case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
    case 'UNPAID': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getPaymentStatusLabel(paymentStatus: string | null): string {
  switch (paymentStatus) {
    case 'PAID': return 'PAID';
    case 'PENDING': return 'PENDING';
    case 'CANCELLED': return 'CANCELLED';
    case 'UNPAID': return 'UNPAID';
    default: return 'UNKNOWN';
  }
}

function getPaymentMethodDisplay(method: string | null): string {
  if (!method) return 'N/A';
  const m = method.toLowerCase();
  if (m === 'cod' || m === 'cash on delivery') return 'COD';
  if (m === 'card' || m === 'stripe' || m === 'online') return 'Stripe';
  if (m === 'tabby') return 'Tabby';
  if (m === 'tamara') return 'Tamara';
  if (m === 'apple_pay') return 'Apple Pay';
  if (m === 'google_pay') return 'Google Pay';
  return method;
}

function getSourceIcon(source: string | null) {
  switch (source) {
    case 'google':
    case 'google_ads':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-gray-200 text-[10px] font-bold">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </span>
      );
    case 'facebook':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#1877F2]/5 border border-[#1877F2]/20 text-[10px] font-bold text-[#1877F2]">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </span>
      );
    case 'instagram':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#dc2743]/10 border border-[#dc2743]/20 text-[10px] font-bold text-[#dc2743]">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
          </svg>
          Instagram
        </span>
      );
    case 'whatsapp':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#25D366]/5 border border-[#25D366]/20 text-[10px] font-bold text-[#25D366]">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          WhatsApp
        </span>
      );
    case 'tiktok':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/5 border border-black/10 text-[10px] font-bold text-black">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
          TikTok
        </span>
      );
    case 'twitter':
    case 'x':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/5 border border-black/10 text-[10px] font-bold text-black">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X
        </span>
      );
    case 'youtube':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#FF0000]/5 border border-[#FF0000]/20 text-[10px] font-bold text-[#FF0000]">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          YouTube
        </span>
      );
    case 'pinterest':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#E60023]/5 border border-[#E60023]/20 text-[10px] font-bold text-[#E60023]">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.403.042-3.438.218-.932 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
          </svg>
          Pinterest
        </span>
      );
    case 'linkedin':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#0A66C2]/5 border border-[#0A66C2]/20 text-[10px] font-bold text-[#0A66C2]">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </span>
      );
    case 'snapchat':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#FFFC00]/30 border border-[#FFFC00]/40 text-[10px] font-bold text-yellow-800">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
            <path d="M12 2.02c0 0 8.58 0 9.57 1.66 0 0 .35.55.39 1.47.01.23.01.46.01.69 0 0-.02 3.16 1.43 4.18.35.25.79.38 1.23.39h.09c.85 0 1.48-.58 1.48-1.15 0-.56.42-1.13 1.11-1.13.62 0 1.13.55 1.13 1.2 0 .84-.66 1.57-1.46 1.85l.01.01c-.89.3-1.27.88-1.27 2.08 0 2.39 1.19 3.63 2.52 4.44.62.38 1.09.81 1.09 1.4 0 .82-.89 1.32-2.05 1.32-1.19 0-2.52-.2-3.58-.53-.4-.13-.63-.16-.81-.09-.08.03-.13.12-.15.29-.15 1.01-1 1.74-2.3 2.11-.69.2-1.47.31-2.36.31-.89 0-1.66-.11-2.36-.31-1.31-.37-2.16-1.1-2.31-2.11-.02-.17-.07-.26-.15-.29-.18-.07-.41-.04-.81.09-1.06.33-2.39.53-3.58.53-1.16 0-2.05-.5-2.05-1.32 0-.59.47-1.02 1.09-1.4 1.33-.81 2.52-2.05 2.52-4.44 0-1.2-.38-1.78-1.27-2.08l.01-.01c-.8-.28-1.46-1.01-1.46-1.85 0-.65.51-1.2 1.13-1.2.69 0 1.11.57 1.11 1.13 0 .57.63 1.15 1.48 1.15h.09c.44-.01.88-.14 1.23-.39 1.45-1.02 1.43-4.18 1.43-4.18 0-.23 0-.46.01-.69.04-.92.39-1.47.39-1.47C3.42 2.02 12 2.02 12 2.02z"/>
          </svg>
          Snapchat
        </span>
      );
    case 'telegram':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#0088cc]/5 border border-[#0088cc]/20 text-[10px] font-bold text-[#0088cc]">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Telegram
        </span>
      );
    case 'email':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-700">
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          Email
        </span>
      );
    case 'search_engine':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-700">
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          Organic
        </span>
      );
    case 'direct':
    case 'search_engine':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-700">
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          Direct
        </span>
      );
    default:
      if (source) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-700">
            {source}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-700">
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          Direct
        </span>
      );
  }
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const orderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - orderDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function OrdersTableClient({ dbOrders, status, storeAccess }: { dbOrders: any[], status: string, storeAccess: any }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const groupedOrders: Record<string, any[]> = {};
  dbOrders.forEach((order) => {
    const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
    if (!groupedOrders[dateKey]) groupedOrders[dateKey] = [];
    groupedOrders[dateKey].push(order);
  });

  const sortedDateKeys = Object.keys(groupedOrders).sort((a, b) => b.localeCompare(a));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(dbOrders.map(o => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOrder = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected order(s)? This cannot be undone.`)) return;

    setIsDeleting(true);
    const tid = toast.loading('Deleting orders...');
    try {
      const res = await fetch('/api/admin/orders/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Deleted ${data.count} order(s)`, { id: tid });
        setSelectedIds(new Set());
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to delete orders');
      }
    } catch (e: any) {
      toast.error(e.message, { id: tid });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 px-2 md:px-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Orders</h1>
            <Link 
              href="/ueadmin/orders/create"
              className="bg-black text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10 flex items-center gap-2"
            >
              <Plus size={14} /> Create Order
            </Link>
            {selectedIds.size > 0 && (
              <button 
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="bg-red-500 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete Selected ({selectedIds.size})
              </button>
            )}
          </div>
          {storeAccess.userCountry && (
            <p className="text-sm text-black/70 mt-1">
              Viewing orders for {storeAccess.userCountry} store{storeAccess.allowedStores.length > 1 ? 's' : ''}: {storeAccess.allowedStores.join(', ')}
            </p>
          )}
        </div>
          <div className="text-[10px] md:text-sm text-black font-medium uppercase tracking-widest bg-black/5 px-4 py-1.5 rounded-full inline-block">
            {dbOrders.length} Order{dbOrders.length !== 1 ? 's' : ''}
          </div>
      </div>

      <div className="glass-panel-heavy overflow-hidden rounded-3xl border border-black/5 shadow-sm bg-white">
        <div className="mb-2 p-6 flex items-center justify-between border-b border-black/5">
           <OrderFilter currentStatus={status} />
           <div className="text-[10px] font-black uppercase tracking-widest text-black italic">Global Fulfilment Flow</div>
        </div>
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px] md:min-w-0 relative">
            <thead className="bg-black text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={dbOrders.length > 0 && selectedIds.size === dbOrders.length}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black"
                  />
                </th>
                <th className="px-2 md:px-4 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Order #</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Store</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Date</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Customer</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Source</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Payment Method</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Total</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Payment Status</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Status</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 overflow-x-auto">
              {sortedDateKeys.map((dateKey) => {
                const ordersInGroup = groupedOrders[dateKey];
                const groupLabel = getDateGroup(dateKey);
                
                return (
                  <React.Fragment key={dateKey}>
                    <tr className="bg-black/5">
                      <td colSpan={11} className="px-4 md:px-6 py-3">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-black/70">{groupLabel}</span>
                      </td>
                    </tr>
                    {ordersInGroup.map((o) => {
                      const billing = o.billingAddress;
                      const customer = o.user?.name || (billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : 'Guest');
                      const email = o.user?.email || billing?.email || 'No email';
                      const date = new Date(o.createdAt).toLocaleDateString();
                      const paymentMethodDisplay = getPaymentMethodDisplay(o.paymentMethod);
                      const storeCode = o.store?.code || 'N/A';
                      const storeName = o.store?.name || 'Unknown Store';
                      
                      const rawSource = o.referralSource 
                        || o.user?.signupProvider 
                        || (o.user?.accounts?.find((a: { provider: string }) => a.provider !== 'credentials')?.provider)
                        || null;
                      const source = rawSource === 'email' ? 'direct' : rawSource;
                      
                      return (
                        <tr key={o.id} className="hover:bg-black/[0.02] transition-colors group">
                          <td className="px-4 py-4 w-10 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(o.id)}
                              onChange={() => handleSelectOrder(o.id)}
                              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black"
                            />
                          </td>
                          <td className="px-2 md:px-4 py-4 font-black">#{o.id.substring(0, 8)}</td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="font-black text-[10px] md:text-xs uppercase tracking-widest">{storeCode}</div>
                            <div className="text-[9px] text-black/70 truncate max-w-[80px]">{storeName}</div>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-[10px] md:text-sm font-medium text-black">{date}</td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="font-bold text-[11px] md:text-sm">{customer}</div>
                            <div className="text-[9px] md:text-[10px] font-bold text-black/70 truncate max-w-[120px] md:max-w-[150px] uppercase tracking-tighter">{email}</div>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            {getSourceIcon(source)}
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${o.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                              {paymentMethodDisplay}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 font-black text-xs md:text-sm">{formatPrice(o.total, o.currency)}</td>
                          <td className="px-4 md:px-6 py-4">
                            <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${getPaymentStatusColor(o.paymentStatus)}`}>
                              {getPaymentStatusLabel(o.paymentStatus)}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="flex flex-col items-start gap-2">
                              <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${getStatusColor(o.status)}`}>
                                {o.status}
                              </span>
                              {o.shipment && (
                                <a 
                                  href={o.shipment.trackingUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-2 py-1 bg-black/5 rounded text-[9px] font-bold text-black hover:bg-black/10 transition-colors"
                                >
                                  {o.shipment.courier?.toLowerCase().includes('naqel') ? '📦' : o.shipment.courier?.toLowerCase().includes('aramex') ? '🚚' : '🛵'} 
                                  {o.shipment.trackingCode}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-right flex items-center justify-end gap-2">
                            <Link href={`/ueadmin/orders/${o.id}`} className="bg-black text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-2 rounded-full hover:scale-105 transition">View</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
