'use client';

import { useRef, useEffect, useState } from 'react';
import { InvoiceTemplate } from './InvoiceTemplate';
import { useInvoiceDownload } from '@/hooks/useInvoiceDownload';
import { FileDown, Loader2 } from 'lucide-react';

interface InvoiceDownloaderProps {
  orderId: string;
  showPreview?: boolean;
}

export const InvoiceDownloader = ({ orderId, showPreview = false }: InvoiceDownloaderProps) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { downloadInvoice, isLoading: isDownloading } = useInvoiceDownload();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/account/orders/${orderId}/invoice`);

        if (!response.ok) {
          throw new Error('Failed to fetch invoice data');
        }

        const data = await response.json();
        setInvoiceData(data);
      } catch (err) {
        console.error('Invoice fetch error:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load invoice'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [orderId]);

  const handleDownload = async () => {
    if (invoiceRef.current) {
      await downloadInvoice(invoiceRef.current, orderId);
    }
  };

  if (error && !showPreview) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed"
        title={error}
      >
        <FileDown size={16} />
        Invoice Unavailable
      </button>
    );
  }

  if (!showPreview) {
    return (
      <button
        onClick={handleDownload}
        disabled={isLoading || isDownloading || !invoiceData}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
      >
        {isDownloading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileDown size={16} />
            Download Invoice
          </>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Invoice Preview</h2>
        <button
          onClick={handleDownload}
          disabled={isLoading || isDownloading || !invoiceData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {isDownloading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown size={16} />
              Download PDF
            </>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      ) : invoiceData ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <InvoiceTemplate data={invoiceData} ref={invoiceRef} />
        </div>
      ) : null}
    </div>
  );
};
