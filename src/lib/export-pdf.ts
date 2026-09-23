'use client';

interface ExportPdfOptions {
  filename?: string;
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
}

export async function exportElementToPdf(
  elementIdOrElement: string | HTMLElement,
  options: ExportPdfOptions
): Promise<void> {
  if (typeof window === 'undefined') return;

  const targetElement =
    typeof elementIdOrElement === 'string'
      ? document.getElementById(elementIdOrElement)
      : elementIdOrElement;

  if (!targetElement) {
    throw new Error('Target element for PDF export was not found.');
  }

  // Dynamically import html2pdf.js to avoid SSR issues
  const html2pdfModule = await import('html2pdf.js');
  const html2pdf = (html2pdfModule as any).default || html2pdfModule;

  // Create a printable container wrapper
  const printWrapper = document.createElement('div');
  printWrapper.style.position = 'absolute';
  printWrapper.style.left = '-9999px';
  printWrapper.style.top = '0';
  printWrapper.style.width = options.orientation === 'landscape' ? '1120px' : '820px';
  printWrapper.style.backgroundColor = '#FFFFFF';
  printWrapper.style.color = '#111827';
  printWrapper.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  printWrapper.style.padding = '32px';

  // Branded Header
  const headerHtml = `
    <div style="border-bottom: 2px solid #000000; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 20px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: #000000;">
          SHANFA GLOBAL
        </div>
        <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #6B7280; margin-top: 2px;">
          Executive Analytics & Intelligence Report
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 13px; font-weight: 800; color: #111827;">${options.title}</div>
        ${options.subtitle ? `<div style="font-size: 10px; color: #6B7280; margin-top: 2px;">${options.subtitle}</div>` : ''}
        <div style="font-size: 9px; color: #9CA3AF; margin-top: 4px;">Generated: ${new Date().toLocaleString()}</div>
      </div>
    </div>
  `;

  // Clone target element
  const clone = targetElement.cloneNode(true) as HTMLElement;

  // Strip elements marked with .no-pdf from the clone
  const noPdfElements = clone.querySelectorAll('.no-pdf');
  noPdfElements.forEach((el) => el.remove());

  // Expand tables or scroll containers so they do not clip
  const scrollContainers = clone.querySelectorAll('.overflow-x-auto, .overflow-y-auto');
  scrollContainers.forEach((el) => {
    (el as HTMLElement).style.overflow = 'visible';
    (el as HTMLElement).style.maxHeight = 'none';
  });

  printWrapper.innerHTML = headerHtml;
  printWrapper.appendChild(clone);

  // Footer
  const footer = document.createElement('div');
  footer.style.marginTop = '32px';
  footer.style.paddingTop = '12px';
  footer.style.borderTop = '1px solid #E5E7EB';
  footer.style.fontSize = '9px';
  footer.style.color = '#9CA3AF';
  footer.style.display = 'flex';
  footer.style.justifyContent = 'space-between';
  footer.innerHTML = `
    <span>Shanfa Global Admin Analytics System &bull; Confidential</span>
    <span>Page 1 of 1</span>
  `;
  printWrapper.appendChild(footer);

  document.body.appendChild(printWrapper);

  const cleanFilename = (options.filename || `${options.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`)
    .replace(/\.pdf$/i, '') + '.pdf';

  const pdfConfig = {
    margin: [10, 10, 12, 10],
    filename: cleanFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: options.orientation || 'portrait',
    },
  };

  try {
    await html2pdf().set(pdfConfig).from(printWrapper).save();
  } finally {
    if (document.body.contains(printWrapper)) {
      document.body.removeChild(printWrapper);
    }
  }
}
