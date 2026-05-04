import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');
    const { getAdminApiSession } = await import('@/lib/admin-session');
    const PDFDocument = (await import('pdfkit')).default;

    const session = await getAdminApiSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: true,
        store: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ── Data extraction ────────────────────────────────────────────────────────
    const billing  = order.billingAddress  as Record<string, unknown> | null;
    const shipping = order.shippingAddress as Record<string, unknown> | null;

    const customerName =
      order.user?.name ||
      (billing?.first_name ? `${billing.first_name} ${billing.last_name || ''}`.trim() : null) ||
      'Guest';
    const customerEmail = order.user?.email || (billing?.email as string) || '';
    const customerPhone = (billing?.phone as string) || (shipping?.phone as string) || '';
    const rawPaymentMethod = order.paymentMethodTitle || order.paymentMethod || '';

    const paymentMethod = (() => {
      const m = rawPaymentMethod.toLowerCase();
      if (m === 'cod' || m === 'cash on delivery' || m === 'cash_on_delivery') return 'Cash on Delivery';
      if (m === 'card' || m === 'stripe' || m === 'online') return 'Credit Card (Stripe)';
      return rawPaymentMethod || 'N/A';
    })();

    const fmt = (amount: number, currency = order.currency || 'AED'): string => {
      const code = (currency || 'AED').toUpperCase();
      const dec  = ['KWD', 'BHD', 'OMR'].includes(code) ? 3 : 2;
      return `${code} ${(amount || 0).toFixed(dec)}`;
    };

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'long', day: '2-digit',
    });

    const subtotal     = order.subtotal     || 0;
    const shippingCost = order.shipping     || 0;
    const discount     = order.discount     || 0;
    const total        = order.total        || 0;
    const taxRate      = order.taxRate      || 0;
    const taxValue     = order.taxAmount    || 0;
    const invoiceNum   = (order.id || '').slice(-8).toUpperCase();

    // ── PDF generation ─────────────────────────────────────────────────────────
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end',  () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ── Layout constants ────────────────────────────────────────────────
        const PW  = 595.28;   // A4 width  in points
        const PH  = 841.89;   // A4 height in points
        const ML  = 45;       // left  margin
        const MR  = 45;       // right margin
        const CW  = PW - ML - MR; // 505.28  usable width

        // Colours
        const C_DARK    = '#0F172A';
        const C_MID     = '#475569';
        const C_LIGHT   = '#94A3B8';
        const C_RULE    = '#E2E8F0';
        const C_STRIPE  = '#F8FAFC';
        const C_BLUE    = '#2563EB';
        const C_DARK_BG = '#0F172A';

        // ── Helper: draw a horizontal rule ──────────────────────────────────
        const rule = (y: number, w = 0.5, colour = C_RULE) =>
          doc.moveTo(ML, y).lineTo(PW - MR, y).lineWidth(w).strokeColor(colour).stroke();

        // ── 1. HEADER ───────────────────────────────────────────────────────
        // Dark top strip
        doc.rect(0, 0, PW, 90).fill(C_DARK_BG);

        // Company name & info (white on dark)
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#FFFFFF')
           .text('Al Shanfa General Trading Co. L.L.C', ML, 22);
        doc.fontSize(8.5).font('Helvetica').fillColor('#94A3B8')
           .text('Dubai, United Arab Emirates  ·  TRN: 104177488400003', ML, 40);

        // "INVOICE" label on the right
        doc.fontSize(22).font('Helvetica-Bold').fillColor('#FFFFFF')
           .text('INVOICE', 0, 24, { align: 'right', width: PW - MR });
        doc.fontSize(9).font('Helvetica').fillColor('#94A3B8')
           .text(`No. INV-${invoiceNum}`, 0, 51, { align: 'right', width: PW - MR });
        doc.fontSize(9).font('Helvetica').fillColor('#CBD5E1')
           .text(`Date: ${orderDate}`, 0, 64, { align: 'right', width: PW - MR });

        // ── 2. INFO GRID (Bill To | Ship To | Order Details) ────────────────
        let curY = 110;

        // Three equal columns
        const INFO_GAP = 20;
        const INFO_W   = (CW - INFO_GAP * 2) / 3;
        const col1X    = ML;
        const col2X    = ML + INFO_W + INFO_GAP;
        const col3X    = ML + (INFO_W + INFO_GAP) * 2;

        // Section label helper
        const sLabel = (text: string, x: number, y: number) =>
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C_LIGHT)
             .text(text.toUpperCase(), x, y, { width: INFO_W, characterSpacing: 0.8 });

        sLabel('Bill To',       col1X, curY);
        sLabel('Ship To',       col2X, curY);
        sLabel('Order Details', col3X, curY);

        curY += 16;

        // ── Bill To ──
        let b1Y = curY;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(C_DARK)
           .text(customerName, col1X, b1Y, { width: INFO_W });
        b1Y += 14;

        const bAddr = [
          billing?.address_1 as string,
          billing?.address_2 as string,
          billing?.city as string,
          billing?.country as string,
        ].filter(Boolean).join(', ');

        if (bAddr) {
          doc.fontSize(8.5).font('Helvetica').fillColor(C_MID)
             .text(bAddr, col1X, b1Y, { width: INFO_W, lineGap: 2 });
          b1Y += doc.heightOfString(bAddr, { width: INFO_W, lineGap: 2 }) + 3;
        }
        if (customerEmail) {
          doc.fontSize(8.5).font('Helvetica').fillColor(C_MID)
             .text(customerEmail, col1X, b1Y, { width: INFO_W });
          b1Y += 13;
        }
        if (customerPhone) {
          doc.fontSize(8.5).font('Helvetica').fillColor(C_MID)
             .text(`Ph: ${customerPhone}`, col1X, b1Y, { width: INFO_W });
          b1Y += 13;
        }

        // ── Ship To ──
        let b2Y = curY;
        const shipName = [shipping?.first_name as string, shipping?.last_name as string]
          .filter(Boolean).join(' ') || customerName;

        doc.fontSize(10).font('Helvetica-Bold').fillColor(C_DARK)
           .text(shipName, col2X, b2Y, { width: INFO_W });
        b2Y += 14;

        const sAddr = [
          shipping?.address_1 as string,
          shipping?.address_2 as string,
          shipping?.city as string,
          shipping?.country as string,
        ].filter(Boolean).join(', ');

        if (sAddr) {
          doc.fontSize(8.5).font('Helvetica').fillColor(C_MID)
             .text(sAddr, col2X, b2Y, { width: INFO_W, lineGap: 2 });
          b2Y += doc.heightOfString(sAddr, { width: INFO_W, lineGap: 2 }) + 3;
        }
        if (shipping?.phone) {
          doc.fontSize(8.5).font('Helvetica').fillColor(C_MID)
             .text(`Ph: ${shipping.phone}`, col2X, b2Y, { width: INFO_W });
          b2Y += 13;
        }

        // ── Order Details ──
        let b3Y = curY;
        const infoRows: [string, string][] = [
          ['Order #',   invoiceNum],
          ['Payment',   paymentMethod],
          ['Currency',  (order.currency || 'AED').toUpperCase()],
          ['Status',    order.status.replace(/_/g, ' ')],
        ];
        const LBL_W = 60;
        const VAL_W = INFO_W - LBL_W - 5;
        infoRows.forEach(([lbl, val]) => {
          doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C_DARK)
             .text(lbl + ':', col3X, b3Y, { width: LBL_W });
          doc.fontSize(8.5).font('Helvetica').fillColor(C_MID)
             .text(val, col3X + LBL_W + 5, b3Y, { width: VAL_W });
          b3Y += 15;
        });

        curY = Math.max(b1Y, b2Y, b3Y) + 22;
        rule(curY - 8);

        // ── 3. TABLE ────────────────────────────────────────────────────────
        // Column layout — all x are absolute page positions, no formula drift
        // CW = 505.28, ML = 45  → rightEdge = 550.28
        // Column layout: all positions absolute, right edge = PW - MR = 550.28
        // num(20) + gap(3) + desc(180) + gap(3) + hs(58) + gap(3) + qty(30) + gap(3) + price(73) + gap(3) + disc(57) + gap(3) + total(70) = 505 = CW ✓
        const T = {
          num:   { x: ML,       w: 20  },  // 45  → 65
          desc:  { x: ML + 23,  w: 180 },  // 68  → 248
          hs:    { x: ML + 206, w: 58  },  // 251 → 309
          qty:   { x: ML + 267, w: 30  },  // 312 → 342
          price: { x: ML + 300, w: 73  },  // 345 → 418
          disc:  { x: ML + 376, w: 57  },  // 421 → 478
          total: { x: ML + 436, w: 69.28 },// 481 → 550.28 ← exact right margin
        };

        const TH = 26; // table header height

        const drawTableHeader = (y: number) => {
          doc.rect(ML, y, CW, TH).fill(C_DARK_BG);
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
          doc.text('#',           T.num.x,   y + 9, { width: T.num.w,   align: 'center' });
          doc.text('DESCRIPTION', T.desc.x,  y + 9, { width: T.desc.w });
          doc.text('HS CODE',     T.hs.x,    y + 9, { width: T.hs.w,   align: 'center' });
          doc.text('QTY',         T.qty.x,   y + 9, { width: T.qty.w,  align: 'center' });
          doc.text('UNIT PRICE',  T.price.x, y + 9, { width: T.price.w, align: 'right' });
          doc.text('DISCOUNT',    T.disc.x,  y + 9, { width: T.disc.w,  align: 'right' });
          doc.text('TOTAL',       T.total.x, y + 9, { width: T.total.w, align: 'right' });
        };

        drawTableHeader(curY);
        curY += TH;

        // Pre-compute proportional discounts
        const totalItemsValue = (order.items || []).reduce(
          (s: number, it: any) => s + (it.unitPrice || 0) * (it.quantity || 0), 0
        );

        (order.items || []).forEach((item: any, idx: number) => {
          const name     = item.nameSnapshot || item.product?.name || 'Unknown Item';
          const qty      = item.quantity  || 0;
          const price    = item.unitPrice || 0;
          const hsCode   = item.product?.hsCode || '33049901';
          const weight   = item.weightSnapshot   || 0;
          const wUnit    = item.weightUnitSnapshot || 'kg';

          const lineVal  = price * qty;
          const propDisc = totalItemsValue > 0 ? (lineVal / totalItemsValue) * discount : 0;
          const lineTotal = lineVal - propDisc;

          // Height: name text + metadata sub-line + padding
          doc.fontSize(9).font('Helvetica-Bold'); // set font for heightOfString
          const nameH  = doc.heightOfString(name, { width: T.desc.w });
          const rowH   = Math.max(36, nameH + 22);

          // Page overflow check
          if (curY + rowH > PH - 120) {
            doc.addPage();
            curY = ML;
            drawTableHeader(curY);
            curY += TH;
          }

          // Zebra stripe (even rows get a tint)
          if (idx % 2 === 0) {
            doc.rect(ML, curY, CW, rowH).fill(C_STRIPE);
          }

          const rowMidY = curY + Math.floor((rowH - nameH) / 2) - 3;

          // #
          doc.fontSize(9).font('Helvetica').fillColor(C_MID)
             .text(String(idx + 1), T.num.x, rowMidY + 2, { width: T.num.w, align: 'center' });

          // Description (bold name + small metadata below)
          doc.fontSize(9).font('Helvetica-Bold').fillColor(C_DARK)
             .text(name, T.desc.x, rowMidY, { width: T.desc.w });
          doc.fontSize(7).font('Helvetica').fillColor(C_LIGHT)
             .text(`Wt: ${weight} ${wUnit}`, T.desc.x, rowMidY + nameH + 2, { width: T.desc.w });

          // HS Code
          doc.fontSize(8.5).font('Helvetica').fillColor(C_MID)
             .text(hsCode, T.hs.x, rowMidY + 2, { width: T.hs.w, align: 'center' });

          // QTY
          doc.fontSize(9).font('Helvetica-Bold').fillColor(C_DARK)
             .text(String(qty), T.qty.x, rowMidY + 2, { width: T.qty.w, align: 'center' });

          // Unit price
          doc.fontSize(9).font('Helvetica').fillColor(C_MID)
             .text(fmt(price), T.price.x, rowMidY + 2, { width: T.price.w, align: 'right' });

          // Discount
          doc.fontSize(9).font('Helvetica').fillColor(propDisc > 0 ? '#DC2626' : C_MID)
             .text(propDisc > 0 ? `-${fmt(propDisc)}` : '—', T.disc.x, rowMidY + 2, { width: T.disc.w, align: 'right' });

          // Line total
          doc.fontSize(9).font('Helvetica-Bold').fillColor(C_DARK)
             .text(fmt(lineTotal), T.total.x, rowMidY + 2, { width: T.total.w, align: 'right' });

          // Bottom rule
          rule(curY + rowH, 0.4, '#E8EEF4');
          curY += rowH;
        });

        // ── 4. TOTALS BLOCK ─────────────────────────────────────────────────
        curY += 20;

        // Summary sits in the right 220pt
        const SUM_X     = PW - MR - 220;   // absolute left edge of summary block
        const SUM_LBL_W = 130;             // label column width
        const SUM_VAL_W = 90;              // value column width
        const SUM_VAL_X = SUM_X + SUM_LBL_W; // = SUM_X + 130

        const sumLine = (
          label: string,
          value: string,
          bold      = false,
          colour    = C_MID,
          valColour = C_DARK,
        ) => {
          doc.fontSize(bold ? 10 : 9)
             .font(bold ? 'Helvetica-Bold' : 'Helvetica')
             .fillColor(colour)
             .text(label, SUM_X, curY, { width: SUM_LBL_W, align: 'right' });
          doc.fontSize(bold ? 10 : 9)
             .font(bold ? 'Helvetica-Bold' : 'Helvetica')
             .fillColor(valColour)
             .text(value, SUM_VAL_X, curY, { width: SUM_VAL_W, align: 'right' });
          curY += bold ? 22 : 18;
        };

        sumLine('Subtotal:', fmt(subtotal));
        if (discount > 0) sumLine('Discount:', `-${fmt(discount)}`, false, '#DC2626', '#DC2626');
        sumLine(`VAT (${(taxRate * 100).toFixed(0)}%):`, fmt(taxValue));
        sumLine('Shipping:', fmt(shippingCost));

        // Grand total separator
        doc.moveTo(SUM_X, curY - 4)
           .lineTo(PW - MR, curY - 4)
           .lineWidth(1)
           .strokeColor('#CBD5E1')
           .stroke();
        curY += 4;

        sumLine('GRAND TOTAL:', fmt(total), true, C_BLUE, C_BLUE);

        // ── 5. PAYMENT SUMMARY ───────────────────────────────────────────────
        curY += 24;
        const BOX_H   = 62;
        const BOX_GAP = 14;
        const BOX_W   = (CW - BOX_GAP) / 2;  // ~245.64

        // Left box — payment method
        doc.rect(ML, curY, BOX_W, BOX_H).fill(C_STRIPE)
           .rect(ML, curY, 3, BOX_H).fill('#94A3B8');

        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C_LIGHT)
           .text('PAYMENT METHOD', ML + 12, curY + 12);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(C_DARK)
           .text(paymentMethod, ML + 12, curY + 26);

        const isPaid    = order.paymentStatus === 'PAID';
        const badgeClr  = isPaid ? '#16A34A' : '#D97706';
        const badgeBg   = isPaid ? '#DCFCE7' : '#FEF3C7';
        const statusTxt = isPaid ? 'PAID' : 'PENDING';
        doc.rect(ML + 12, curY + 44, 46, 13).fill(badgeBg);
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(badgeClr)
           .text(statusTxt, ML + 12, curY + 47, { width: 46, align: 'center' });

        // Right box — amount
        const RB = ML + BOX_W + BOX_GAP;
        doc.rect(RB, curY, BOX_W, BOX_H).fill('#EFF6FF')
           .rect(RB, curY, 3, BOX_H).fill(C_BLUE);

        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C_BLUE)
           .text('AMOUNT PAID', RB + 12, curY + 12);
        doc.fontSize(17).font('Helvetica-Bold').fillColor('#1D4ED8')
           .text(fmt(total), RB + 12, curY + 24, { width: BOX_W - 18 });

        curY += BOX_H + 28;

        // ── 6. NOTES & TERMS ────────────────────────────────────────────────
        rule(curY - 4);

        doc.fontSize(9).font('Helvetica-Bold').fillColor(C_DARK)
           .text('Notes & Terms', ML, curY + 8);

        const notes = [
          'Returns are accepted within 7 days of delivery in original, unused condition.',
          `VAT at ${(taxRate * 100).toFixed(0)}% is included in the grand total where applicable.`,
          'For queries, contact us at support@shanfaglobal.com or call +971 04 838 7827.',
        ];
        notes.forEach((note, i) => {
          doc.fontSize(8).font('Helvetica').fillColor(C_MID)
             .text(`${i + 1}.  ${note}`, ML, curY + 24 + i * 13, { width: CW });
        });

        // ── 7. FOOTER ────────────────────────────────────────────────────────
        const footerY = PH - 36;
        doc.rect(0, PH - 28, PW, 28).fill('#F1F5F9');
        doc.fontSize(7.5).font('Helvetica').fillColor(C_LIGHT)
           .text(
             'Al Shanfa General Trading Co. L.L.C  ·  Dubai, UAE  ·  support@shanfaglobal.com  ·  Computer-generated — no signature required',
             0, footerY,
             { align: 'center', width: PW }
           );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${id.slice(-8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to generate invoice', details: message }, { status: 500 });
  }
}
