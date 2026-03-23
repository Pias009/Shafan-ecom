import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Img,
  Row,
  Column,
} from '@react-email/components';

interface BaseTemplateProps {
  previewText?: string;
  children: React.ReactNode;
  title?: string;
}

export const BaseTemplate = ({ 
  previewText = 'Email from Shafan Store',
  children,
  title 
}: BaseTemplateProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Row>
              <Column align="center">
                <Img
                  src="https://shafan-store.com/logo.png"
                  width="120"
                  height="40"
                  alt="Shafan Store"
                  style={logo}
                />
              </Column>
            </Row>
          </Section>

          {title && (
            <Section style={titleSection}>
              <Heading style={titleStyle}>{title}</Heading>
            </Section>
          )}

          <Section style={content}>
            {children}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © {currentYear} Shafan Store. All rights reserved.
            </Text>
            <Text style={footerText}>
              This email was sent to you as part of your Shafan Store account.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://shafan-store.com/privacy" style={link}>
                Privacy Policy
              </Link>
              {' • '}
              <Link href="https://shafan-store.com/terms" style={link}>
                Terms of Service
              </Link>
              {' • '}
              <Link href="https://shafan-store.com/unsubscribe" style={link}>
                Unsubscribe
              </Link>
            </Text>
            <Text style={footerAddress}>
              Shafan Store • 123 Business Street • City, State 12345
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  maxWidth: '600px',
};

const header = {
  padding: '24px 48px',
  borderBottom: '1px solid #eaeaea',
};

const logo = {
  margin: '0 auto',
};

const titleSection = {
  padding: '32px 48px 16px',
};

const titleStyle = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#333',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 48px 32px',
};

const footer = {
  padding: '32px 48px',
  borderTop: '1px solid #eaeaea',
  backgroundColor: '#f9f9f9',
  borderRadius: '0 0 8px 8px',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '16px',
  color: '#666',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const footerLinks = {
  fontSize: '12px',
  lineHeight: '16px',
  color: '#666',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const footerAddress = {
  fontSize: '11px',
  lineHeight: '14px',
  color: '#999',
  margin: '16px 0 0',
  textAlign: 'center' as const,
};

export default BaseTemplate;