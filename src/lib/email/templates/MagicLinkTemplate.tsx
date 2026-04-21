import * as React from 'react';
import {
  Button,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import { BaseTemplate } from './BaseTemplate';
import { MagicLinkData } from '../types';

interface MagicLinkTemplateProps extends MagicLinkData {}

export const MagicLinkTemplate = ({
  email,
  name,
  magicLink,
  expiresIn = '15 minutes',
}: MagicLinkTemplateProps) => {
  return (
    <BaseTemplate
      previewText={`Your magic link to sign in to SHANFA STORE`}
      title="Sign In to Your Account"
    >
      <Text style={paragraph}>
        Hello {name || 'there'},
      </Text>
      
      <Text style={paragraph}>
        You requested a magic link to sign in to your SHANFA STORE account. 
        Click the button below to securely sign in:
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={magicLink}>
          Sign In to SHANFA STORE
        </Button>
      </Section>

      <Text style={paragraph}>
        This magic link will expire in <strong>{expiresIn}</strong>. 
        If you didn't request this sign-in link, you can safely ignore this email.
      </Text>

      <Hr style={divider} />

      <Text style={smallText}>
        <strong>Security Tip:</strong> For your security, never share this link with anyone. 
        SHANFA STORE will never ask for your password via email.
      </Text>

      <Text style={smallText}>
        Having trouble with the button? Copy and paste this URL into your browser:
      </Text>
      
      <Text style={linkText}>
        {magicLink}
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
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
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

const linkText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#2563eb',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f8fafc',
  padding: '12px',
  borderRadius: '4px',
  border: '1px solid #e2e8f0',
};

export default MagicLinkTemplate;