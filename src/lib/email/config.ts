/**
 * Email Configuration for Resend Provider
 */

import { EmailConfig } from './types';

export const getEmailConfig = (): EmailConfig => {
  // Default to enabled if not specified
  const enabled = process.env.EMAIL_ENABLED !== 'false';
  const logEnabled = process.env.EMAIL_LOG_ENABLED === 'true';
  const testMode = process.env.NODE_ENV !== 'production';
  
  // Use development from email if specified, otherwise use configured from email
  let fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@shafan-store.com';
  const fromName = process.env.RESEND_FROM_NAME || 'Shafan Store';
  
  // Allow override for development testing
  if (testMode && process.env.DEV_FROM_EMAIL) {
    fromEmail = process.env.DEV_FROM_EMAIL;
  }
  
  return {
    enabled,
    provider: 'resend',
    fromEmail,
    fromName,
    logEnabled,
    testMode,
    testEmail: process.env.TEST_EMAIL || 'test@example.com',
  };
};

export const getResendApiKey = (): string => {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || apiKey === 're_') {
    throw new Error('RESEND_API_KEY is not configured. Please add it to your environment variables.');
  }
  
  return apiKey;
};

export const isEmailEnabled = (): boolean => {
  return getEmailConfig().enabled;
};

export const shouldLogEmails = (): boolean => {
  return getEmailConfig().logEnabled;
};

export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      enabled: true,
      logToConsole: true,
      redirectAllTo: process.env.DEV_EMAIL_REDIRECT,
    },
    test: {
      enabled: false,
      logToConsole: true,
      redirectAllTo: null,
    },
    staging: {
      enabled: true,
      logToConsole: false,
      redirectAllTo: process.env.STAGING_EMAIL_REDIRECT,
    },
    production: {
      enabled: true,
      logToConsole: false,
      redirectAllTo: null,
    },
  };
  
  return configs[env as keyof typeof configs] || configs.development;
};