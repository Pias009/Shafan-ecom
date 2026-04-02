'use client';

import { useCallback, useState } from 'react';

export const useInvoiceDownload = () => {
  const [isLoading, setIsLoading] = useState(false);

  const downloadInvoice = useCallback(async (elementRef: HTMLDivElement | null, orderId: string) => {
    if (!elementRef) {
      console.error('Invoice element not found');
      return;
    }

    setIsLoading(true);

    try {
      // Dynamically import html2pdf to reduce bundle size
      const html2pdf = (await import('html2pdf.js')).default;

      const options = {
        margin: 10,
        filename: `invoice-${orderId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };

      html2pdf().set(options).from(elementRef).save();
    } catch (error) {
      console.error('Error downloading invoice:', error);
      // Fallback: Print to PDF using browser print dialog
      window.print();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { downloadInvoice, isLoading };
};
