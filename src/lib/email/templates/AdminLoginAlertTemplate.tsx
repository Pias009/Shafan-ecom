import * as React from 'react';
import {
  Section,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import { BaseTemplate } from './BaseTemplate';
import { AdminLoginAlertData } from '../types';

interface AdminLoginAlertTemplateProps extends AdminLoginAlertData {}

export const AdminLoginAlertTemplate = ({
  adminEmail,
  adminName,
  loginTime,
  ipAddress,
  userAgent,
  location = 'Unknown',
}: AdminLoginAlertTemplateProps) => {
  const DOMAIN = 'https://shanafaglobal.com';
  
  return (
    <BaseTemplate
      previewText={`Security Alert: Admin login detected for ${adminEmail}`}
      title="Admin Login Alert 🔒"
    >
      <Text style={paragraph}>
        A new admin login was detected for your SHANFA GLOBAL account.
      </Text>

      <Section style={alertBox}>
        <Text style={alertTitle}>⚠️ Security Notice</Text>
        <Text style={alertText}>
          This is a security notification for an admin login to your account. 
          If this was you, no action is required. If you don't recognize this activity, 
          please secure your account immediately.
        </Text>
      </Section>

      <Section style={detailsSection}>
        <Text style={sectionTitle}>Login Details</Text>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>
            <Text style={labelText}>Admin Account:</Text>
          </Column>
          <Column style={detailValue}>
            <Text style={valueText}>{adminName} ({adminEmail})</Text>
          </Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>
            <Text style={labelText}>Login Time:</Text>
          </Column>
          <Column style={detailValue}>
            <Text style={valueText}>{loginTime}</Text>
          </Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>
            <Text style={labelText}>IP Address:</Text>
          </Column>
          <Column style={detailValue}>
            <Text style={valueText}>{ipAddress}</Text>
          </Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>
            <Text style={labelText}>Location:</Text>
          </Column>
          <Column style={detailValue}>
            <Text style={valueText}>{location}</Text>
          </Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>
            <Text style={labelText}>User Agent:</Text>
          </Column>
          <Column style={detailValue}>
            <Text style={valueText}>{userAgent}</Text>
          </Column>
        </Row>
      </Section>

      <Hr style={divider} />

      <Section style={actionSection}>
        <Text style={sectionTitle}>Recommended Actions</Text>
        
        <Row style={actionRow}>
          <Column style={actionIcon}>✅</Column>
          <Column style={actionText}>
            <Text style={actionTitle}>Verify This Login</Text>
            <Text style={actionDescription}>
              Confirm this login was authorized by you or your team.
            </Text>
          </Column>
        </Row>
        
        <Row style={actionRow}>
          <Column style={actionIcon}>🔐</Column>
          <Column style={actionText}>
            <Text style={actionTitle}>Review Account Security</Text>
            <Text style={actionDescription}>
              Check your account for any suspicious activity or changes.
            </Text>
          </Column>
        </Row>
        
        <Row style={actionRow}>
          <Column style={actionIcon}>🔄</Column>
          <Column style={actionText}>
            <Text style={actionTitle}>Change Password</Text>
            <Text style={actionDescription}>
              If suspicious, change your password immediately.
            </Text>
          </Column>
        </Row>
        
        <Row style={actionRow}>
          <Column style={actionIcon}>📧</Column>
          <Column style={actionText}>
            <Text style={actionTitle}>Contact Support</Text>
            <Text style={actionDescription}>
              Report unauthorized access to our security team.
            </Text>
          </Column>
        </Row>
      </Section>

      <Text style={securityTips}>
        <strong>Security Tips:</strong>
      </Text>
      
      <Text style={tip}>
        • Use strong, unique passwords for your admin accounts
      </Text>
      <Text style={tip}>
        • Enable two-factor authentication (2FA) for added security
      </Text>
      <Text style={tip}>
        • Regularly review admin access logs in your dashboard
      </Text>
      <Text style={tip}>
        • Never share admin credentials via email or chat
      </Text>

      <Hr style={divider} />

      <Text style={footerText}>
        This is an automated security alert from SHANFA GLOBAL. 
        If you have any concerns about your account security, please contact our 
        security team immediately at{' '}
        <a href="mailto:security@shanafaglobal.com" style={link}>
          security@shanafaglobal.com
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

const alertBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const alertTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 12px',
};

const alertText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#92400e',
  margin: '0',
};

const detailsSection = {
  margin: '24px 0',
};

const sectionTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#333',
  margin: '0 0 16px',
};

const detailRow = {
  margin: '12px 0',
};

const detailLabel = {
  width: '140px',
  verticalAlign: 'top' as const,
};

const detailValue = {
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

const divider = {
  borderColor: '#eaeaea',
  margin: '32px 0',
};

const actionSection = {
  margin: '24px 0',
};

const actionRow = {
  margin: '16px 0',
};

const actionIcon = {
  width: '40px',
  fontSize: '20px',
  verticalAlign: 'top' as const,
};

const actionText = {
  verticalAlign: 'top' as const,
};

const actionTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#333',
  margin: '0 0 4px',
};

const actionDescription = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#666',
  margin: '0',
};

const securityTips = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333',
  margin: '24px 0 12px',
};

const tip = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#4b5563',
  margin: '0 0 8px',
  paddingLeft: '8px',
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

export default AdminLoginAlertTemplate;