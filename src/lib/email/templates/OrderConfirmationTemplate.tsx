import * as React from 'react';
import {
  Section,
  Text,
  Hr,
  Row,
  Column,
  Button,
} from '@react-email/components';
import { BaseTemplate } from './BaseTemplate';
import { OrderConfirmationData } from '../types';

interface OrderConfirmationTemplateProps extends OrderConfirmationData {}

export const OrderConfirmationTemplate = ({
  orderId,
  customerName,
  customerEmail,
  orderDate,
  items,
  totalAmount,
  shippingAddress,
  trackingUrl,
  paymentStatus = 'Paid',
  paymentMethod,
  estimatedDelivery = '2-3 business days',
}: OrderConfirmationTemplateProps) => {
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalAmount);

  const DOMAIN = 'https://shanafaglobal.com';
  const dashboardUrl = `${DOMAIN}/account`;
  const contactUrl = `${DOMAIN}/contact`;
  const returnsUrl = `${DOMAIN}/returns`;
  const cancelUrl = `${DOMAIN}/account/orders/${orderId}`;
  const isCOD = paymentStatus === 'Cash on Delivery';

  return (
    <BaseTemplate
      previewText={`Your order #${orderId} has been confirmed`}
      title={`Order Confirmed: #${orderId}`}
    >
      <Text style={paragraph}>
        Hello {customerName},
      </Text>
      
      <Text style={paragraph}>
        Thank you for your order! We've received it and are preparing it for shipment.
        You'll receive another email when your order ships.
      </Text>

      <Section style={orderSummary}>
        <Text style={summaryTitle}>Order Summary</Text>
        
        <Row style={summaryRow}>
          <Column style={summaryLabel}>
            <Text style={labelText}>Order Number:</Text>
          </Column>
          <Column style={summaryValue}>
            <Text style={valueText}>#{orderId}</Text>
          </Column>
        </Row>
        
        <Row style={summaryRow}>
          <Column style={summaryLabel}>
            <Text style={labelText}>Order Date:</Text>
          </Column>
          <Column style={summaryValue}>
            <Text style={valueText}>{orderDate}</Text>
          </Column>
        </Row>
        
        <Row style={summaryRow}>
          <Column style={summaryLabel}>
            <Text style={labelText}>Payment:</Text>
          </Column>
          <Column style={summaryValue}>
            <Text style={{...valueText, color: isCOD ? '#f59e0b' : '#10b981', fontWeight: 600}}>{paymentStatus}</Text>
          </Column>
        </Row>
        
        <Row style={summaryRow}>
          <Column style={summaryLabel}>
            <Text style={labelText}>Est. Delivery:</Text>
          </Column>
          <Column style={summaryValue}>
            <Text style={valueText}>{estimatedDelivery}</Text>
          </Column>
        </Row>
      </Section>

      <Section style={itemsSection}>
        <Text style={sectionTitle}>Order Items</Text>
        
        {items.map((item, index) => {
          const itemTotal = item.price * item.quantity;
          const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(itemTotal);
          const productUrl = `${DOMAIN}/product/${item.id}`;
          
          return (
            <Row key={index} style={itemRow}>
              <Column style={itemImageColumn}>
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    style={productImage}
                    width={60}
                    height={60}
                  />
                )}
              </Column>
              <Column style={itemDetailsColumn}>
                <Text style={itemName}>
                  <a href={productUrl} style={productLink}>{item.name}</a>
                </Text>
                {item.brand && <Text style={itemBrand}>{item.brand}</Text>}
                <Text style={itemDetail}>Qty: {item.quantity}</Text>
              </Column>
              <Column style={itemPriceColumn}>
                <Text style={itemDetail}>{formattedPrice}</Text>
              </Column>
            </Row>
          );
        })}
        
        <Hr style={itemsDivider} />
        
        <Row style={totalRow}>
          <Column style={totalLabel}>
            <Text style={totalText}>Total Amount:</Text>
          </Column>
          <Column style={totalValue}>
            <Text style={totalAmountStyle}>{formattedTotal}</Text>
          </Column>
        </Row>
      </Section>

      <Section style={shippingSection}>
        <Text style={sectionTitle}>Shipping Address</Text>
        <Text style={addressText}>{shippingAddress}</Text>
      </Section>

      <Hr style={divider} />

      <Section style={actionSection}>
        <Text style={actionTitle}>Quick Actions</Text>
        
        <Row style={actionRow}>
          <Column style={actionBtnColumn}>
            <Button href={trackingUrl} style={primaryButton}>
              Track Order 🚚
            </Button>
          </Column>
          <Column style={actionSpacer} />
          <Column style={actionBtnColumn}>
            <Button href={dashboardUrl} style={secondaryButton}>
              View Order 📋
            </Button>
          </Column>
        </Row>
      </Section>

      <Section style={helpSection}>
        <Text style={helpTitle}>Need Help?</Text>
        
        <Row style={helpRow}>
          <Column style={helpLabel}>
            <Text style={helpLabelText}>📋 Order Dashboard</Text>
          </Column>
          <Column style={helpValue}>
            <Text style={linkText}>
              <a href={dashboardUrl} style={link}>View all orders, track & manage</a>
            </Text>
          </Column>
        </Row>
        
        <Row style={helpRow}>
          <Column style={helpLabel}>
            <Text style={helpLabelText}>💬 Contact Us</Text>
          </Column>
          <Column style={helpValue}>
            <Text style={linkText}>
              <a href={contactUrl} style={link}>Chat or email support</a>
            </Text>
          </Column>
        </Row>
        
        <Row style={helpRow}>
          <Column style={helpLabel}>
            <Text style={helpLabelText}>❌ Cancel Order</Text>
          </Column>
          <Column style={helpValue}>
            <Text style={linkText}>
              <a href={cancelUrl} style={link}>Cancel within 30 min</a>
            </Text>
          </Column>
        </Row>
        
        <Row style={helpRow}>
          <Column style={helpLabel}>
            <Text style={helpLabelText}>🔄 Request Refund</Text>
          </Column>
          <Column style={helpValue}>
            <Text style={linkText}>
              <a href={returnsUrl} style={link}>Easy return process</a>
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={cancelInfo}>
        <Text style={cancelInfoText}>
          ⏱️ <strong>Cancellation:</strong> You can cancel your order within 30 minutes of placing it. 
          Go to <a href={dashboardUrl} style={link}>your order dashboard</a> and click "Cancel Order".
        </Text>
      </Section>

      <Text style={footerNote}>
        Thank you for shopping with SHANFA STORE! 💚
      </Text>
    </BaseTemplate>
  );
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333',
  margin: '0 0 24px',
};

const orderSummary = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #e2e8f0',
};

const summaryTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#333',
  margin: '0 0 16px',
};

const summaryRow = {
  margin: '8px 0',
};

const summaryLabel = {
  width: '120px',
  verticalAlign: 'top' as const,
};

const summaryValue = {
  verticalAlign: 'top' as const,
};

const labelText = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#4b5563',
  margin: '0',
};

const valueText = {
  fontSize: '14px',
  color: '#333',
  margin: '0',
};

const itemsSection = {
  margin: '24px 0',
};

const sectionTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#333',
  margin: '0 0 16px',
};

const itemRow = {
  margin: '12px 0',
  paddingBottom: '12px',
  borderBottom: '1px solid #eaeaea',
};

const itemImageColumn = {
  width: '70px',
  verticalAlign: 'top' as const,
};

const itemDetailsColumn = {
  verticalAlign: 'top' as const,
  paddingLeft: '12px',
};

const itemPriceColumn = {
  width: '80px',
  verticalAlign: 'top' as const,
  textAlign: 'right' as const,
};

const productImage = {
  width: '60px',
  height: '60px',
  objectFit: 'cover' as const,
  borderRadius: '8px',
  border: '1px solid #eaeaea',
};

const itemName = {
  fontSize: '15px',
  fontWeight: '500',
  color: '#333',
  margin: '0 0 4px',
};

const productLink = {
  color: '#333',
  textDecoration: 'none',
};

const itemBrand = {
  fontSize: '12px',
  color: '#666',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const itemDetail = {
  fontSize: '14px',
  color: '#666',
  margin: '0',
};

const itemsDivider = {
  borderColor: '#eaeaea',
  margin: '16px 0',
};

const totalRow = {
  margin: '16px 0 0',
};

const totalLabel = {
  textAlign: 'right' as const,
  paddingRight: '16px',
};

const totalValue = {
  textAlign: 'right' as const,
};

const totalText = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333',
  margin: '0',
};

const totalAmountStyle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#10b981',
  margin: '0',
};

const shippingSection = {
  margin: '24px 0',
};

const addressText = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#4b5563',
  backgroundColor: '#f8fafc',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  margin: '0',
};

const actionSection = {
  margin: '24px 0',
};

const actionTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333',
  margin: '0 0 16px',
};

const actionRow = {
  margin: '12px 0',
};

const actionBtnColumn = {
  width: '180px',
  verticalAlign: 'top' as const,
};

const actionSpacer = {
  width: '16px',
};

const primaryButton = {
  backgroundColor: '#000',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
};

const secondaryButton = {
  backgroundColor: '#fff',
  color: '#000',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  border: '1px solid #000',
  display: 'inline-block',
};

const helpSection = {
  margin: '24px 0',
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #bbf7d0',
};

const helpTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#166534',
  margin: '0 0 16px',
};

const helpRow = {
  margin: '12px 0',
};

const helpLabel = {
  width: '140px',
  verticalAlign: 'top' as const,
};

const helpValue = {
  verticalAlign: 'top' as const,
};

const helpLabelText = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#166534',
  margin: '0',
};

const linkText = {
  fontSize: '14px',
  color: '#166534',
  margin: '0',
};

const link = {
  color: '#166534',
  textDecoration: 'underline',
};

const cancelInfo = {
  margin: '24px 0',
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #fde68a',
};

const cancelInfoText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#92400e',
  margin: '0',
};

const divider = {
  borderColor: '#eaeaea',
  margin: '32px 0',
};

const footerNote = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#4b5563',
  fontStyle: 'italic' as const,
  margin: '24px 0 0',
  textAlign: 'center' as const,
};

export default OrderConfirmationTemplate;