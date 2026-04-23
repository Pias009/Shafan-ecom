import * as React from 'react';
import {
  Button,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import { BaseTemplate } from './BaseTemplate';
import { PasswordResetData } from '../types';

interface PasswordResetTemplateProps extends PasswordResetData {}

export const PasswordResetTemplate = ({
  email,
  name,
  resetLink,
  expiresIn = '1 hour',
}: PasswordResetTemplateProps) => {
  const DOMAIN = 'https://shanafaglobal.com';
  
  return (
    <BaseTemplate
      previewText={`Reset your SHANFA GLOBAL password`}
      title="Reset Your Password"
    >
      <Text style={paragraph}>
        Hello {name || 'there'},
      </Text>
      
      <Text style={paragraph}>
        We received a request to reset the password for your SHANFA GLOBAL account 
        associated with <strong>{email}</strong>. Click the button below to create a new password:
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={resetLink}>
          Reset Your Password
        </Button>
      </Section>

      <Text style={paragraph}>
        This password reset link will expire in <strong>{expiresIn}</strong>. 
        If you didn't request a password reset, you can safely ignore this email.
      </Text>

      <Hr style={divider} />

      <Text style={smallText}>
        <strong>Security Information:</strong>
      </Text>
      
      <Text style={tip}>
        • This link can only be used once to reset your password
      </Text>
      <Text style={tip}>
        • For security reasons, this link will expire after {expiresIn}
      </Text>
      <Text style={tip}>
        • Never share your password reset link with anyone
      </Text>
      <Text style={tip}>
        • SHANFA GLOBAL will never ask for your password via email
      </Text>

      <Text style={smallText}>
        Having trouble with the button? Copy and paste this URL into your browser:
      </Text>
      
      <Text style={linkText}>
        {resetLink}
      </Text>

      <Hr style={divider} />

      <Text style={footerText}>
        If you continue to have issues or didn't request this password reset, 
        please contact our support team at{' '}
        <a href="mailto:support@shanafaglobal.com" style={link}>
          support@shanafaglobal.com
        </a>
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const divider = {
  borderColor: '#eaeaea',
  margin: '32px 0',
};

const smallText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#666',
  margin: '0 0 12px',
};

const tip = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#4b5563',
  margin: '0 0 8px',
  paddingLeft: '8px',
};

const linkText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#2563eb',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f8fafc',
  padding: '12px',
  borderRadius: '4px',
  border: '1px solid #e2e8f0',
  margin: '16px 0',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#666',
  margin: '24px 0 0',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

export default PasswordResetTemplate;