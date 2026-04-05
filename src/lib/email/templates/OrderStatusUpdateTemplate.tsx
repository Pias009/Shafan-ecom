import * as React from 'react';
import {
  Section,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import { BaseTemplate } from './BaseTemplate';

interface OrderStatusUpdateData {
  orderId: string;
  customerName: string;
  status: string;
  message: string;
  items: Array<{ nameSnapshot: string; quantity: number; unitPrice: number }>;
  total: number;
  currency: string;
  shippingAddress?: any;
  trackingUrl?: string;
}

interface OrderStatusUpdateTemplateProps extends OrderStatusUpdateData {}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency || 'USD').toUpperCase(),
  }).format(amount);
};

const getStatusEmoji = (status: string): string => {
  const emojis: Record<string, string> = {
    ORDER_RECEIVED: '📥',
    ORDER_CONFIRMED: '✅',
    PROCESSING: '⚙️',
    READY_FOR_PICKUP: '📦',
    ORDER_PICKED_UP: '🚚',
    IN_TRANSIT: '🚚',
    DELIVERED: '🎉',
    CANCELLED: '❌',
    REFUNDED: '💰',
  };
  return emojis[status] || '📋';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ORDER_CONFIRMED: '#10b981',
    PROCESSING: '#f59e0b',
    READY_FOR_PICKUP: '#8b5cf6',
    ORDER_PICKED_UP: '#3b82f6',
    IN_TRANSIT: '#3b82f6',
    DELIVERED: '#10b981',
    CANCELLED: '#ef4444',
    REFUNDED: '#f59e0b',
  };
  return colors[status] || '#6b7280';
};

export const OrderStatusUpdateTemplate = ({
  orderId,
  customerName,
  status,
  message,
  items,
  total,
  currency,
  shippingAddress,
  trackingUrl,
}: OrderStatusUpdateTemplateProps) => {
  return (
    <BaseTemplate
      previewText={`Order #${orderId} - ${status}`}
      title={`Order Update: #${orderId}`}
    >
      <Text style={paragraph}>
        Hello {customerName},
      </Text>

      <Section style={statusSection}>
        <Text style={statusEmoji}>{getStatusEmoji(status)}</Text>
        <Text style={statusText}>{status.replace(/_/g, ' ')}</Text>
        <Text style={messageText}>{message}</Text>
      </Section>

      <Section style={orderSummary}>
        <Text style={summaryTitle}>Order Details</Text>
        
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
            <Text style={labelText}>Status:</Text>
          </Column>
          <Column style={summaryValue}>
            <Text style={{ ...valueText, color: getStatusColor(status), fontWeight: '600' }}>
              {status.replace(/_/g, ' ')}
            </Text>
          </Column>
        </Row>
      </Section>

      {items && items.length > 0 && (
        <Section style={itemsSection}>
          <Text style={sectionTitle}>Order Items</Text>
          
          {items.map((item, index) => (
            <Row key={index} style={itemRow}>
              <Column style={itemColumn}>
                <Text style={itemName}>{item.nameSnapshot}</Text>
              </Column>
              <Column style={itemColumn}>
                <Text style={itemDetail}>Qty: {item.quantity}</Text>
              </Column>
              <Column style={itemColumn}>
                <Text style={itemDetail}>{formatCurrency(item.unitPrice * item.quantity, currency)}</Text>
              </Column>
            </Row>
          ))}
          
          <Hr style={itemsDivider} />
          
          <Row style={totalRow}>
            <Column style={totalLabel}>
              <Text style={totalText}>Total Amount:</Text>
            </Column>
            <Column style={totalValue}>
              <Text style={totalAmountStyle}>{formatCurrency(total, currency)}</Text>
            </Column>
          </Row>
        </Section>
      )}

      {shippingAddress && (
        <Section style={shippingSection}>
          <Text style={sectionTitle}>Shipping Address</Text>
          <Text style={addressText}>
            {shippingAddress.first_name} {shippingAddress.last_name}<br />
            {shippingAddress.address_1}, {shippingAddress.city}<br />
            {shippingAddress.country}
          </Text>
        </Section>
      )}

      {trackingUrl && (
        <Section style={trackingSection}>
          <Text style={sectionTitle}>Track Your Order</Text>
          <Text style={paragraph}>
            You can track your order using this link:{' '}
            <a href={trackingUrl} style={link}>
              Track Order
            </a>
          </Text>
        </Section>
      )}

      <Hr style={divider} />

      <Text style={smallText}>
        <strong>Need help?</strong> Reply to this email or contact our customer support.
      </Text>

      <Text style={footerNote}>
        Thank you for shopping with Shafan Store!
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

const statusSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #bbf7d0',
};

const statusEmoji = {
  fontSize: '48px',
  margin: '0 0 12px',
};

const statusText = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#166534',
  margin: '0 0 8px',
  textTransform: 'capitalize' as const,
};

const messageText = {
  fontSize: '16px',
  color: '#15803d',
  margin: '0',
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

export default OrderStatusUpdateTemplate;