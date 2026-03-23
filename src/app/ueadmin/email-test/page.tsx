"use client";

import { useState } from 'react';
import { Mail, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

type EmailTemplate = 'magic-link' | 'welcome' | 'password-reset' | 'order-confirmation' | 'admin-login-alert';

interface TestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  logs?: any[];
}

export default function EmailTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [email, setEmail] = useState('test@example.com');
  const [name, setName] = useState('Test User');

  const templates: { id: EmailTemplate; label: string; description: string }[] = [
    { id: 'magic-link', label: 'Magic Link', description: 'Authentication magic link email' },
    { id: 'welcome', label: 'Welcome Email', description: 'New user welcome email' },
    { id: 'password-reset', label: 'Password Reset', description: 'Password reset request email' },
    { id: 'order-confirmation', label: 'Order Confirmation', description: 'Order confirmation with details' },
    { id: 'admin-login-alert', label: 'Admin Login Alert', description: 'Security alert for admin logins' },
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
      }, ...prev.slice(0, 4)]); // Keep last 5 results
      
    } catch (error: any) {
      setResults(prev => [{
        success: false,
        error: error.message || 'Network error'
      }, ...prev.slice(0, 4)]);
    } finally {
      setLoading(false);
    }
  };

  const testAll = async () => {
    for (const template of templates) {
      await testEmail(template.id);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black">Email System Test</h1>
          <p className="text-sm font-medium text-black/30 mt-1 uppercase tracking-[0.2em]">
            Test email templates and verify delivery
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={clearResults}
            className="px-6 py-3 rounded-full bg-black/5 text-black/60 hover:bg-black/10 font-bold text-sm transition-colors"
          >
            Clear Results
          </button>
          <button
            onClick={testAll}
            disabled={loading}
            className="px-6 py-3 rounded-full bg-black text-white hover:bg-black/80 font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Test All Templates
          </button>
        </div>
      </div>

      {/* Email Configuration */}
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
            
            <div className="pt-4">
              <div className="text-xs font-bold text-black/50">
                <AlertCircle size={14} className="inline mr-2" />
                Emails will be sent using the configured provider (Resend)
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
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
              <span className="text-sm font-bold text-black/60">API Key</span>
              <span className="px-3 py-1 rounded-full bg-black/10 text-black text-xs font-black">
                {process.env.RESEND_API_KEY ? 'Configured' : 'Missing'}
              </span>
            </div>
            
            <div className="pt-4">
              <button
                onClick={() => window.location.reload()}
                className="text-xs font-bold text-black/40 hover:text-black transition-colors"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Templates */}
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

      {/* Test Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-3xl border border-black/5 p-8">
          <h2 className="text-xl font-black text-black mb-6">Test Results</h2>
          
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
                  
                  <div className="text-xs font-black text-black/40">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
                
                {result.logs && result.logs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-black/10">
                    <details className="text-sm">
                      <summary className="cursor-pointer font-bold text-black/60 hover:text-black">
                        View Log Details
                      </summary>
                      <pre className="mt-2 p-4 bg-black/5 rounded-xl text-xs overflow-auto">
                        {JSON.stringify(result.logs[0], null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Development Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-8">
        <h2 className="text-xl font-black text-yellow-800 mb-4 flex items-center gap-2">
          <AlertCircle size={20} />
          Development Notes
        </h2>
        
        <div className="space-y-3 text-yellow-800/80">
          <p className="font-bold">
            For development/testing without domain verification:
          </p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>The email system automatically uses <code className="bg-yellow-100 px-2 py-1 rounded">onboarding@resend.dev</code> in development mode</li>
            <li>This bypasses domain verification requirements</li>
            <li>Real emails will be sent to the test address</li>
            <li>For production, verify your domain at <a href="https://resend.com/domains" className="underline font-bold">resend.com/domains</a></li>
          </ul>
          
          <div className="pt-4">
            <button
              onClick={() => testEmail('admin-login-alert')}
              className="px-6 py-3 rounded-full bg-yellow-600 text-white font-bold text-sm hover:bg-yellow-700 transition-colors"
            >
              Test Admin Login Alert (Simulates Real Login)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}