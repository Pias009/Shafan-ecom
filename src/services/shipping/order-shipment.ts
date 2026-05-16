import { prisma } from "@/lib/prisma";
import { createNaqelShipment, NaqelShipmentRequest } from "./naqel-api";

export async function createShipmentForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new Error(`Order ${orderId} not found`);

  const shippingAddress = order.shippingAddress as any;
  const billingAddress = order.billingAddress as any;

  const naqelRequest: NaqelShipmentRequest = {
    descriptionOfGoods: "Skincare Products",
    cod: order.paymentMethod === "cod" ? Number(order.total) : 0,
    customsDeclaredValue: Number(order.total),
    customsDeclaredValueCurrency: order.currency || "AED",
    consignee: {
      consigneeContact: {
        personName: shippingAddress?.first_name 
          ? `${shippingAddress.first_name} ${shippingAddress.last_name || ""}`.trim()
          : billingAddress?.first_name
          ? `${billingAddress.first_name} ${billingAddress.last_name || ""}`.trim()
          : "Customer",
        phoneNumber1: shippingAddress?.phone || billingAddress?.phone || "0000000000",
        cellPhone: shippingAddress?.phone || billingAddress?.phone || "0000000000",
        emailAddress: order.email || "customer@example.com",
        type: "Business",
      },
      consigneeAddress: {
        countryCode: shippingAddress?.country || "ARE",
        city: shippingAddress?.city || "Dubai",
        line1: shippingAddress?.address_1 || "N/A",
        postCode: shippingAddress?.postal_code || "",
      },
    },
    shipper: {
      shipperAddress: {
        countryCode: process.env.NAQEL_SHIPPER_COUNTRY || "ARE",
        city: process.env.NAQEL_SHIPPER_CITY || "Dubai",
        line1: process.env.NAQEL_SHIPPER_ADDRESS || "Shanfa Store Address",
      },
      shipperContact: {
        personName: process.env.NAQEL_SHIPPER_NAME || "Shanfa Global",
        companyName: process.env.NAQEL_SHIPPER_COMPANY || "Shanfa Global Trading",
        phoneNumber1: process.env.NAQEL_SHIPPER_PHONE || "0000000000",
        cellPhone: process.env.NAQEL_SHIPPER_PHONE || "0000000000",
        emailAddress: process.env.NAQEL_SHIPPER_EMAIL || "info@shanfa.com",
      },
    },
    items: order.items.map((item) => ({
      quantity: item.quantity,
      weight: { unit: 1, value: 0.5 }, // Default weight per item
      customsValue: { currencyCode: order.currency || "AED", value: Number(item.unitPrice) },
      goodsDescription: item.nameSnapshot || "Skincare Product",
      packageType: "Box",
      containsDangerousGoods: false,
    })),
    shipmentWeight: { 
      value: order.items.reduce((sum, item) => sum + (item.quantity * 0.5), 0), 
      weightUnit: 1, 
      length: 20, 
      width: 15, 
      height: 10, 
      dimensionUnit: 1 
    },
    reference: { shipperReference1: order.id, shipperNote1: "" },
  };

  const result = await createNaqelShipment(naqelRequest);
  
  const shipment = Array.isArray(result) ? result[0] : result;
  const awb = shipment?.airwaybill || shipment?.airwaybillNumber || shipment?.AWBNumber || shipment?.awb;
  const labelUrl = shipment?.labelDownloadUrl || shipment?.labelUrl || shipment?.label || null;

  if (awb) {
    await prisma.shipment.upsert({
      where: { orderId: order.id },
      update: {
        trackingCode: awb,
        courier: "Naqel",
        trackingUrl: `https://www.naqelexpress.com/tracking?tracking_number=${awb}`,
        status: "Created",
      },
      create: {
        orderId: order.id,
        trackingCode: awb,
        courier: "Naqel",
        trackingUrl: `https://www.naqelexpress.com/tracking?tracking_number=${awb}`,
        status: "Created",
      },
    });

    // Status update is handled by payment webhooks or admin manual action
  }

  return { success: true, trackingNumber: awb, labelUrl };
}
