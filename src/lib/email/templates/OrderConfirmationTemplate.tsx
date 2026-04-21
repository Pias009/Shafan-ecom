import * as React from 'react';
import {
  Section,
  Text,
  Hr,
  Row,
  Column,
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
}: OrderConfirmationTemplateProps) => {
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalAmount);

  return (
    <BaseTemplate
      previewText={`Your order #${orderId} has been confirmed`}
      title={`Order Confirmed: #${orderId}`}
    >
      <Text style={paragraph}>
        Hello {customerName},
      </Text>
      
      <Text style={paragraph}>
        Thank you for your order! We've received your order and are preparing it for shipment.
        You'll receive another email when your order ships.
      </Text>

      <Section style={orderSummary}>
        <Text style={summaryTitle}>Order Summary</Text>
        
        <Row style={summaryRow}>
          <Column style={summaryLabel}>
            <Text style={labelText}>Order Number:</Text>
          </Column>
          <Column style={summaryValue}>
            <Text style={valueText}>{orderId}</Text>
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
            <Text style={labelText}>Email:</Text>
          </Column>
          <Column style={summaryValue}>
            <Text style={valueText}>{customerEmail}</Text>
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
          
          return (
            <Row key={index} style={itemRow}>
              <Column style={itemColumn}>
                <Text style={itemName}>{item.name}</Text>
              </Column>
              <Column style={itemColumn}>
                <Text style={itemDetail}>Qty: {item.quantity}</Text>
              </Column>
              <Column style={itemColumn}>
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

      {trackingUrl && (
        <Section style={trackingSection}>
          <Text style={sectionTitle}>Tracking Information</Text>
          <Text style={paragraph}>
            You can track your order using this link:{' '}
            <a href={trackingUrl} style={link}>
              Track Your Order
            </a>
          </Text>
        </Section>
      )}

      <Hr style={divider} />

      <Text style={smallText}>
        <strong>Need to make changes to your order?</strong>{' '}
        Please contact our customer support team within 1 hour of placing your order.
      </Text>

      <Text style={smallText}>
        <strong>Questions about your order?</strong>{' '}
        Reply to this email or contact us at{' '}
        <a href="mailto:orders@shanfa-store.com" style={link}>
          orders@shanfa-store.com
        </a>
      </Text>

      <Text style={footerNote}>
        We'll send you shipping updates as your order progresses. 
        Thank you for shopping with SHANFA STORE!
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

const itemColumn = {
  verticalAlign: 'top' as const,
};

const itemName = {
  fontSize: '15px',
  fontWeight: '500',
  color: '#333',
  margin: '0 0 4px',
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
  color: '#2563eb',
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

const trackingSection = {
  margin: '24px 0',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const divider = {
  borderColor: '#eaeaea',
  margin: '32px 0',
};

const smallText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#666',
  margin: '0 0 16px',
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