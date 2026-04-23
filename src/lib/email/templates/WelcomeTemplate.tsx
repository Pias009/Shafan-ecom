import * as React from 'react';
import {
  Button,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import { BaseTemplate } from './BaseTemplate';
import { WelcomeData } from '../types';

interface WelcomeTemplateProps extends WelcomeData {}

export const WelcomeTemplate = ({
  email,
  name,
  loginUrl,
}: WelcomeTemplateProps) => {
  const DOMAIN = 'https://shanafaglobal.com';
  
  return (
    <BaseTemplate
      previewText={`Welcome to SHANFA GLOBAL, ${name || 'Valued Customer'}!`}
      title="Welcome to SHANFA GLOBAL!"
    >
      <Text style={paragraph}>
        Hello {name || 'there'},
      </Text>
      
      <Text style={paragraph}>
        Welcome to SHANFA GLOBAL! We're thrilled to have you join our community of 
        shoppers who value quality, convenience, and exceptional service.
      </Text>

      <Section style={featuresSection}>
        <Row>
          <Column style={featureColumn}>
            <Text style={featureTitle}>🚀 Fast Shipping</Text>
            <Text style={featureText}>
              Get your orders delivered quickly with our reliable shipping partners.
            </Text>
          </Column>
          <Column style={featureColumn}>
            <Text style={featureTitle}>🛡️ Secure Shopping</Text>
            <Text style={featureText}>
              Shop with confidence using our secure payment and data protection.
            </Text>
          </Column>
        </Row>
        <Row>
          <Column style={featureColumn}>
            <Text style={featureTitle}>⭐ Premium Quality</Text>
            <Text style={featureText}>
              Discover carefully curated products that meet our high standards.
            </Text>
          </Column>
          <Column style={featureColumn}>
            <Text style={featureTitle}>📞 24/7 Support</Text>
            <Text style={featureText}>
              Our customer support team is always here to help you.
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={buttonContainer}>
        <Button style={primaryButton} href={loginUrl}>
          Start Shopping Now
        </Button>
      </Section>

      <Text style={paragraph}>
        <strong>Your account is ready to use:</strong>
      </Text>
      
      <Text style={detailText}>
        <strong>Email:</strong> {email}
      </Text>

      <Hr style={divider} />

      <Text style={smallText}>
        <strong>Need help?</strong> Visit our{' '}
        <a href={`${DOMAIN}/help`} style={link}>
          Help Center
        </a>{' '}
        or contact our support team at{' '}
        <a href={`mailto:support@shanafaglobal.com`} style={link}>
          support@shanafaglobal.com
        </a>
      </Text>

      <Text style={smallText}>
        You're receiving this email because you recently created an account on SHANFA GLOBAL.
        If this wasn't you, please{' '}
        <a href={`${DOMAIN}/contact`} style={link}>
          contact us immediately
        </a>.
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

const featuresSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e2e8f0',
};

const featureColumn = {
  padding: '0 12px',
  verticalAlign: 'top' as const,
};

const featureTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#2563eb',
  margin: '0 0 8px',
};

const featureText = {
  fontSize: '13px',
  lineHeight: '18px',
  color: '#4b5563',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const primaryButton = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const detailText = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#4b5563',
  margin: '0 0 12px',
  paddingLeft: '16px',
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

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

export default WelcomeTemplate;