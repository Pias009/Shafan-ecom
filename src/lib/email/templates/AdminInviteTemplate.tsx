import * as React from 'react';
import {
  Button,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import { BaseTemplate } from './BaseTemplate';

interface AdminInviteData {
  email: string;
  inviterName?: string;
  setupUrl: string;
  role: string;
}

interface AdminInviteTemplateProps extends AdminInviteData {}

export const AdminInviteTemplate = ({
  email,
  inviterName = 'Super Admin',
  setupUrl,
  role = 'ADMIN',
}: AdminInviteTemplateProps) => {
  return (
    <BaseTemplate
      previewText={`You've been invited to join Shafan Store as ${role}`}
      title="Admin Invitation"
    >
      <Text style={paragraph}>
        Hello,
      </Text>
      
      <Text style={paragraph}>
        You've been invited to join <strong>Shafan Store</strong> as an <strong>{role}</strong>. 
        This is a privileged role with access to the store's administrative dashboard.
      </Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          <strong>Invited by:</strong> {inviterName}
        </Text>
        <Text style={infoText}>
          <strong>Your role:</strong> {role}
        </Text>
        <Text style={infoText}>
          <strong>Email:</strong> {email}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={primaryButton} href={setupUrl}>
          Set Up Your Account
        </Button>
      </Section>

      <Text style={paragraph}>
        Click the button above to set up your password and complete your account initialization. 
        You'll need to complete this setup before you can access the admin dashboard.
      </Text>

      <Hr style={divider} />

      <Text style={smallText}>
        <strong>Important:</strong>
      </Text>
      <Text style={smallText}>
        • This invitation is personal and should not be shared<br/>
        • The setup link will expire after 7 days<br/>
        • Your IP and login attempts are monitored for security
      </Text>

      <Hr style={divider} />

      <Text style={smallText}>
        If you didn't expect this invitation, please contact the system administrator immediately.
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

const infoBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e2e8f0',
};

const infoText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#4b5563',
  margin: '0 0 8px'
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const primaryButton = {
  backgroundColor: '#000',
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

export default AdminInviteTemplate;