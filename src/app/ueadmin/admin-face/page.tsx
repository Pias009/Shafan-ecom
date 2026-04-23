"use client";

import { useState } from 'react';
import { ScanFace, Loader2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SimpleFaceEnrollment() {
  const [loading, setLoading] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminName, setAdminName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const handleGenerate = async () => {
    if (!adminId.trim()) {
      toast.error('Please enter Admin ID');
      return;
    }
    if (!adminName.trim()) {
      toast.error('Please enter Admin Name');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/face/enrollment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: adminId.trim(), adminName: adminName.trim() })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setGeneratedLink(data.enrollmentLink);
        toast.success('Link generated!');
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Copied!');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white">
            <ScanFace size={24} />
          </div>
          <h1 className="text-2xl font-black">Face Enrollment Link</h1>
        </div>

        {generatedLink ? (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-2xl flex items-center gap-2">
              <Check className="text-green-600" size={20} />
              <span className="text-green-800 font-bold">Link Generated!</span>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">One-time Link</label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={generatedLink}
                  className="flex-1 h-12 bg-gray-100 rounded-xl px-3 text-sm"
                />
                <button 
                  onClick={copyLink}
                  className="px-4 bg-black text-white rounded-xl"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              This link expires in 24 hours. Send it to the admin to enroll their face.
            </p>
            
            <button
              onClick={() => { setGeneratedLink(''); setAdminId(''); setAdminName(''); }}
              className="w-full py-3 text-sm text-gray-500 underline"
            >
              Generate Another
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Admin ID</label>
              <input
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="e.g., john-admin"
                className="w-full h-12 bg-gray-100 rounded-xl px-4 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Admin Name</label>
              <input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g., John Doe"
                className="w-full h-12 bg-gray-100 rounded-xl px-4 text-sm"
              />
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Generate Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}