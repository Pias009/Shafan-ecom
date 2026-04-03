"use client";

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, AlertCircle, RefreshCw, Send, Eye } from 'lucide-react';

type EmailTemplate = 'magic-link' | 'welcome' | 'password-reset' | 'order-confirmation' | 'admin-login-alert' | 'order-status-update';

interface TestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  logs?: any[];
}

interface EmailLog {
  id: string;
  template: string;
  recipient: string;
  subject: string;
  status: string;
  sentAt: Date;
  error?: string;
}

interface SystemStatus {
  enabled: boolean;
  provider: string;
  testMode: boolean;
  totalSent: number;
  totalFailed: number;
}

export default function EmailTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [email, setEmail] = useState('test@example.com');
  const [name, setName] = useState('Test User');
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'test' | 'logs' | 'custom'>('test');
  const [customEmail, setCustomEmail] = useState({ to: '', subject: '', message: '' });

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const fetchEmailLogs = async () => {
    try {
      const response = await fetch('/api/email/test');
      const data = await response.json();
      setLogs(data.logs || []);
      setStatus(data.status);
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
    }
  };

  const templates: { id: EmailTemplate; label: string; description: string }[] = [
    { id: 'magic-link', label: 'Magic Link', description: 'Authentication magic link email' },
    { id: 'welcome', label: 'Welcome Email', description: 'New user welcome email' },
    { id: 'password-reset', label: 'Password Reset', description: 'Password reset request email' },
    { id: 'order-confirmation', label: 'Order Confirmation', description: 'Order confirmation with details' },
    { id: 'admin-login-alert', label: 'Admin Login Alert', description: 'Security alert for admin logins' },
    { id: 'order-status-update', label: 'Order Status Update', description: 'Order status change notification' },
  ];

  const testEmail = async (template: EmailTemplate) => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, email, name }),
      });

      const data = await response.json();
      
      setResults(prev => [{
        success: data.success,
        messageId: data.messageId,
        error: data.error,
        logs: data.logs
      }, ...prev.slice(0, 4)]);
      
      fetchEmailLogs();
      
    } catch (error: any) {
      setResults(prev => [{
        success: false,
        error: error.message || 'Network error'
      }, ...prev.slice(0, 4)]);
    } finally {
      setLoading(false);
    }
  };

  const sendCustomEmail = async () => {
    if (!customEmail.to || !customEmail.subject) {
      alert('Please enter email address and subject');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/email/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customEmail.to,
          subject: customEmail.subject,
          message: customEmail.message,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Email sent successfully!');
        setCustomEmail({ to: '', subject: '', message: '' });
        fetchEmailLogs();
      } else {
        alert(`Failed to send email: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAll = async () => {
    for (const template of templates) {
      await testEmail(template.id);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black">Email System</h1>
          <p className="text-sm font-medium text-black/30 mt-1 uppercase tracking-[0.2em]">
            Test, send & view email logs
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEmailLogs}
            className="px-6 py-3 rounded-full bg-black/5 text-black/60 hover:bg-black/10 font-bold text-sm transition-colors"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={testAll}
            disabled={loading}
            className="px-6 py-3 rounded-full bg-black text-white hover:bg-black/80 font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Test All
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-black/10">
        <button
          onClick={() => setActiveTab('test')}
          className={`pb-4 px-4 font-black text-sm uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'test' 
              ? 'border-black text-black' 
              : 'border-transparent text-black/40 hover:text-black'
          }`}
        >
          <Mail size={16} className="inline mr-2" />
          Test Templates
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-4 px-4 font-black text-sm uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'logs' 
              ? 'border-black text-black' 
              : 'border-transparent text-black/40 hover:text-black'
          }`}
        >
          <Eye size={16} className="inline mr-2" />
          Email Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`pb-4 px-4 font-black text-sm uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'custom' 
              ? 'border-black text-black' 
              : 'border-transparent text-black/40 hover:text-black'
          }`}
        >
          <Send size={16} className="inline mr-2" />
          Send Custom
        </button>
      </div>

      {/* Test Templates Tab */}
      {activeTab === 'test' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-black/5 p-8">
              <h2 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                <Mail size={20} />
                Test Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                    Test Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="test@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="Test User"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-black/5 p-8">
              <h2 className="text-xl font-black text-black mb-6">System Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black/60">Environment</span>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                    {process.env.NODE_ENV || 'development'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black/60">Email Provider</span>
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-black">
                    Resend
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black/60">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${status?.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {status?.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black/60">Total Sent</span>
                  <span className="text-sm font-black text-black">{status?.totalSent || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black/60">Total Failed</span>
                  <span className="text-sm font-black text-black">{status?.totalFailed || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-black/5 p-8">
            <h2 className="text-xl font-black text-black mb-6">Available Templates</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-6 rounded-2xl bg-black/5 hover:bg-black/10 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-black text-black text-lg">{template.label}</h3>
                      <p className="text-sm text-black/50 mt-1">{template.description}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black">
                      {template.id.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => testEmail(template.id)}
                    disabled={loading}
                    className="w-full h-10 rounded-full bg-black text-white font-bold text-sm hover:bg-black/80 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Test This Template'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {results.length > 0 && (
            <div className="bg-white rounded-3xl border border-black/5 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-black">Test Results</h2>
                <button onClick={clearResults} className="text-xs font-bold text-black/40 hover:text-black">
                  Clear
                </button>
              </div>
              
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border ${
                      result.success
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle size={24} className="text-green-600" />
                        ) : (
                          <XCircle size={24} className="text-red-600" />
                        )}
                        <div>
                          <h3 className="font-black text-black">
                            {result.success ? 'Email Sent Successfully' : 'Email Failed'}
                          </h3>
                          {result.messageId && (
                            <p className="text-sm text-black/60 mt-1">
                              Message ID: {result.messageId}
                            </p>
                          )}
                          {result.error && (
                            <p className="text-sm text-red-600 mt-1 font-bold">
                              Error: {result.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Email Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-black/5 p-8">
          <h2 className="text-xl font-black text-black mb-6">Email Logs</h2>
          
          {logs.length === 0 ? (
            <div className="text-center py-12 text-black/40">
              No emails sent yet
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-6 rounded-2xl border ${
                    log.status === 'sent' 
                      ? 'border-green-200 bg-green-50/50' 
                      : log.status === 'failed'
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-yellow-200 bg-yellow-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {log.status === 'sent' ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : log.status === 'failed' ? (
                        <XCircle size={20} className="text-red-600" />
                      ) : (
                        <AlertCircle size={20} className="text-yellow-600" />
                      )}
                      <div>
                        <h3 className="font-black text-black">{log.subject}</h3>
                        <p className="text-sm text-black/60 mt-1">
                          To: {log.recipient} | Template: {log.template}
                        </p>
                        {log.error && (
                          <p className="text-sm text-red-600 mt-1">Error: {log.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${
                        log.status === 'sent' 
                          ? 'bg-green-100 text-green-800' 
                          : log.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.status.toUpperCase()}
                      </span>
                      <p className="text-xs text-black/40 mt-2">
                        {new Date(log.sentAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Email Tab */}
      {activeTab === 'custom' && (
        <div className="bg-white rounded-3xl border border-black/5 p-8">
          <h2 className="text-xl font-black text-black mb-6">Send Custom Email</h2>
          
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                Recipient Email Address
              </label>
              <input
                type="email"
                value={customEmail.to}
                onChange={(e) => setCustomEmail(prev => ({ ...prev, to: e.target.value }))}
                className="w-full h-12 rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-black/20"
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                Subject Line
              </label>
              <input
                type="text"
                value={customEmail.subject}
                onChange={(e) => setCustomEmail(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full h-12 rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-black/20"
                placeholder="Your order has been shipped!"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                Message
              </label>
              <textarea
                value={customEmail.message}
                onChange={(e) => setCustomEmail(prev => ({ ...prev, message: e.target.value }))}
                className="w-full h-40 rounded-2xl bg-black/5 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black/20 resize-none"
                placeholder="Write your custom message here..."
              />
            </div>

            <button
              onClick={sendCustomEmail}
              disabled={loading || !customEmail.to || !customEmail.subject}
              className="w-full h-14 rounded-full bg-black text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-black/80 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Custom Email
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}