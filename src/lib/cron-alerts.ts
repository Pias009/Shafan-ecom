import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { formatOrderNumber } from "@/lib/order-number";

/**
 * The BNPL verify crons run once a day (Hobby plan), so they can confirm a
 * payment up to ~24h after checkout. By then an admin may already have taken
 * payment again through a Tabby/Tamara portal link and created a manual order
 * in /ueadmin — so warn the admin, flagging any likely duplicate to refund.
 *
 * `ids` are the ids the cron processed: PendingCheckout ids (promoted to an
 * Order) or legacy Order ids. Never throws.
 */
export async function alertLateCronCaptures(provider: "Tabby" | "Tamara", ids: string[]) {
  if (!ids.length || !process.env.ADMIN_EMAIL) return;

  try {
    const rows: string[] = [];
    let duplicates = 0;

    for (const id of ids) {
      const pc = await (prisma as any).pendingCheckout
        .findUnique({ where: { id }, select: { consumedOrderId: true } })
        .catch(() => null);
      const order = await prisma.order.findUnique({
        where: { id: pc?.consumedOrderId || id },
        select: { id: true, email: true, total: true, currency: true, createdAt: true },
      });
      if (!order) continue;

      // A manual order for the same customer around the same time is the
      // likely double payment (portal link taken after the site attempt).
      const duplicate = order.email
        ? await prisma.order.findFirst({
            where: {
              email: order.email,
              id: { not: order.id },
              createdAt: { gte: new Date(order.createdAt.getTime() - 3 * 24 * 60 * 60 * 1000) },
            },
            select: { id: true, total: true, paymentMethod: true },
          })
        : null;
      if (duplicate) duplicates++;

      const amount = `${(order.currency || "AED").toUpperCase()} ${Number(order.total || 0).toFixed(2)}`;
      rows.push(`
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${formatOrderNumber(order.id)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${order.email || "-"}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${amount}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;color:${duplicate ? "#c0392b" : "#28a745"};">
            ${duplicate ? `⚠️ Possible duplicate of ${formatOrderNumber(duplicate.id)} (${duplicate.paymentMethod || "unknown"}, ${Number(duplicate.total || 0).toFixed(2)})` : "No other order found"}
          </td>
        </tr>`);
    }

    if (!rows.length) return;

    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `${duplicates ? "⚠️ " : ""}${provider} payment recovered late by daily check — ${rows.length} order(s)${duplicates ? `, ${duplicates} possible duplicate` : ""}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h2 style="color:#333;">${provider} payments confirmed by the daily check</h2>
          <p style="color:#555;">These customers paid on the website, but the payment was only confirmed now (up to 24 hours late), so the orders below were just created.</p>
          <p style="color:#c0392b;"><strong>If you already took payment from any of them with a ${provider} portal link, refund one of the two payments.</strong></p>
          <table style="border-collapse:collapse;width:100%;max-width:700px;">
            <thead><tr style="text-align:left;color:#666;font-size:12px;">
              <th style="padding:8px;">Order</th><th style="padding:8px;">Customer</th><th style="padding:8px;">Amount</th><th style="padding:8px;">Duplicate check</th>
            </tr></thead>
            <tbody>${rows.join("")}</tbody>
          </table>
        </div>`,
    });
  } catch (err) {
    console.error(`[Cron Alert] ${provider} late-capture alert failed:`, err);
  }
}
