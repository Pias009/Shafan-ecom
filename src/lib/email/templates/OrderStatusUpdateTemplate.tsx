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

interface OrderStatusUpdateData {
  orderId: string;
  customerName: string;
  status: string;
  message: string;
  items: Array<{ 
    id?: string;
    nameSnapshot: string; 
    quantity: number; 
    unitPrice: number;
    brand?: string;
    imageUrl?: string;
  }>;
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
  const DOMAIN = 'https://shanafaglobal.com';
  const dashboardUrl = `${DOMAIN}/account`;
  const contactUrl = `${DOMAIN}/contact`;
  const returnsUrl = `${DOMAIN}/returns`;
  const orderUrl = `${DOMAIN}/account/orders/${orderId}`;

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
            <Text style={valueText}>#{orderId}</Text>
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
          
          {items.map((item, index) => {
            const productUrl = item.id ? `${DOMAIN}/product/${item.id}` : undefined;
            
            return (
              <Row key={index} style={itemRow}>
                <Column style={itemImageColumn}>
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt={item.nameSnapshot} 
                      style={productImage}
                      width={60}
                      height={60}
                    />
                  )}
                </Column>
                <Column style={itemDetailsColumn}>
                  <Text style={itemName}>
                    {productUrl ? (
                      <a href={productUrl} style={productLink}>{item.nameSnapshot}</a>
                    ) : item.nameSnapshot}
                  </Text>
                  {item.brand && <Text style={itemBrand}>{item.brand}</Text>}
                  <Text style={itemDetail}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={itemPriceColumn}>
                  <Text style={itemDetail}>{formatCurrency(item.unitPrice * item.quantity, currency)}</Text>
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
        <Section style={actionSection}>
          <Text style={actionTitle}>Track Your Order</Text>
          <Row style={actionRow}>
            <Column style={actionBtnColumn}>
              <Button href={trackingUrl} style={primaryButton}>
                🚚 Track Package
              </Button>
            </Column>
            <Column style={actionSpacer} />
            <Column style={actionBtnColumn}>
              <Button href={orderUrl} style={secondaryButton}>
                📋 View Order
              </Button>
            </Column>
          </Row>
        </Section>
      )}

      <Hr style={divider} />

      <Section style={helpSection}>
        <Text style={helpTitle}>Need Help?</Text>
        
        <Row style={helpRow}>
          <Column style={helpLabel}>
            <Text style={helpLabelText}>📋 Dashboard</Text>
          </Column>
          <Column style={helpValue}>
            <Text style={linkText}>
              <a href={dashboardUrl} style={link}>View all orders</a>
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
            <Text style={helpLabelText}>🔄 Returns</Text>
          </Column>
          <Column style={helpValue}>
            <Text style={linkText}>
              <a href={returnsUrl} style={link}>Easy return process</a>
            </Text>
          </Column>
        </Row>
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

export default OrderStatusUpdateTemplate;